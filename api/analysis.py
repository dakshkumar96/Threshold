"""One /analyze request, from a role (and optionally a CV) to the full result.

The steps, in order: read the inputs, work out the candidate's level, find
the ads, match employers to the register, count skills, build the sponsor
lists, review the CV, then put the answer together.
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any

import pandas as pd
from fastapi import BackgroundTasks, HTTPException, UploadFile

import settings
from cv_feedback import (
    generate_cv_feedback,
    skills_to_learn_from_gaps,
    where_you_are_from_match,
)
from dynamic_skills import match_cv_to_skills, skill_frequencies
from experience_level import (
    LEVELS,
    filter_jobs_by_experience,
    infer_cv_level,
    level_band,
)
from match_sponsors import match_jobs_to_sponsors

from . import config
from .cv_upload import read_cv_text
from .job_filters import passes_min_salary
from .job_search import (
    employer_keys,
    fetch_ats_jobs,
    level_search_term,
    merge_dedupe,
    probe_unknown_employers,
    search_jobs,
    sponsor_register_keys,
)
from .register_data import retention_by_key
from .sponsors import build_sponsor_list, top_hiring_companies

TENURE_CAVEAT = (
    "Licence tenure from our register archive (left-truncated) - "
    "not a guarantee of active hiring"
)
ACCURACY_NOTE = (
    "Verified jobs are from company careers pages and identity is certain. "
    "Likely and Possible jobs are name-matched to the register and accurate "
    "in about 59 of 100 cases in our tests. Skills are counted from Reed "
    "full-text job descriptions where available. See ACCURACY.md for the "
    "full methodology."
)
NO_CV_MESSAGE = "Upload a CV to get a match score, skill gaps, and recruiter review."
_NEW_ENTRANT_YES = {"1", "true", "yes", "on"}

logger = logging.getLogger(__name__)


@dataclass
class _StageTimer:
    """Seconds spent in each step of one search, for the log. It never changes the answer."""

    started: float = field(default_factory=time.perf_counter)
    seconds: dict[str, float] = field(default_factory=dict)

    def mark(self, stage: str) -> None:
        now = time.perf_counter()
        self.seconds[stage] = now - self.started - sum(self.seconds.values())

    def summary(self) -> str:
        steps = " ".join(f"{stage}={value:.1f}s" for stage, value in self.seconds.items())
        return f"{steps} total={time.perf_counter() - self.started:.1f}s"


# --- reading the request -------------------------------------------------------------


@dataclass(frozen=True)
class SearchParams:
    role: str
    new_entrant: bool
    min_salary: float | None
    exp_auto: bool  # read the level from the CV
    exp_requested: str | None  # a level the user picked ("auto" and "any" are None)

    @property
    def salary_threshold(self) -> float:
        if self.new_entrant:
            return config.SKILLED_WORKER_NEW_ENTRANT_MIN
        return config.SKILLED_WORKER_GENERAL_MIN

    @property
    def level_label(self) -> str:
        return self.exp_requested or ("auto" if self.exp_auto else "any")


def parse_search_params(
    role: str, min_salary: str, experience_level: str, is_new_entrant: str
) -> SearchParams:
    role = (role or "").strip()
    if len(role) < 2:
        raise HTTPException(status_code=400, detail="Role is required.")

    # "" or "auto": read the level from the CV (all levels when there is no CV).
    # "any": deliberately no level filter. Anything else is the level the user
    # picked, which always wins over the CV.
    level = (experience_level or "").strip().lower()
    exp_auto = level in {"", "auto", "cv"}
    exp_requested = None if exp_auto or level in {"any", "all"} else level

    min_salary_value: float | None = None
    raw = (min_salary or "").strip()
    if raw:
        try:
            min_salary_value = float(raw.replace(",", "").replace("£", ""))
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="The minimum salary must be a number."
            ) from exc
        if min_salary_value < 0:
            raise HTTPException(status_code=400, detail="The minimum salary cannot be negative.")

    return SearchParams(
        role=role,
        new_entrant=(is_new_entrant or "").strip().lower() in _NEW_ENTRANT_YES,
        min_salary=min_salary_value,
        exp_auto=exp_auto,
        exp_requested=exp_requested,
    )


@dataclass(frozen=True)
class LevelChoice:
    level: str | None
    source: str | None  # "cv" or "you"
    reason: str | None


def choose_level(params: SearchParams, cv_text: str) -> LevelChoice:
    """The level to filter by: the one picked, or the one read from the CV."""
    if params.exp_auto and cv_text:
        inferred = infer_cv_level(cv_text)
        if inferred:
            return LevelChoice(inferred["level"], "cv", inferred["reason"])
    return LevelChoice(params.exp_requested, "you" if params.exp_requested else None, None)


# --- finding and matching ads ----------------------------------------------------------


def collect_ads(
    role: str, level_term: str | None, min_salary: float | None
) -> tuple[pd.DataFrame, pd.DataFrame | None]:
    jobs, level_jobs = search_jobs(role, level_term)
    if jobs.empty:
        raise HTTPException(
            status_code=404, detail="No jobs found for that role. Try a broader title."
        )
    jobs = jobs.drop_duplicates(subset=["source", "source_job_id"], keep="first").reset_index(drop=True)

    if min_salary is not None:
        jobs = jobs[jobs.apply(lambda r: passes_min_salary(r, min_salary), axis=1)]
        jobs = jobs.reset_index(drop=True)
        if jobs.empty:
            raise HTTPException(
                status_code=404,
                detail="No jobs met your minimum salary. Ads that do not show a salary are kept, so try a lower number.",
            )
    return jobs, level_jobs


def match_ads(
    jobs: pd.DataFrame, role: str, min_salary: float | None
) -> tuple[pd.DataFrame, list[tuple[str, str]]]:
    """Match employers to the register and add ads from known employer boards.

    Also returns the current sponsors worth probing for a careers board later.
    """
    matched = match_jobs_to_sponsors(jobs)
    ats_jobs = fetch_ats_jobs([key for key, _ in employer_keys(matched)], role)
    if min_salary is not None and not ats_jobs.empty:
        ats_jobs = ats_jobs[ats_jobs.apply(lambda r: passes_min_salary(r, min_salary), axis=1)]
        ats_jobs = ats_jobs.reset_index(drop=True)
    matched = merge_dedupe(ats_jobs, matched)
    if "sponsor_confidence" not in matched.columns:
        matched["sponsor_confidence"] = None
    return matched, sponsor_register_keys(matched)


# --- skills ---------------------------------------------------------------------------------


@dataclass(frozen=True)
class SkillAnalysis:
    jobs: pd.DataFrame  # the ads the skill counts came from
    filter_applied: bool
    filter_count: int
    filter_note: str
    frequencies: list[dict[str, Any]]
    jobs_counted: int
    scored: dict[str, Any] | None  # the CV against those skills


def analyse_skills(matched: pd.DataFrame, level: str | None, cv_text: str) -> SkillAnalysis:
    jobs, applied, count, note = filter_jobs_by_experience(matched, level)
    freq = skill_frequencies(jobs, sponsors_only=False, top_n=30)
    jobs_counted = (
        int(freq["n_jobs"].iloc[0])
        if not freq.empty and "n_jobs" in freq.columns
        else len(jobs)
    )
    return SkillAnalysis(
        jobs=jobs,
        filter_applied=applied,
        filter_count=count,
        filter_note=note,
        frequencies=[
            {
                "skill": r.skill,
                "share_pct": round(100 * float(r.share), 1),
                "count": int(r.count),
                "essential_share_pct": round(100 * float(r.essential_share), 1),
            }
            for r in freq.itertuples()
        ],
        jobs_counted=jobs_counted,
        scored=match_cv_to_skills(cv_text, freq) if cv_text else None,
    )


# --- sponsor lists ----------------------------------------------------------------------------


@dataclass(frozen=True)
class Opportunities:
    sponsors: list[dict[str, Any]]
    top_companies: list[dict]
    top_from_sponsors: bool
    hidden_by_level: int
    filter_applied: bool
    filter_count: int
    filter_note: str


def build_opportunities(
    matched: pd.DataFrame, level: str | None, salary_threshold: float, cv_text: str | None
) -> Opportunities:
    """The sponsor cards and top companies, limited to roles that fit the level.

    Unlike the skill pool this never falls back to every level: a short list
    of roles someone can get beats a full one padded with lead and principal
    roles they cannot.
    """
    retention = retention_by_key()
    rows = matched[matched["is_sponsor"] | matched["is_possible_sponsor"]].copy()
    total = len(rows)
    rows, applied, count, note = filter_jobs_by_experience(
        rows, level, context="Sponsor list", fallback_to_all=False
    )
    sponsor_rows = rows[rows["is_sponsor"]].copy()
    possible_rows = rows[rows["is_possible_sponsor"]].copy()
    top_from_sponsors = not sponsor_rows.empty

    shared = {"cv_text": cv_text, "salary_threshold": salary_threshold, "candidate_level": level}
    sponsors = build_sponsor_list(sponsor_rows, retention, **shared)
    sponsors.extend(build_sponsor_list(possible_rows, retention, possible=True, **shared))
    return Opportunities(
        sponsors=sponsors,
        top_companies=top_hiring_companies(sponsor_rows if top_from_sponsors else matched, retention),
        top_from_sponsors=top_from_sponsors,
        hidden_by_level=total - len(rows),
        filter_applied=applied,
        filter_count=count,
        filter_note=note,
    )


# --- the CV review -----------------------------------------------------------------------------


@dataclass(frozen=True)
class CvReview:
    feedback: dict[str, Any] | None
    message: str
    skills_to_learn: list[dict[str, Any]]
    where_you_are: str | None
    scored: dict[str, Any] | None  # the skill match, adjusted by the review when it could be


def review_cv(
    params: SearchParams,
    cv_text: str,
    skills: SkillAnalysis,
    level: LevelChoice,
) -> CvReview:
    scored = skills.scored
    if not cv_text or scored is None:
        return CvReview(None, NO_CV_MESSAGE, [], None, scored)

    skills_to_learn = skills_to_learn_from_gaps(scored.get("gaps"))
    where_you_are: str | None = where_you_are_from_match(scored)
    feedback = generate_cv_feedback(
        params.role,
        cv_text,
        skills.frequencies,
        scored,
        jobs=skills.jobs,
        jobs_analyzed_for_skills=skills.jobs_counted,
        candidate_level=level.level,
        candidate_level_reason=level.reason,
    )
    if feedback is None:
        return CvReview(
            None,
            "The AI review is switched off because no AI key is set up.",
            skills_to_learn,
            where_you_are,
            scored,
        )

    if feedback.get("error"):
        reason = re.sub(r"\s+", " ", str(feedback["error"])).strip()[:220]
        message = (
            f"The AI review did not work this time. {reason} "
            "Your skill match results below are still valid."
        )
        return CvReview(feedback, message, skills_to_learn, where_you_are, scored)

    if feedback.get("where_you_are"):
        where_you_are = str(feedback["where_you_are"])
    # The review judges each top skill from the CV itself (skills shown in
    # other words, blocking versus nice-to-have gaps). Where its evidence
    # checked out against the CV text, that replaces the keyword-only match.
    adjusted = feedback.pop("adjusted_match", None)
    if adjusted is not None:
        scored = adjusted
        skills_to_learn = feedback["skills_to_learn"]
    feedback["skills_to_learn"] = skills_to_learn
    feedback["jobs_in_skill_analysis"] = skills.jobs_counted
    return CvReview(feedback, "ok", skills_to_learn, where_you_are, scored)


# --- the answer -----------------------------------------------------------------------------------


def _score_fields(scored: dict[str, Any] | None, top_companies: list[dict]) -> dict[str, Any]:
    if scored is None:
        return {
            "score": None,
            "score_label": None,
            "matched_count": None,
            "top_n": None,
            "readiness_pct": None,
            "matched_skills": [],
            "gaps": [],
            "gap_suggestion": None,
        }
    return {
        "score": scored["score"],
        "keyword_score": scored.get("keyword_score", scored["score"]),
        "score_label": scored["label"],
        "matched_count": scored["matched_count"],
        "top_n": scored["top_n"],
        "readiness_pct": scored.get("readiness_pct", scored["score"]),
        "matched_skills": scored["matched"],
        "gaps": scored["gaps"][:20],
        "gap_suggestion": scored.get("gap_suggestion"),
        "chart": {
            "gap_bars": [
                {
                    "skill": g["skill"],
                    "frequency_pct": g["frequency_pct"],
                    "ease_weeks": g.get("ease_weeks"),
                    "priority_score": g.get("priority_score"),
                }
                for g in scored["gaps"][:12]
            ],
            "matched_bars": [
                {"skill": m["skill"], "frequency_pct": m["frequency_pct"]}
                for m in scored["matched"][:12]
            ],
            "top_companies": top_companies,
        },
    }


def _use_review_score(result: dict[str, Any], feedback: dict[str, Any] | None) -> None:
    """Make the AI review's score the main score when there is one.

    The keyword match only counts skills found in the ads, so a role with few
    known skills can reach 100% while the review says the CV is a poor fit.
    The review reads the whole CV against the ads, so its score leads and the
    keyword match stays available as `keyword_score`.
    """
    ai_score = (feedback or {}).get("score_out_of_100")
    if isinstance(ai_score, bool) or not isinstance(ai_score, (int, float)):
        return
    score = float(min(100, max(0, ai_score)))
    result["keyword_score"] = result.get("keyword_score")
    result["score"] = score
    result["readiness_pct"] = score
    result["score_label"] = "CV review score, from your CV and the job ads"


def run_analysis(
    *,
    role: str,
    cv_text: str,
    cv_file: UploadFile | None,
    min_salary: str,
    experience_level: str,
    is_new_entrant: str,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    timer = _StageTimer()
    params = parse_search_params(role, min_salary, experience_level, is_new_entrant)
    text = read_cv_text(cv_text, cv_file)
    timer.mark("read_cv")
    has_cv = bool(text.strip())
    if has_cv and not settings.llm_api_key():
        raise HTTPException(
            status_code=503,
            detail="CV review is not set up on this server yet. Please try again later.",
        )
    cv = text if has_cv else ""

    level = choose_level(params, cv)
    level_term = level_search_term(params.role, level.level)
    jobs, level_jobs = collect_ads(params.role, level_term, params.min_salary)
    timer.mark("job_boards")
    matched, employers = match_ads(jobs, params.role, params.min_salary)
    timer.mark("register_match")

    skills = analyse_skills(matched, level.level, cv)
    opportunities = build_opportunities(
        matched, level.level, params.salary_threshold, text if has_cv else None
    )
    timer.mark("skills_and_sponsors")
    review = review_cv(params, cv, skills, level)
    timer.mark("cv_review")

    background_tasks.add_task(probe_unknown_employers, employers)

    feedback = review.feedback
    n = len(matched)
    n_sponsors = int(matched["is_sponsor"].sum())
    excerpts = (
        int(feedback.get("jd_excerpts_used") or feedback.get("jobs_reviewed") or 0)
        if feedback
        else 0
    )
    result: dict[str, Any] = {
        "role": params.role,
        "has_cv": has_cv,
        "jobs_total": n,
        "jobs_sponsor_matched": n_sponsors,
        "jobs_verified": int((matched["sponsor_confidence"] == "verified").sum()),
        "jobs_scanned_for_skills": skills.jobs_counted,
        "jobs_in_skill_analysis": skills.jobs_counted if has_cv else 0,
        "jobs_full_description": (
            int(matched["description_full"].fillna(False).sum())
            if "description_full" in matched.columns
            else 0
        ),
        "jobs_sent_to_llm": excerpts,
        "jd_excerpts_used": excerpts,
        "jobs_llm_truncated": bool(feedback.get("jobs_context_truncated")) if feedback else False,
        "top_companies_are_sponsors": opportunities.top_from_sponsors,
        "match_rate_pct": round(100 * n_sponsors / n, 1) if n else 0.0,
        "min_salary_filter": params.min_salary,
        "experience_level_requested": params.level_label,
        # The level actually used: the one picked, or the one read from the CV.
        "experience_level_used": level.level,
        "experience_level_source": level.source,
        "experience_level_reason": level.reason,
        "experience_level_band": list(level_band(level.level)) if level.level in LEVELS else None,
        "opportunities_hidden_by_level": int(opportunities.hidden_by_level),
        "level_search_term": level_term if level_jobs is not None else None,
        "level_search_jobs": 0 if level_jobs is None else int(len(level_jobs)),
        "experience_filter_applied": bool(skills.filter_applied),
        "experience_jobs_count": int(skills.filter_count),
        "experience_filter_note": skills.filter_note or None,
        "opportunities_experience_filter_applied": bool(opportunities.filter_applied),
        "opportunities_experience_jobs_count": int(opportunities.filter_count),
        "opportunities_experience_filter_note": opportunities.filter_note or None,
        "requirement_frequencies": skills.frequencies,
        "sponsors": opportunities.sponsors,
        "top_companies": opportunities.top_companies,
        "cv_text_chars": len(text) if has_cv else 0,
        "cv_feedback": feedback,
        "where_you_are": review.where_you_are,
        "skills_to_learn": review.skills_to_learn,
        "llm_message": review.message,
        "stability_caveat": TENURE_CAVEAT,
        "skilled_worker_salary_threshold": params.salary_threshold,
        "is_new_entrant": params.new_entrant,
        "accuracy_note": ACCURACY_NOTE,
        "chart": {"top_companies": opportunities.top_companies},
    }
    result.update(_score_fields(review.scored, opportunities.top_companies))
    _use_review_score(result, feedback)
    logger.info("Search finished: %s, ads=%d, cv=%s", timer.summary(), n, "yes" if has_cv else "no")
    return result

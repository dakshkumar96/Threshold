"""A recruiter-style review of a CV, written by an AI model.

The model is given the market's skill counts, a few job-ad excerpts and the
CV. Its reply is checked before anything is shown. Claims about the CV that
can be checked against the CV text are (skill_judgements.py), and the things
models get wrong now and then are fixed in code instead of being trusted to
the prompt: a "put forward" verdict that contradicts a low score, a gap that
is also a strength, and the punctuation style.

The prompt is sized for the free Groq tier, which allows about 8k tokens a
minute for openai/gpt-oss-120b (read from the x-ratelimit-limit-tokens header).
One review uses about 7.1k to 7.2k of that, so two reviews inside the same
minute get a 429. That is the provider's limit and not a bug.
"""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass
from typing import Any

import requests

import settings
from llm_client import http_error_message, post_chat_completion
from llm_prompt_builder import (
    CV_PROMPT_CHARS,
    build_system_prompt,
    build_user_prompt,
    clip_cv,
    pack_jobs_for_llm,
)
from review_text import (
    align_gap_bullets,
    clean_value,
    first_impression_fallback,
    is_about,
    parse_skill_judgements,
    parse_summary_json,
    put_forward_from_report,
    section_bullets,
    skill_key,
    strip_summary_block,
    to_plain_text,
)
from skill_judgements import apply_skill_judgements

logger = logging.getLogger(__name__)

LABEL = "structured recruiter feedback — subjective narrative, not a hiring prediction"

# The free tier counts the prompt and the reply together. A prompt of 16000
# characters is about 4000 tokens, which leaves room for a 3800 token reply
# under the limit. A shorter reply cut the last sections off mid-sentence.
MAX_COMPLETION_TOKENS = 3800
PROMPT_CHAR_SOFT_LIMIT = 16000

# (characters, ads) of job-ad excerpts to try, biggest first. The excerpts are
# only colour, since the skill counts already cover every ad, so they shrink
# before the CV does.
_EXCERPT_STEPS = ((4500, 20), (3000, 14), (1800, 8), (0, 0))
_CV_CHARS_WHEN_STILL_TOO_LONG = 2800

_PLAIN_TEXT_REMINDER = (
    "\n\nIMPORTANT: Your visible report must be PLAIN TEXT only "
    "(SECTION: Title headers and '- ' bullets). No markdown. "
    "Be detailed — quote CV lines."
)

# A score this low is "not competitive" in the prompt's own bands, so a "Yes"
# put-forward verdict next to it is a plain contradiction.
_PUT_FORWARD_SCORE_FLOOR = 50

# Summary fields that are shown as text, so their dashes and semicolons are tidied.
_SUMMARY_TEXT_FIELDS = (
    "first_impression",
    "where_you_are",
    "one_thing_to_fix_first",
    "top_3_strengths",
    "top_3_gaps",
)


# --- results that need no AI --------------------------------------------------------


def skills_to_learn_from_gaps(
    gaps: list[dict[str, Any]] | None, *, limit: int = 12
) -> list[dict[str, Any]]:
    """The prioritised learn-list, straight from the keyword gap scores."""
    out: list[dict[str, Any]] = []
    for gap in (gaps or [])[:limit]:
        skill = gap.get("skill")
        if not skill:
            continue
        freq = gap.get("frequency_pct")
        weeks = gap.get("ease_weeks")
        note_parts = []
        if freq is not None:
            note_parts.append(f"In ~{freq}% of ads")
        if weeks is not None:
            note_parts.append(f"~{weeks} weeks to learn")
        out.append(
            {
                "skill": skill,
                "frequency_pct": freq,
                "ease_weeks": weeks,
                "priority_score": gap.get("priority_score"),
                "note": ", ".join(note_parts) if note_parts else None,
                "blocking": gap.get("blocking"),
                "why": gap.get("why"),
            }
        )
    return out


def where_you_are_from_match(match_summary: dict[str, Any]) -> str:
    """A short "where you are" from the keyword match, for when the AI has none."""
    matched = match_summary.get("matched") or []
    strengths = ", ".join(
        f"{m.get('skill')} (~{m.get('frequency_pct')}%)" for m in matched[:5]
    )
    base = (
        f"You match {match_summary.get('matched_count')} of {match_summary.get('top_n')} "
        f"top market skills (weighted score {match_summary.get('score')})."
    )
    if strengths:
        return f"{base} Detected strengths: {strengths}."
    return f"{base} No top-list skills detected in the CV yet."


def _jobs_len(jobs: Any) -> int:
    if jobs is None:
        return 0
    try:
        return int(len(jobs))
    except TypeError:
        return 0


# --- the prompt ----------------------------------------------------------------------


@dataclass(frozen=True)
class _Prompts:
    system: str
    user: str
    excerpts: int  # job-ad excerpts included
    jobs_truncated: bool
    cv_chars_total: int
    cv_chars_reviewed: int  # less than the total when the CV had to be cut


def _fit_prompts(
    system: str,
    role: str,
    cv_text: str,
    skill_frequencies: list[dict[str, Any]],
    match_summary: dict[str, Any],
    jobs: Any,
    jobs_analyzed: int,
    candidate_level: str | None,
    candidate_level_reason: str | None,
) -> _Prompts:
    """The system and user prompts, shrunk until they fit the soft size limit."""

    def user_prompt(jobs_blob: str, excerpts: int, truncated: bool, cv_limit: int = CV_PROMPT_CHARS) -> str:
        return build_user_prompt(
            role,
            cv_text,
            skill_frequencies,
            match_summary,
            jobs_blob=jobs_blob,
            jobs_count=excerpts,
            jobs_truncated=truncated,
            jobs_analyzed_for_skills=jobs_analyzed,
            candidate_level=candidate_level,
            candidate_level_reason=candidate_level_reason,
            cv_limit=cv_limit,
        )

    def prompts(user: str, excerpts: int, truncated: bool, cv_limit: int = CV_PROMPT_CHARS) -> _Prompts:
        reviewed = len(clip_cv(cv_text, cv_limit))
        return _Prompts(system, user, excerpts, truncated, len(cv_text or ""), reviewed)

    for step, (max_chars, max_jobs) in enumerate(_EXCERPT_STEPS):
        if max_jobs:
            jobs_blob, excerpts, truncated = pack_jobs_for_llm(
                jobs, max_chars=max_chars, max_jobs=max_jobs
            )
        else:
            jobs_blob, excerpts, truncated = "", 0, True
        user = user_prompt(jobs_blob, excerpts, truncated or step > 0)
        if len(system) + len(user) <= PROMPT_CHAR_SOFT_LIMIT:
            return prompts(user, excerpts, truncated)

    # Still too long with no ad excerpts at all, so the CV has to be cut further.
    user = user_prompt("", 0, True, cv_limit=_CV_CHARS_WHEN_STILL_TOO_LONG)
    return prompts(user, 0, True, cv_limit=_CV_CHARS_WHEN_STILL_TOO_LONG)


# --- the result -------------------------------------------------------------------------


@dataclass(frozen=True)
class _Review:
    """What every result of one review has in common, whether it worked or failed."""

    model: str
    prompts: _Prompts
    jobs_analyzed: int
    where_you_are: str
    skills_to_learn: list[dict[str, Any]]

    def result(self, **fields: Any) -> dict[str, Any]:
        result = {
            "label": LABEL,
            "first_impression": None,
            "score_out_of_100": None,
            "top_3_strengths": [],
            "top_3_gaps": [],
            "one_thing_to_fix_first": None,
            "full_report": None,
            "where_you_are": self.where_you_are,
            "skills_to_learn": self.skills_to_learn,
            "jobs_reviewed": self.prompts.excerpts,
            "jobs_in_skill_analysis": self.jobs_analyzed,
            "jd_excerpts_used": self.prompts.excerpts,
            "jobs_context_truncated": self.prompts.jobs_truncated,
            "cv_chars_total": self.prompts.cv_chars_total,
            "cv_chars_reviewed": self.prompts.cv_chars_reviewed,
            "prompt_chars": len(self.prompts.system) + len(self.prompts.user),
            "model": self.model,
            "truncated": False,
        }
        result.update(fields)
        return result


def _reconcile_summary(
    summary: dict[str, Any], *, deterministic_score: float | None = None
) -> dict[str, Any]:
    """Fix contradictions a single AI pass can produce even when told not to.

    Anything that can be checked mechanically is more reliable in code than in
    a prompt instruction.
    """
    llm_score = summary.get("score_out_of_100")
    candidate_scores = [s for s in (llm_score, deterministic_score) if isinstance(s, (int, float))]
    # The page shows the keyword-match score when there is one and the model's
    # own score otherwise (`data.score ?? fb.score_out_of_100` in
    # CvFullReview.tsx). The "Yes" check has to use whichever the reader sees.
    # Otherwise the two numbers on screen can still contradict each other.
    if candidate_scores and min(candidate_scores) < _PUT_FORWARD_SCORE_FLOOR:
        if str(summary.get("would_put_forward", "")).strip().lower() == "yes":
            summary["would_put_forward"] = "No"

    strengths = summary.get("top_3_strengths") or []
    gaps = summary.get("top_3_gaps") or []
    if strengths and gaps:
        strength_keys = {skill_key(s) for s in strengths if isinstance(s, str)}
        strength_keys.discard("")
        # A listed strength contradicts the same thing being a gap. The strength
        # is kept because the prompt asks for real CV evidence behind it, and
        # the gap is dropped as unreliable.
        summary["top_3_gaps"] = [
            g for g in gaps if not (isinstance(g, str) and skill_key(g) in strength_keys)
        ]
    return summary


def _fill_missing_from_report(summary: dict[str, Any], report: str) -> None:
    """Read what the JSON summary lacks from the prose that comes before it.

    The prose sections (Strengths, Gaps, Put forward) are written first, so
    they are intact even when the reply is cut off or the JSON is malformed.
    That beats showing "none returned" next to a report that contains them.
    """
    for field, title in (("top_3_strengths", "Strengths"), ("top_3_gaps", "Gaps")):
        if not summary.get(field):
            bullets = section_bullets(report, title)
            if bullets:
                summary[field] = bullets
    if not summary.get("would_put_forward"):
        verdict = put_forward_from_report(report)
        if verdict:
            summary["would_put_forward"] = verdict


def _parse_reply(content: str) -> tuple[dict[str, Any], str]:
    """The summary dict and the plain-text report from the model's reply."""
    summary = parse_summary_json(content) or {}
    for key in _SUMMARY_TEXT_FIELDS:
        if key in summary:
            summary[key] = clean_value(summary[key])
    report = to_plain_text(strip_summary_block(content))

    if summary.get("score_out_of_100") is None:
        total = re.search(r"TOTAL[^\d]*(\d+)\s*/\s*100", report, flags=re.I)
        summary["score_out_of_100"] = int(total.group(1)) if total else None
    _fill_missing_from_report(summary, report)
    return summary, report


def _read_reply(
    reply: dict[str, Any],
    review: _Review,
    *,
    cv_text: str,
    match_summary: dict[str, Any],
    built: dict[str, Any],
) -> dict[str, Any]:
    """Turn a successful AI reply into the checked review."""
    choice = reply["choices"][0]
    finish_reason = choice.get("finish_reason")
    usage = reply.get("usage") or {}
    logger.info(
        "AI usage prompt=%s completion=%s finish=%s",
        usage.get("prompt_tokens"),
        usage.get("completion_tokens"),
        finish_reason,
    )
    truncated = finish_reason == "length"
    if truncated:
        logger.warning(
            "AI reply was cut off (finish_reason=length, max_tokens=%d)", MAX_COMPLETION_TOKENS
        )

    content = (choice["message"]["content"] or "").strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:markdown|md|json|text)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

    summary, report = _parse_reply(content)

    adjusted_match, judgements = apply_skill_judgements(
        match_summary,
        parse_skill_judgements(content) or summary.get("skill_judgements"),
        cv_text,
    )
    # Skills the review showed in the CV with a quote that checked out.
    confirmed = {
        skill_key(m["skill"])
        for m in adjusted_match.get("matched") or []
        if m.get("found_by") == "review" or m.get("depth") == "demonstrated"
    }
    confirmed.discard("")
    if confirmed and summary.get("top_3_gaps"):
        summary["top_3_gaps"] = [
            g
            for g in summary["top_3_gaps"]
            if not (isinstance(g, str) and is_about(g, confirmed))
        ]
    blocking_by_key = {
        skill_key(j["skill"]): bool(j["blocking"]) for j in judgements if j["status"] == "missing"
    }
    blocking_by_key.pop("", None)
    report = align_gap_bullets(report, confirmed, blocking_by_key)

    summary = _reconcile_summary(summary, deterministic_score=adjusted_match.get("score"))

    return review.result(
        first_impression=summary.get("first_impression") or first_impression_fallback(report),
        score_out_of_100=summary["score_out_of_100"],
        bucket=summary.get("bucket"),
        top_3_strengths=summary.get("top_3_strengths") or [],
        top_3_gaps=summary.get("top_3_gaps") or [],
        one_thing_to_fix_first=summary.get("one_thing_to_fix_first"),
        would_put_forward=summary.get("would_put_forward"),
        full_report=report,
        where_you_are=(
            summary.get("where_you_are") or summary.get("first_impression") or review.where_you_are
        ),
        # The keyword gap list, minus skills the review showed with evidence
        # found in the CV, blocking gaps first.
        skills_to_learn=skills_to_learn_from_gaps(adjusted_match.get("gaps")),
        skill_judgements=judgements,
        adjusted_match=adjusted_match if judgements else None,
        role_family=built["role_family"],
        role_family_name=built["role_family_name"],
        calibration_band=built["calibration_band"],
        truncated=truncated,
    )


# --- the review -----------------------------------------------------------------------------


def generate_cv_feedback(
    role: str,
    cv_text: str,
    skill_frequencies: list[dict[str, Any]],
    match_summary: dict[str, Any],
    jobs: Any = None,
    jobs_analyzed_for_skills: int | None = None,
    candidate_level: str | None = None,
    candidate_level_reason: str | None = None,
) -> dict[str, Any] | None:
    """The AI review of this CV, or None when no AI key is set.

    Once a key is set this always returns a dict. A failure comes back as the
    same dict with an `error` message, so the job search and keyword match the
    reader already waited for are still shown.
    """
    config = settings.llm_config()
    if not config.api_key:
        return None

    jobs_analyzed = (
        int(jobs_analyzed_for_skills) if jobs_analyzed_for_skills is not None else _jobs_len(jobs)
    )
    built = build_system_prompt(role, cv_text, match_summary)
    prompts = _fit_prompts(
        built["system_prompt"] + _PLAIN_TEXT_REMINDER,
        role,
        cv_text,
        skill_frequencies,
        match_summary,
        jobs,
        jobs_analyzed,
        candidate_level,
        candidate_level_reason,
    )
    review = _Review(
        model=config.model,
        prompts=prompts,
        jobs_analyzed=jobs_analyzed,
        where_you_are=where_you_are_from_match(match_summary),
        skills_to_learn=skills_to_learn_from_gaps(match_summary.get("gaps")),
    )
    total_chars = len(prompts.system) + len(prompts.user)
    logger.info(
        "prompt sizes system=%d user=%d total=%d ads=%d excerpts=%d tok_est=%d+max=%d model=%s",
        len(prompts.system),
        len(prompts.user),
        total_chars,
        jobs_analyzed,
        prompts.excerpts,
        total_chars // 4,
        MAX_COMPLETION_TOKENS,
        config.model,
    )

    # The same role and CV always get the same seed, so a repeat run gives a
    # stable score and report instead of drifting. Not every provider honours
    # `seed`, but Groq does for most models.
    seed = int.from_bytes(hashlib.sha256(f"{role}|{cv_text}".encode("utf-8")).digest()[:4], "big")
    headers = {"Authorization": f"Bearer {config.api_key}", "Content-Type": "application/json"}
    body = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": prompts.system},
            {"role": "user", "content": prompts.user},
        ],
        # Low, because per-skill verdicts move the score and the gap list. At
        # 0.35 the same CV flipped skills between "demonstrated" and "missing"
        # across identical runs, and the seed alone does not pin that down.
        "temperature": 0.15,
        "seed": seed,
        "max_tokens": MAX_COMPLETION_TOKENS,
    }

    try:
        response = post_chat_completion(f"{config.base_url}/chat/completions", headers, body)
        if not response.ok:
            return review.result(error=http_error_message(response))
        return _read_reply(
            response.json(), review, cv_text=cv_text, match_summary=match_summary, built=built
        )
    except requests.Timeout:
        logger.warning("The AI service timed out")
        return review.result(
            error="The AI review took too long and timed out. Please try again shortly."
        )
    except requests.exceptions.ConnectionError:
        logger.warning("The connection to the AI service dropped twice")
        return review.result(
            error=(
                "The connection to the AI service was dropped, even after a retry. "
                "This is usually a short network problem, so please try again."
            )
        )
    except requests.RequestException as exc:
        logger.warning("The request to the AI service failed: %s", exc)
        return review.result(error=f"The request to the AI service failed. {exc}")
    except Exception as exc:  # an odd reply must not lose the search results
        logger.exception("The AI review failed")
        return review.result(error=f"The AI review failed. {exc}")

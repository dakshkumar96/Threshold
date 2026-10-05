"""Turning matched job rows into the sponsor cards and company list the site shows."""

from __future__ import annotations

from collections import Counter
from typing import Any, NamedTuple

import pandas as pd

from dynamic_skills import (
    cv_skill_set,
    essential_flag,
    extract_skills_from_text,
    job_description_text,
)
from experience_level import LEVELS, classify_row_level, level_band

from .config import SKILLED_WORKER_GENERAL_MIN
from .job_filters import as_float

DAYS_PER_YEAR = 365
ESTABLISHED_DAYS = 5 * DAYS_PER_YEAR
MODERATE_DAYS = 2 * DAYS_PER_YEAR
LONG_STANDING_DAYS = 3 * DAYS_PER_YEAR

BAND_ORDER = {"Established": 0, "Moderate": 1, "Newly registered": 2}
CONF_ORDER = {"verified": 0, "likely": 1, "possible": 2}


# --- licence tenure -----------------------------------------------------------


def tenure_band(duration_days: float | None) -> str:
    """Band from how long we have seen the licence in our register archive."""
    if duration_days is None or pd.isna(duration_days):
        return "Newly registered"
    days = float(duration_days)
    if days >= ESTABLISHED_DAYS:
        return "Established"
    if days >= MODERATE_DAYS:
        return "Moderate"
    return "Newly registered"


def licence_years(duration_days: float | None) -> float | None:
    days = as_float(duration_days)
    return None if days is None else round(days / DAYS_PER_YEAR, 1)


def stability_tooltip(band: str, years: float | None) -> str:
    if years is not None:
        return (
            f"On the sponsor register for ~{years:g} year"
            f"{'' if years == 1 else 's'} in our archive (left-truncated). "
            "Likely still sponsoring when you graduate."
        )
    return (
        f"{band}: tenure unknown or short in our archive (left-truncated). "
        "Not a guarantee of active hiring."
    )


def long_standing(duration_days: float | None, band: str) -> bool:
    if band == "Established":
        return True
    days = as_float(duration_days)
    return days is not None and days >= LONG_STANDING_DAYS


def _tenure_fields(duration: Any) -> dict[str, Any]:
    band = tenure_band(duration)
    years = licence_years(duration)
    return {
        "stability_band": band,
        "licence_years": years,
        "stability_tooltip": stability_tooltip(band, years),
        "long_standing_licence": long_standing(duration, band),
    }


# --- salary ---------------------------------------------------------------------


def salary_vs_threshold(
    smin: float | None,
    smax: float | None,
    threshold: float = SKILLED_WORKER_GENERAL_MIN,
) -> str:
    """Stated pay against the Skilled Worker floor.

    A range that spans the floor is "borderline", not "above", because the
    real offer could land on either side.
    """
    if smin is None and smax is None:
        return "unknown"
    if smin is not None and smax is not None and smin < threshold <= smax:
        return "borderline"
    if (smax is not None and smax >= threshold) or (smin is not None and smin >= threshold):
        return "above"
    top = smax if smax is not None else smin
    if top is not None and top < threshold:
        return "below"
    return "unknown"


def _money(v: float) -> str:
    if v >= 1000:
        k = v / 1000
        return f"£{k:.0f}k" if k == int(k) else f"£{k:.1f}k"
    return f"£{v:,.0f}"


def format_salary(smin: float | None, smax: float | None) -> str | None:
    if smin is None and smax is None:
        return None
    if smin is not None and smax is not None:
        return _money(smin) if smin == smax else f"{_money(smin)}-{_money(smax)}"
    if smin is not None:
        return f"from {_money(smin)}"
    return f"up to {_money(smax)}"


# --- one job's skills ---------------------------------------------------------------


def jd_skill_payload(row: Any, cv_skills: set[str] | None) -> dict[str, Any]:
    """The skills one ad asks for, and how many of them the CV has."""
    cleaned = job_description_text(row).strip()
    if len(cleaned) < 40:
        return {
            "jd_skills": [],
            "jd_text_limited": True,
            "cv_overlap_count": None,
            "cv_overlap_total": None,
            "cv_matched_skills": [],
            "cv_missing_skills": [],
            "description_excerpt": cleaned[:400] if cleaned else None,
        }

    jd_skills = [
        {"skill": s, "essential": essential_flag(cleaned, s) == "essential"}
        for s in extract_skills_from_text(cleaned)[:15]
    ]
    matched: list[str] = []
    missing: list[str] = []
    if cv_skills is not None:
        for item in jd_skills:
            (matched if item["skill"].lower() in cv_skills else missing).append(item["skill"])
    return {
        "jd_skills": jd_skills,
        "jd_text_limited": False,
        "cv_overlap_count": len(matched) if cv_skills is not None else None,
        "cv_overlap_total": len(jd_skills) if cv_skills is not None else None,
        "cv_matched_skills": matched,
        "cv_missing_skills": missing,
        "description_excerpt": cleaned[:1200],
    }


# --- the sponsor list -----------------------------------------------------------------


def parse_recency(val: Any) -> float:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 0.0
    try:
        return float(pd.Timestamp(val).timestamp())
    except (TypeError, ValueError):
        return 0.0


class _RowFacts(NamedTuple):
    """What the list needs to know about one row, worked out once."""

    company_key: Any
    duration: Any
    confidence: str
    stability: float
    recency: float
    job_level: str | None


def _row_facts(row: pd.Series, retention: dict[str, dict[str, Any]], possible: bool) -> _RowFacts:
    key = row.get("matched_company_key") or row.get("company_key")
    info = retention.get(str(key)) if key else None
    confidence = row.get("sponsor_confidence")
    if confidence is None or (isinstance(confidence, float) and pd.isna(confidence)):
        confidence = "possible" if possible else "likely"
    stability = as_float(info.get("stability_score") if info else None)
    last_seen = info.get("last_seen") if info else row.get("last_seen")
    return _RowFacts(
        company_key=key,
        duration=info.get("duration_days") if info else None,
        confidence=str(confidence),
        stability=stability if stability is not None else -1.0,
        recency=parse_recency(last_seen),
        job_level=classify_row_level(row),
    )


def _level_fit(job_level: str | None, fit_band: set[str] | None) -> str | None:
    """"fits" when the ad states a level in the candidate's range, "unstated"
    when it states none, "outside" when above or below. None when the
    candidate's level is unknown."""
    if not fit_band:
        return None
    if job_level in fit_band:
        return "fits"
    return "unstated" if job_level is None else "outside"


def build_sponsor_list(
    df: pd.DataFrame,
    retention: dict[str, dict[str, Any]],
    *,
    possible: bool = False,
    limit: int = 40,
    cv_text: str | None = None,
    salary_threshold: float = SKILLED_WORKER_GENERAL_MIN,
    candidate_level: str | None = None,
) -> list[dict[str, Any]]:
    """The best `limit` rows, ordered by level fit, confidence, tenure, stability and recency."""
    if df.empty:
        return []

    cv_skills = cv_skill_set(cv_text) if cv_text else None
    fit_band = set(level_band(candidate_level)) if candidate_level in LEVELS else None

    rows = df.copy()
    facts = [_row_facts(row, retention, possible) for _, row in rows.iterrows()]
    rows["_pos"] = range(len(rows))
    rows["_band"] = [tenure_band(f.duration) for f in facts]
    rows["_band_rank"] = rows["_band"].map(lambda b: BAND_ORDER.get(b, 99))
    rows["_recency"] = [f.recency for f in facts]
    rows["_conf_rank"] = [CONF_ORDER.get(f.confidence, 2) for f in facts]
    rows["_stab"] = [f.stability for f in facts]
    # Ads that state a level in the candidate's range go first, then the
    # (many) ads that state no level.
    rows["_fit_rank"] = [0 if fit_band and f.job_level in fit_band else 1 for f in facts]
    rows = rows.sort_values(
        ["_fit_rank", "_conf_rank", "_band_rank", "_stab", "_recency"],
        ascending=[True, True, True, False, False],
        na_position="last",
    )

    out: list[dict[str, Any]] = []
    for _, row in rows.head(limit).iterrows():
        f = facts[int(row["_pos"])]
        ms = row.get("match_score")
        smin = as_float(row.get("salary_min"))
        smax = as_float(row.get("salary_max"))
        jd = jd_skill_payload(row, cv_skills)
        company_raw = row.get("company_raw")
        out.append(
            {
                "title": row.get("title"),
                "experience_level": f.job_level,
                "level_fit": _level_fit(f.job_level, fit_band),
                "company": company_raw,
                "company_raw": company_raw,
                "matched_sponsor": f.company_key,
                "match_score": None
                if ms is None or (isinstance(ms, float) and pd.isna(ms))
                else round(float(ms), 1),
                **_tenure_fields(f.duration),
                "sponsor_confidence": f.confidence,
                "is_possible_sponsor": possible or f.confidence == "possible",
                "location": row.get("location") or "Location not stated",
                "salary_min": smin,
                "salary_max": smax,
                "salary_display": format_salary(smin, smax),
                "salary_vs_threshold": salary_vs_threshold(smin, smax, salary_threshold),
                "url": row.get("url"),
                "source": row.get("source"),
                **jd,
            }
        )
    return out


def top_hiring_companies(
    jobs: pd.DataFrame,
    retention: dict[str, dict[str, Any]],
    limit: int = 12,
) -> list[dict]:
    """The companies with the most ads, with their licence tenure."""
    if jobs.empty:
        return []
    df = jobs.copy()
    df["company_label"] = ""
    if "matched_company_key" in df.columns:
        df["company_label"] = df["matched_company_key"].fillna("")
    blank = df["company_label"].astype(str).str.strip() == ""
    if "company_raw" in df.columns:
        df.loc[blank, "company_label"] = df.loc[blank, "company_raw"].fillna("")
    df = df[df["company_label"].astype(str).str.strip() != ""]
    if df.empty:
        return []

    def most_common_location(series: pd.Series) -> str:
        s = series.fillna("").astype(str).str.strip()
        s = s[s != ""]
        if s.empty:
            return "Location not stated"
        # Counter keeps the first-seen location when two are equally common, so
        # the answer is the same on every machine.
        return Counter(s).most_common(1)[0][0][:60]

    # Ties in the number of ads are broken by name. A plain sort leaves their
    # order to numpy's fastest sort, which differs between Intel and ARM chips.
    grouped = (
        df.groupby("company_label", as_index=False)
        .agg(jobs=("title", "size"), location=("location", most_common_location))
        .sort_values(["jobs", "company_label"], ascending=[False, True], kind="stable")
        .head(limit)
    )
    result = []
    for r in grouped.itertuples():
        info = retention.get(str(r.company_label))
        result.append(
            {
                "company": str(r.company_label)[:50],
                "jobs": int(r.jobs),
                "location": str(r.location),
                **_tenure_fields(info.get("duration_days") if info else None),
            }
        )
    return result

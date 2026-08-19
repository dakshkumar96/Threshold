"""Classify job ads into experience levels from title, then description."""

from __future__ import annotations

import re
from typing import Literal

ExperienceLevel = Literal["graduate", "junior", "mid", "senior", "lead"]

LEVELS: tuple[ExperienceLevel, ...] = (
    "graduate",
    "junior",
    "mid",
    "senior",
    "lead",
)

# Conservative patterns: avoid tagging bare "engineer" / "developer" as junior or senior.
_TITLE_PATTERNS: list[tuple[ExperienceLevel, re.Pattern[str]]] = [
    (
        "lead",
        re.compile(
            r"\b(lead|principal|staff|head\s+of|director|vp|vice\s+president|"
            r"chief|architect)\b",
            re.I,
        ),
    ),
    (
        "senior",
        re.compile(r"\b(senior|sr\.?|snr\.?)\b", re.I),
    ),
    (
        "junior",
        re.compile(r"\b(junior|jr\.?|jnr\.?|entry[\s-]?level)\b", re.I),
    ),
    (
        "graduate",
        re.compile(
            r"\b(graduate|grad(\s+scheme|\s+programme|\s+program)?|"
            r"trainee|apprentice|internship|intern)\b",
            re.I,
        ),
    ),
    (
        "mid",
        re.compile(
            r"\b(mid[\s-]?level|mid[\s-]?weight|intermediate)\b",
            re.I,
        ),
    ),
]

# Description cues only when title is ambiguous. Years-of-experience bands first.
_DESC_YEAR_BANDS: list[tuple[ExperienceLevel, re.Pattern[str]]] = [
    (
        "lead",
        re.compile(
            r"\b(10\+?\s*\+?\s*years?|at\s+least\s+10\s+years?|"
            r"minimum\s+of\s+10\s+years?)\b",
            re.I,
        ),
    ),
    (
        "senior",
        re.compile(
            r"\b(([5-9]|1[0-5])\+?\s*(\+|to|-|–)\s*\d+\s*years?|"
            r"([5-9]|1[0-5])\+\s*years?|"
            r"at\s+least\s+([5-9]|1[0-5])\s+years?|"
            r"minimum\s+(of\s+)?([5-9]|1[0-5])\s+years?)\b",
            re.I,
        ),
    ),
    (
        "mid",
        re.compile(
            r"\b(([2-4])\+?\s*(\+|to|-|–)\s*[4-6]\s*years?|"
            r"([2-4])\+\s*years?|"
            r"at\s+least\s+([2-4])\s+years?|"
            r"minimum\s+(of\s+)?([2-4])\s+years?|"
            r"2[\s-]?4\s+years?)\b",
            re.I,
        ),
    ),
    (
        "junior",
        re.compile(
            r"\b(0[\s-]?2\s+years?|1[\s-]?2\s+years?|"
            r"up\s+to\s+2\s+years?|less\s+than\s+2\s+years?|"
            r"1\+\s*years?\s+(of\s+)?experience)\b",
            re.I,
        ),
    ),
    (
        "graduate",
        re.compile(
            r"\b(no\s+experience\s+required|fresh\s+graduate|"
            r"recent\s+graduate|new\s+graduate|"
            r"graduate\s+(scheme|programme|program|role))\b",
            re.I,
        ),
    ),
]

_DESC_ROLE_CUES: list[tuple[ExperienceLevel, re.Pattern[str]]] = [
    (
        "lead",
        re.compile(
            r"\b(technical\s+lead|team\s+lead|engineering\s+lead|"
            r"people\s+management|manage\s+a\s+team)\b",
            re.I,
        ),
    ),
    (
        "senior",
        re.compile(r"\b(senior\s+(engineer|developer|analyst|designer))\b", re.I),
    ),
    (
        "junior",
        re.compile(
            r"\b(junior\s+(engineer|developer|analyst|designer)|"
            r"entry[\s-]?level\s+role)\b",
            re.I,
        ),
    ),
    (
        "graduate",
        re.compile(r"\b(graduate\s+(scheme|programme|program|trainee))\b", re.I),
    ),
]


def classify_job_level(
    title: str | None,
    description: str | None = None,
) -> ExperienceLevel | None:
    """Return a level when evidence is clear; otherwise None (unknown / mid-generic)."""
    title_text = (title or "").strip()
    if title_text:
        for level, pattern in _TITLE_PATTERNS:
            if pattern.search(title_text):
                return level

    desc = (description or "").strip()
    if not desc:
        return None

    # Prefer explicit year bands over soft role cues.
    for level, pattern in _DESC_YEAR_BANDS:
        if pattern.search(desc):
            return level

    for level, pattern in _DESC_ROLE_CUES:
        if pattern.search(desc):
            return level

    return None


def filter_jobs_by_experience(
    jobs,
    level: ExperienceLevel | str | None,
    *,
    min_matches: int = 8,
    context: str = "Skill analysis",
):
    """
    Filter a jobs DataFrame to the requested experience level.

    Returns (filtered_or_original_df, applied: bool, match_count: int, note: str).
    Empty / 'any' level means no filter. If fewer than min_matches rows classify
    into the requested level, falls back to the full set.

    `context` is a short subject phrase ("Skill analysis", "Sponsor list", ...) used
    in the returned note so the same helper reads correctly for different callers —
    this filter is applied both to the skills/CV/LLM job pool and to the sponsor
    opportunity list.
    """
    import pandas as pd

    requested = (level or "").strip().lower()
    if not requested or requested in {"any", "all", ""}:
        n = 0 if jobs is None or getattr(jobs, "empty", True) else len(jobs)
        return jobs, False, n, ""

    if requested not in LEVELS:
        n = 0 if jobs is None or getattr(jobs, "empty", True) else len(jobs)
        return jobs, False, n, f"Unknown experience level '{requested}'; no filter applied."

    if jobs is None or getattr(jobs, "empty", True):
        return jobs, False, 0, "No jobs available to filter by experience."

    df = jobs.copy()
    title_col = "title" if "title" in df.columns else None
    desc_col = None
    for candidate in ("description", "description_text", "job_description"):
        if candidate in df.columns:
            desc_col = candidate
            break

    levels: list[ExperienceLevel | None] = []
    for _, row in df.iterrows():
        title = str(row[title_col]) if title_col else ""
        desc = str(row[desc_col]) if desc_col else ""
        levels.append(classify_job_level(title, desc))

    df["_exp_level"] = levels
    matched = df[df["_exp_level"] == requested]
    match_count = int(len(matched))

    if match_count >= min_matches:
        out = matched.drop(columns=["_exp_level"]).reset_index(drop=True)
        note = f"{context} limited to {match_count} ads classified as {requested}."
        return out, True, match_count, note

    out = df.drop(columns=["_exp_level"]).reset_index(drop=True)
    note = (
        f"Only {match_count} ads matched the {requested} level "
        f"(need {min_matches}); showing all {len(out)} ads instead."
    )
    return out, False, match_count, note

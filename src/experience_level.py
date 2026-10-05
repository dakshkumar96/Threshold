"""Classify job ads into experience levels from title, then description,
and estimate a candidate's level from their CV."""

from __future__ import annotations

import re
from datetime import date
from typing import Any, Literal

ExperienceLevel = Literal["graduate", "junior", "mid", "senior", "lead"]

LEVELS: tuple[ExperienceLevel, ...] = (
    "graduate",
    "junior",
    "mid",
    "senior",
    "lead",
)


def level_band(level: str) -> tuple[str, ...]:
    """Job levels that fit a candidate at `level`: their own, one step down
    and one step up (a stretch role). A graduate sees graduate and junior
    ads, never senior or lead ones; a senior sees mid, senior and lead."""
    i = LEVELS.index(level)  # type: ignore[arg-type]
    return LEVELS[max(0, i - 1) : i + 2]

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


# Numbered grades on engineering ladders ("Software Engineer III"): I is
# entry, II mid, III senior, IV and up staff / lead.
_TITLE_GRADE = re.compile(
    r"\b(?:engineer|developer|analyst|scientist|programmer)\s+(i{1,3}|iv|v|[1-5])\b",
    re.I,
)
_GRADE_LEVEL: dict[str, ExperienceLevel] = {
    "i": "junior", "1": "junior",
    "ii": "mid", "2": "mid",
    "iii": "senior", "3": "senior",
    "iv": "lead", "4": "lead", "v": "lead", "5": "lead",
}


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
        grade = _TITLE_GRADE.search(title_text)
        if grade:
            return _GRADE_LEVEL[grade.group(1).lower()]

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


def classify_row_level(row: Any) -> ExperienceLevel | None:
    """classify_job_level for a job DataFrame row / dict."""
    desc = ""
    for col in ("description", "description_text", "job_description"):
        value = row.get(col)
        if value is not None and str(value).strip() and str(value) != "nan":
            desc = str(value)
            break
    return classify_job_level(str(row.get("title") or ""), desc)


def filter_jobs_by_experience(
    jobs,
    level: ExperienceLevel | str | None,
    *,
    min_matches: int = 8,
    context: str = "Skill analysis",
    fallback_to_all: bool = True,
):
    """
    Keep the ads that fit a candidate at `level`: ads whose level is within
    level_band(level), plus ads that don't state a level (most ads don't).
    Ads clearly above or below the band are dropped, so a graduate never
    gets lead / principal roles.

    Returns (filtered_or_original_df, applied: bool, match_count: int, note: str).
    Empty / 'any' level means no filter. If fewer than min_matches ads fit:
      - fallback_to_all=True (skill analysis) keeps the full set, since
        skill frequencies from a handful of ads are noise
      - fallback_to_all=False (the job list itself) keeps the few that fit;
        showing someone roles they can't get is worse than a short list

    `context` is a short subject phrase ("Skill analysis", "Sponsor list", ...) used
    in the returned note so the same helper reads correctly for different callers.
    """
    requested = (level or "").strip().lower()
    if not requested or requested in {"any", "all", ""}:
        n = 0 if jobs is None or getattr(jobs, "empty", True) else len(jobs)
        return jobs, False, n, ""

    if requested not in LEVELS:
        n = 0 if jobs is None or getattr(jobs, "empty", True) else len(jobs)
        return jobs, False, n, f"Unknown experience level '{requested}'; no filter applied."

    if jobs is None or getattr(jobs, "empty", True):
        return jobs, False, 0, "No jobs available to filter by experience."

    band = level_band(requested)
    df = jobs.copy()
    df["_exp_level"] = [classify_row_level(row) for _, row in df.iterrows()]
    fits = df["_exp_level"].isna() | df["_exp_level"].isin(band)
    kept = df[fits]
    match_count = int(len(kept))
    hidden = int(len(df) - match_count)
    band_text = " and ".join(band) if len(band) == 2 else ", ".join(band[:-1]) + f" and {band[-1]}"

    if match_count >= min_matches or not fallback_to_all:
        out = kept.drop(columns=["_exp_level"]).reset_index(drop=True)
        note = (
            f"{context} shows {band_text} ads and ads with no stated level."
            + (f" {hidden} ads outside that range are hidden." if hidden else "")
        )
        return out, True, match_count, note

    out = df.drop(columns=["_exp_level"]).reset_index(drop=True)
    note = (
        f"Only {match_count} ads fit the {requested} level, and we need {min_matches}. "
        f"The {context.lower()} uses all {len(out)} ads instead."
    )
    return out, False, match_count, note


# ---------------------------------------------------------------------------
# Candidate level from the CV
# ---------------------------------------------------------------------------

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
_MONTH_NAME = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|"
    r"aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)
_DATE_TOKEN = (
    rf"(?:{_MONTH_NAME}\.?,?\s+(?:19|20)\d{{2}}|\d{{1,2}}\s*/\s*(?:19|20)\d{{2}}|"
    r"(?:19|20)\d{2})"
)
_RANGE_RE = re.compile(
    rf"({_DATE_TOKEN})\s*(?:-|–|—|to|until)\s*"
    rf"({_DATE_TOKEN}|present|current|now|today|date|ongoing)\b",
    re.I,
)

# Section headings. Only the experience section's dates count as work.
_EXPERIENCE_HEAD = re.compile(
    r"^(?:work|professional|relevant|employment|career)?\s*"
    r"(?:experience|employment(?:\s+history)?|work\s+history|career\s+history)\s*:?$",
    re.I,
)
_OTHER_HEAD = re.compile(
    r"^(?:education|academic\s+\w+|qualifications|(?:personal\s+|side\s+)?projects?|"
    r"(?:technical\s+|key\s+)?skills|achievements|awards|certifications?|"
    r"volunteer(?:ing)?(?:\s+experience)?|interests|hobbies|publications|languages|"
    r"references|profile|summary|personal\s+statement|about(?:\s+me)?|leadership|"
    r"activities|extra[- ]?curricular(?:\s+activities)?|courses|training)\s*:?$",
    re.I,
)
_EDUCATION_HEAD = re.compile(r"^(?:education|academic\s+\w+|qualifications)\s*:?$", re.I)
_EDUCATION_WORDS = re.compile(
    r"\b(university|college|school|bsc|msc|ba|ma|meng|beng|phd|degree|"
    r"a[- ]levels?|gcses?|diploma|undergraduate|postgraduate)\b",
    re.I,
)
# Roles that are real experience but not a paid professional role at level.
_NOT_PROFESSIONAL = re.compile(
    r"\b(intern|internship|placement|volunteer(?:ing)?|"
    r"teaching\s+assistant|part[- ]time|summer|student\s+ambassador|"
    r"vacation\s+scheme|insight\s+(?:week|programme|program))\b",
    re.I,
)
_STUDENT_CUES = re.compile(
    r"\b(expected\s+(?:19|20)\d{2}|predicted\s+(?:first|2:1|2:2)|final[- ]year|"
    r"penultimate[- ]year|currently\s+studying|graduating\s+in)\b",
    re.I,
)
_TITLE_LEAD = re.compile(
    r"\b(lead|principal|staff|head\s+of|director|vp|chief|architect)\b", re.I
)
_TITLE_SENIOR = re.compile(r"\b(senior|sr\.?|snr\.?)\b", re.I)
_TITLE_JUNIOR = re.compile(r"\b(junior|jr\.?|jnr\.?|entry[- ]level)\b", re.I)
_TITLE_GRAD = re.compile(r"\b(graduate|trainee|apprentice)\b", re.I)
_BULLET = re.compile(r"^\s*[-•*▪●◦]")


def _parse_date_token(token: str, *, today: date) -> int | None:
    """Month index (year*12 + month-1) for a CV date like 'Jun 2024',
    '06/2024', '2024' or 'present'."""
    t = token.strip().lower().rstrip(".,")
    if t in {"present", "current", "now", "today", "date", "ongoing"}:
        return today.year * 12 + today.month - 1
    m = re.match(r"([a-z]+)\.?,?\s+(\d{4})$", t)
    if m:
        month = _MONTHS.get(m.group(1)[:3])
        return int(m.group(2)) * 12 + month - 1 if month else None
    m = re.match(r"(\d{1,2})\s*/\s*(\d{4})$", t)
    if m and 1 <= int(m.group(1)) <= 12:
        return int(m.group(2)) * 12 + int(m.group(1)) - 1
    m = re.match(r"(\d{4})$", t)
    if m:
        # Year only: mid-year either end, so "2020 - 2023" reads as 3 years.
        return int(m.group(1)) * 12 + 5
    return None


def infer_cv_level(cv_text: str, *, today: date | None = None) -> dict[str, Any] | None:
    """Estimate a candidate's level from their CV.

    Counts time in paid professional roles (date ranges in the experience
    section, overlaps merged; internships, placements, volunteering and
    part-time work left out), then lets the latest job title adjust it
    ("Senior ..." / "Lead ..." / "Junior ..."). A CV with no paid roles but
    a current or recent degree reads as graduate.

    Returns {"level", "years", "reason"} or None when the CV has nothing to
    go on (no dated roles and no study dates).
    """
    today = today or date.today()
    lines = [ln.strip() for ln in (cv_text or "").splitlines()]
    has_experience_head = any(
        len(ln) < 45 and _EXPERIENCE_HEAD.match(ln) for ln in lines if ln
    )

    section = "none"
    professional: list[tuple[int, int, str]] = []  # (start, end, context)
    other_work = 0
    study_end: int | None = None
    for i, line in enumerate(lines):
        if not line:
            continue
        if len(line) < 45 and _EXPERIENCE_HEAD.match(line):
            section = "experience"
            continue
        if len(line) < 45 and _OTHER_HEAD.match(line):
            section = "education" if _EDUCATION_HEAD.match(line) else "other"
            continue
        for m in _RANGE_RE.finditer(line):
            start = _parse_date_token(m.group(1), today=today)
            end = _parse_date_token(m.group(2), today=today)
            if start is None or end is None or end < start:
                continue
            # The role title is on this line or up to two lines above it
            # (stopping at a bullet, which belongs to the previous role).
            context = [line]
            for j in range(i - 1, max(-1, i - 3), -1):
                prev = lines[j]
                if (
                    not prev
                    or _BULLET.match(prev)
                    or (len(prev) < 45 and (_EXPERIENCE_HEAD.match(prev) or _OTHER_HEAD.match(prev)))
                ):
                    break
                context.append(prev)
            ctx = " | ".join(context)

            is_education = section == "education" or (
                section != "experience" and _EDUCATION_WORDS.search(ctx)
            )
            if is_education:
                study_end = max(study_end or end, end)
                continue
            in_work_section = section == "experience" or (
                not has_experience_head and section == "none"
            )
            if not in_work_section:
                continue
            if _NOT_PROFESSIONAL.search(ctx):
                other_work += 1
                continue
            professional.append((start, end, ctx))

    # Merge overlapping ranges so two concurrent jobs don't double count.
    months = 0
    merged_end = -1
    for start, end, _ in sorted(professional):
        if start > merged_end:
            months += end - start + 1
            merged_end = end
        elif end > merged_end:
            months += end - merged_end
            merged_end = end
    years = round(months / 12, 1)

    now_idx = today.year * 12 + today.month - 1
    studying_or_recent = bool(_STUDENT_CUES.search(cv_text or "")) or (
        study_end is not None and study_end >= now_idx - 18
    )

    if not professional:
        if study_end is None and not other_work and not studying_or_recent:
            return None
        parts = ["no full-time paid roles yet"]
        if other_work:
            parts.append("only internships, part-time or volunteer work")
        if studying_or_recent:
            parts.append("a current or recent degree")
        return {"level": "graduate", "years": 0.0, "reason": ", ".join(parts)}

    if years < 1:
        by_years: ExperienceLevel = "graduate"
    elif years < 2.5:
        by_years = "junior"
    elif years < 5:
        by_years = "mid"
    else:
        by_years = "senior"

    # Most recent role's title can pull the level up or down: the market
    # reads "Junior Developer" with 3 years as junior, "Lead" as lead.
    latest_ctx = max(professional, key=lambda p: (p[1], p[0]))[2]
    level: ExperienceLevel = by_years
    title_note = ""
    if _TITLE_LEAD.search(latest_ctx) and years >= 3:
        level, title_note = "lead", "your latest job title is a lead role"
    elif _TITLE_SENIOR.search(latest_ctx) and years >= 2:
        level, title_note = "senior", "your latest job title is senior"
    elif _TITLE_GRAD.search(latest_ctx) and years < 3:
        level, title_note = "graduate", "your latest job title is a graduate role"
    elif _TITLE_JUNIOR.search(latest_ctx) and years < 5:
        level, title_note = "junior", "your latest job title is junior"

    whole = round(years)
    reason = (
        "under a year in paid roles"
        if years < 1
        else f"about {whole} year{'s' if whole != 1 else ''} in paid roles"
    )
    if title_note:
        reason += f", and {title_note}"
    return {"level": level, "years": years, "reason": reason}

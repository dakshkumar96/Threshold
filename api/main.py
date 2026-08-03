"""FastAPI wrapper: jobs → sponsors → dynamic skills → CV score → LLM."""

from __future__ import annotations

import os
import re
import sys
import time
from collections import defaultdict
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from rapidfuzz import fuzz

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from . import ats_probe, ats_store, user_routes, user_store  # noqa: E402
from .uk_location import board_has_uk_jobs, filter_uk, is_uk  # noqa: E402
from cv_feedback import (  # noqa: E402
    generate_cv_feedback,
    skills_to_learn_from_gaps,
    where_you_are_from_match,
)
from dynamic_skills import (  # noqa: E402
    extract_skills_from_text,
    match_cv_to_skills,
    skill_frequencies,
    _essential_flag,
    _job_description_text,
)
from experience_level import filter_jobs_by_experience  # noqa: E402
from job_schema import load_env, utc_now_iso  # noqa: E402
from match_sponsors import match_jobs_to_sponsors  # noqa: E402
from name_verify import verify_identity  # noqa: E402
from parse_cv import extract_text_from_bytes  # noqa: E402
from run_jobs_pipeline import JobFetchError, fetch_all_jobs  # noqa: E402

load_env()

MAX_PER_SOURCE = int(os.getenv("ANALYZE_MAX_PER_SOURCE", "100"))
MAX_REED_ENRICH = int(os.getenv("ANALYZE_MAX_REED_ENRICH", "30"))
MAX_ATS_BOARDS = int(os.getenv("ANALYZE_MAX_ATS_BOARDS", "12"))
MAX_CV_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_CV_TEXT_CHARS = 80_000
RATE_LIMIT_PER_MIN = int(os.getenv("ANALYZE_RATE_LIMIT_PER_MIN", "6"))
RETENTION_PATH = ROOT / "data" / "processed" / "sponsor_retention_scores.parquet"
EMPTY_PDF_MSG = (
    "This PDF has no text layer (it's likely a scan or photo). "
    "Export or save as a text-based PDF and try again."
)
TENURE_CAVEAT = (
    "Licence tenure from our register archive (left-truncated) - "
    "not a guarantee of active hiring"
)
SKILLED_WORKER_GENERAL_MIN = 41_700.0
SKILLED_WORKER_NEW_ENTRANT_MIN = 33_400.0


def _salary_vs_threshold(
    smin: float | None,
    smax: float | None,
    threshold: float = SKILLED_WORKER_GENERAL_MIN,
) -> str:
    """Classify stated pay vs the applicable Skilled Worker floor."""
    if smin is None and smax is None:
        return "unknown"
    if (smax is not None and smax >= threshold) or (
        smin is not None and smin >= threshold
    ):
        return "above"
    # Known stated top of range below floor (or only-max / only-min below)
    hi = smax if smax is not None else smin
    if hi is not None and hi < threshold:
        return "below"
    return "unknown"


def _cv_skill_set(cv_text: str) -> set[str]:
    return {s.lower() for s in extract_skills_from_text(cv_text or "")}


def _jd_skill_payload(
    row: Any, cv_skills: set[str] | None
) -> dict[str, Any]:
    """Per-role skill extract + optional CV overlap for one sponsor row."""
    try:
        text = _job_description_text(row)
    except Exception:
        text = str(row.get("description") or row.get("title") or "")
    cleaned = (text or "").strip()
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

    skills = extract_skills_from_text(cleaned)[:15]
    jd_skills: list[dict[str, Any]] = []
    for s in skills:
        flag = _essential_flag(cleaned, s)
        jd_skills.append(
            {
                "skill": s,
                "essential": flag == "essential",
            }
        )

    matched: list[str] = []
    missing: list[str] = []
    if cv_skills is not None and jd_skills:
        for item in jd_skills:
            name = str(item["skill"])
            if name.lower() in cv_skills:
                matched.append(name)
            else:
                missing.append(name)

    return {
        "jd_skills": jd_skills,
        "jd_text_limited": False,
        "cv_overlap_count": len(matched) if cv_skills is not None else None,
        "cv_overlap_total": len(jd_skills) if cv_skills is not None else None,
        "cv_matched_skills": matched,
        "cv_missing_skills": missing,
        "description_excerpt": cleaned[:1200],
    }
DAYS_PER_YEAR = 365
ESTABLISHED_DAYS = 5 * DAYS_PER_YEAR
MODERATE_DAYS = 2 * DAYS_PER_YEAR
LONG_STANDING_DAYS = 3 * DAYS_PER_YEAR

_cors = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
)
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

BAND_ORDER = {"Established": 0, "Moderate": 1, "Newly registered": 2}
CONF_ORDER = {"verified": 0, "likely": 1, "possible": 2}

app = FastAPI(title="UK Sponsor Analysis API", version="0.6.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ats_store.init_db()
ats_store.load_seed()
user_store.init_db()
app.include_router(user_routes.router)

_rate_hits: dict[str, list[float]] = defaultdict(list)


def _as_float(val: Any) -> float | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _tenure_band(duration_days: float | None) -> str:
    """User-facing band from observed register tenure (not Cox terciles)."""
    if duration_days is None or pd.isna(duration_days):
        return "Newly registered"
    days = float(duration_days)
    if days >= ESTABLISHED_DAYS:
        return "Established"
    if days >= MODERATE_DAYS:
        return "Moderate"
    return "Newly registered"


def _licence_years(duration_days: float | None) -> float | None:
    days = _as_float(duration_days)
    if days is None:
        return None
    return round(days / DAYS_PER_YEAR, 1)


def _stability_tooltip(band: str, licence_years: float | None) -> str:
    if licence_years is not None:
        years = licence_years
        return (
            f"On the sponsor register for ~{years:g} year"
            f"{'' if years == 1 else 's'} in our archive (left-truncated). "
            "Likely still sponsoring when you graduate."
        )
    return (
        f"{band}: tenure unknown or short in our archive (left-truncated). "
        "Not a guarantee of active hiring."
    )


def _long_standing(duration_days: float | None, band: str) -> bool:
    days = _as_float(duration_days)
    if band == "Established":
        return True
    return days is not None and days >= LONG_STANDING_DAYS


SUMMARY_PATH = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"


@lru_cache(maxsize=1)
def _register_display() -> dict[str, str]:
    """Lazy {company_key: example_name} for verify_identity in probe gating."""
    if not SUMMARY_PATH.exists():
        return {}
    df = pd.read_parquet(SUMMARY_PATH, columns=["company_key", "example_name"])
    return {
        str(r.company_key): str(r.example_name or r.company_key)
        for r in df.drop_duplicates("company_key").itertuples()
        if str(getattr(r, "company_key", "")).strip()
    }


@lru_cache(maxsize=1)
def _retention_by_key() -> dict[str, dict[str, Any]]:
    """Load tenure + optional Cox score for secondary sort."""
    if not RETENTION_PATH.exists():
        return {}
    df = pd.read_parquet(RETENTION_PATH)
    cols = set(df.columns)
    if "company_key" not in cols:
        return {}
    out: dict[str, dict[str, Any]] = {}
    for row in df.itertuples():
        duration = getattr(row, "duration_days", None) if "duration_days" in cols else None
        score = getattr(row, "stability_score", None) if "stability_score" in cols else None
        out[str(row.company_key)] = {
            "duration_days": duration,
            "stability_score": score,
            "still_active": getattr(row, "still_active", None)
            if "still_active" in cols
            else None,
            "last_seen": getattr(row, "last_seen", None) if "last_seen" in cols else None,
        }
    return out


def _filter_uk_df(jobs: pd.DataFrame) -> pd.DataFrame:
    if jobs.empty or "location" not in jobs.columns:
        return jobs
    mask = jobs["location"].fillna("").astype(str).map(is_uk)
    return jobs.loc[mask].reset_index(drop=True)


def _passes_min_salary(row: pd.Series, min_salary: float) -> bool:
    """Keep unknown salaries; drop only when a known figure is below the floor."""
    smax = _as_float(row.get("salary_max"))
    smin = _as_float(row.get("salary_min"))
    known = smax if smax is not None else smin
    if known is None:
        return True
    return known >= min_salary


def _format_salary(smin: float | None, smax: float | None) -> str | None:
    if smin is None and smax is None:
        return None

    def _fmt(v: float) -> str:
        if v >= 1000:
            k = v / 1000
            return f"£{k:.0f}k" if k == int(k) else f"£{k:.1f}k"
        return f"£{v:,.0f}"

    if smin is not None and smax is not None:
        if smin == smax:
            return _fmt(smin)
        return f"{_fmt(smin)}-{_fmt(smax)}"
    if smin is not None:
        return f"from {_fmt(smin)}"
    return f"up to {_fmt(smax)}"  # type: ignore[arg-type]


def _check_rate_limit(request: Request) -> None:
    if RATE_LIMIT_PER_MIN <= 0:
        return
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = _rate_hits[ip]
    _rate_hits[ip] = [t for t in window if now - t < 60]
    if len(_rate_hits[ip]) >= RATE_LIMIT_PER_MIN:
        raise HTTPException(
            status_code=429,
            detail="Too many analyses from this address. Wait a minute and try again.",
        )
    _rate_hits[ip].append(now)


def _check_analyze_key(x_analyze_key: str | None) -> None:
    expected = os.getenv("ANALYZE_API_KEY", "").strip()
    if not expected:
        return
    if (x_analyze_key or "").strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def _require_analyze_user(
    authorization: str | None,
    x_analyze_key: str | None,
) -> None:
    """Optional auth: enforce X-Analyze-Key when set; otherwise allow guest search."""
    expected = os.getenv("ANALYZE_API_KEY", "").strip()
    if expected:
        _check_analyze_key(x_analyze_key)
        return
    # Guests can search. If a Bearer token is present, validate it so signed-in
    # clients fail closed on bad tokens rather than silently proceeding.
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            user_routes._verify_clerk_jwt(token)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def probe_unknown_employers(employers: list[tuple[str, str]]) -> None:
    """
    employers: [(company_key, display_name), ...]
    Runs AFTER the response is sent. Never blocks a user.
    """
    for company_key, name in employers[:10]:
        if ats_store.get(company_key):
            continue
        try:
            result = ats_probe.probe(name)
        except Exception:
            result = None

        if not result:
            ats_store.upsert_miss(company_key)
            continue

        ats, token, published_name, jobs = result

        # Identity gate: verify the board's published name matches the register entry.
        # 'fail' or 'review' → cache as miss so we never re-probe (fail-closed).
        register_display = _register_display().get(company_key, name)
        id_verdict, id_score = verify_identity(register_display, published_name)
        if id_verdict != "pass":
            print(
                f"[probe] identity {id_verdict} ({id_score:.0f}): "
                f"{company_key!r} register={register_display!r} board={published_name!r}",
                flush=True,
            )
            ats_store.upsert_miss(company_key)
            continue

        score = int(fuzz.token_set_ratio(published_name.lower(), name.lower()))
        ats_store.upsert_hit(
            company_key,
            ats,
            token,
            published_name,
            score,
            board_has_uk_jobs(jobs),
        )


def fetch_ats_jobs(company_keys: list[str], role: str) -> pd.DataFrame:
    """Fetch jobs from boards we already know about. No probing."""
    mapping = ats_store.get_many(company_keys)
    rows: list[dict[str, Any]] = []
    role_terms = [t for t in role.lower().split() if len(t) > 2]
    fetched_at = utc_now_iso()

    live_items = [
        (company_key, row)
        for company_key, row in mapping.items()
        if row.get("status") == "live"
        and row.get("has_uk_jobs")
        and row.get("ats_provider")
        and row.get("board_token")
    ][:MAX_ATS_BOARDS]

    for company_key, row in live_items:
        provider = row.get("ats_provider")
        token = row.get("board_token")
        result = ats_probe.fetch_board(str(provider), str(token))
        if not result:
            ats_store.mark_stale(company_key)
            continue

        published = (
            result.get("published_name") or row.get("published_name") or company_key
        )
        for j in filter_uk(result["jobs"]):
            title = (j.get("title") or "").lower()
            if role_terms and not any(t in title for t in role_terms):
                continue
            desc = j.get("description") or ""
            rows.append(
                {
                    "source": str(provider),
                    "source_job_id": str(j.get("external_id") or ""),
                    "role_query": role,
                    "title": j.get("title") or "",
                    "company_raw": published,
                    "company_key": company_key,
                    "location": j.get("location") or "",
                    "salary_min": None,
                    "salary_max": None,
                    "description": desc,
                    "url": j.get("url") or "",
                    "fetched_at": fetched_at,
                    "description_full": bool(desc.strip()),
                    "sponsor_confidence": "verified",
                }
            )
    if not rows:
        return pd.DataFrame()
    raw = pd.DataFrame(rows)
    # Employer identity is certain; sponsor status still comes from the register.
    return match_jobs_to_sponsors(raw)


_REF_STRIP = re.compile(
    r"\s*[\(\[](ref\.?|reference|job ref|job no)[^\)\]]*[\)\]]", re.I
)


def _norm_dedupe(s: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def _norm_title(title: object) -> str:
    """Strip ref codes and normalise for cross-city dedupe."""
    t = _REF_STRIP.sub("", str(title or ""))
    return re.sub(r"[^a-z0-9]", "", t.lower())


def merge_dedupe(ats_jobs: pd.DataFrame, agg_jobs: pd.DataFrame) -> pd.DataFrame:
    """ATS version wins — employer identity is certain there."""
    frames = [f for f in (ats_jobs, agg_jobs) if f is not None and not f.empty]
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True, sort=False)

    # Pass 1: exact dedupe on (company_key, title, location prefix) — ATS first
    seen: set[tuple[str, str, str]] = set()
    keep_idx: list[int] = []
    for i, row in combined.iterrows():
        key = (
            _norm_dedupe(row.get("company_key")),
            _norm_dedupe(row.get("title")),
            _norm_dedupe(row.get("location"))[:20],
        )
        if key in seen:
            continue
        seen.add(key)
        keep_idx.append(int(i))  # type: ignore[arg-type]
    deduped = combined.iloc[keep_idx].reset_index(drop=True)

    # Pass 2: cross-city dedupe — same (company, normalised title) in different cities
    # Keeps the first occurrence; records collapsed count as other_locations.
    deduped2 = deduped.reset_index(drop=True).copy()
    title_seen: dict[tuple[str, str], int] = {}
    other_counts: dict[int, int] = {}
    drop_positions: list[int] = []

    for pos in range(len(deduped2)):
        row = deduped2.iloc[pos]
        k = (
            _norm_dedupe(row.get("company_key")),
            _norm_title(row.get("title")),
        )
        if k in title_seen:
            other_counts[title_seen[k]] = other_counts.get(title_seen[k], 0) + 1
            drop_positions.append(pos)
        else:
            title_seen[k] = pos

    deduped2["other_locations"] = 0
    for kept_pos, count in other_counts.items():
        deduped2.at[kept_pos, "other_locations"] = count

    if drop_positions:
        keep_mask = [i for i in range(len(deduped2)) if i not in set(drop_positions)]
        deduped2 = deduped2.iloc[keep_mask].reset_index(drop=True)

    return deduped2


def _employer_keys(matched: pd.DataFrame) -> list[tuple[str, str]]:
    """Unique (company_key, display_name) pairs for cache lookup + background probe."""
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for _, row in matched.iterrows():
        for key_col in ("company_key", "matched_company_key"):
            key = str(row.get(key_col) or "").strip()
            if not key or key in seen or key == "nan":
                continue
            name = str(row.get("company_raw") or key).strip() or key
            seen.add(key)
            out.append((key, name))
    return out


@app.post("/analyze")
async def analyze(
    request: Request,
    background_tasks: BackgroundTasks,
    role: str = Form(...),
    cv_file: UploadFile | None = File(None),
    cv_text: str = Form(""),
    min_salary: str = Form(""),
    experience_level: str = Form(""),
    is_new_entrant: str = Form(""),
    x_analyze_key: str | None = Header(default=None, alias="X-Analyze-Key"),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_analyze_user(authorization, x_analyze_key)
    _check_rate_limit(request)

    role = (role or "").strip()
    if len(role) < 2:
        raise HTTPException(status_code=400, detail="Role is required.")

    new_entrant_raw = (is_new_entrant or "").strip().lower()
    new_entrant = new_entrant_raw in {"1", "true", "yes", "on"}
    salary_threshold = (
        SKILLED_WORKER_NEW_ENTRANT_MIN
        if new_entrant
        else SKILLED_WORKER_GENERAL_MIN
    )

    exp_raw = (experience_level or "").strip().lower()
    if exp_raw in {"", "any", "all"}:
        exp_requested: str | None = None
    else:
        exp_requested = exp_raw

    min_salary_val: float | None = None
    raw_min = (min_salary or "").strip()
    if raw_min:
        try:
            min_salary_val = float(raw_min.replace(",", "").replace("£", ""))
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="min_salary must be a number."
            ) from exc
        if min_salary_val < 0:
            raise HTTPException(status_code=400, detail="min_salary must be ≥ 0.")

    text = (cv_text or "").strip()
    if len(text) > MAX_CV_TEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"CV text is too long (max {MAX_CV_TEXT_CHARS:,} characters).",
        )

    uploaded_pdf = False
    if cv_file is not None and cv_file.filename:
        name = (cv_file.filename or "").lower()
        if not (name.endswith(".pdf") or name.endswith(".txt")):
            raise HTTPException(
                status_code=400, detail="CV must be a PDF or TXT file."
            )
        raw = await cv_file.read()
        if len(raw) > MAX_CV_BYTES:
            raise HTTPException(
                status_code=400,
                detail="CV file is too large (max 5 MB).",
            )
        if raw:
            uploaded_pdf = name.endswith(".pdf")
            try:
                text = extract_text_from_bytes(raw, cv_file.filename)
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Could not read that CV. Use a text-based PDF (not a scan).",
                ) from None
            if uploaded_pdf and not text.strip():
                raise HTTPException(status_code=400, detail=EMPTY_PDF_MSG)

    has_cv = bool(text.strip())

    if has_cv and not os.getenv("LLM_API_KEY", "").strip():
        raise HTTPException(
            status_code=503,
            detail="LLM is required for CV review - set LLM_API_KEY",
        )

    try:
        jobs = fetch_all_jobs(
            role,
            max_per_source=MAX_PER_SOURCE,
            max_enrich_reed=MAX_REED_ENRICH,
        )
    except JobFetchError as exc:
        status = 503 if exc.config_error else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc
    except Exception:
        raise HTTPException(
            status_code=502, detail="Job search failed. Try again shortly."
        ) from None

    if jobs.empty:
        raise HTTPException(
            status_code=404, detail="No jobs found for that role. Try a broader title."
        )

    jobs = jobs.drop_duplicates(subset=["source", "source_job_id"], keep="first")
    jobs = _filter_uk_df(jobs)
    if jobs.empty:
        raise HTTPException(
            status_code=404,
            detail="No UK-located jobs found for that role. Try a broader title.",
        )

    if min_salary_val is not None:
        jobs = jobs[jobs.apply(lambda r: _passes_min_salary(r, min_salary_val), axis=1)]
        jobs = jobs.reset_index(drop=True)
        if jobs.empty:
            raise HTTPException(
                status_code=404,
                detail="No jobs met the minimum salary filter (unknown salaries are kept).",
            )

    matched = match_jobs_to_sponsors(jobs)

    employers = _employer_keys(matched)
    company_keys = [k for k, _ in employers]
    ats_jobs = fetch_ats_jobs(company_keys, role)
    if min_salary_val is not None and not ats_jobs.empty:
        ats_jobs = ats_jobs[
            ats_jobs.apply(lambda r: _passes_min_salary(r, min_salary_val), axis=1)
        ].reset_index(drop=True)
    matched = merge_dedupe(ats_jobs, matched)

    if "sponsor_confidence" not in matched.columns:
        matched["sponsor_confidence"] = None

    # Experience filter applies to skill frequencies / CV scoring / LLM context only.
    # Sponsor opportunity lists stay unfiltered.
    skills_jobs, exp_applied, exp_jobs_count, exp_note = filter_jobs_by_experience(
        matched, exp_requested
    )

    freq = skill_frequencies(skills_jobs, sponsors_only=False, top_n=30)
    n_full = (
        int(matched["description_full"].fillna(False).sum())
        if "description_full" in matched.columns
        else 0
    )
    jobs_for_skills = (
        int(freq["n_jobs"].iloc[0])
        if not freq.empty and "n_jobs" in freq.columns
        else len(skills_jobs)
    )

    retention = _retention_by_key()
    scored: dict[str, Any] | None = None
    if has_cv:
        scored = match_cv_to_skills(text, freq)

    sponsor_rows = matched[matched["is_sponsor"]].copy()
    possible_rows = matched[matched["is_possible_sponsor"]].copy()
    top_from_sponsors = not sponsor_rows.empty
    company_source = sponsor_rows if top_from_sponsors else matched

    sponsors_out = _build_sponsor_list(
        sponsor_rows,
        retention,
        cv_text=text if has_cv else None,
        salary_threshold=salary_threshold,
    )
    possible_out = _build_sponsor_list(
        possible_rows,
        retention,
        possible=True,
        cv_text=text if has_cv else None,
        salary_threshold=salary_threshold,
    )
    sponsors_out.extend(possible_out)

    top_companies = _top_hiring_companies(company_source, retention)

    freq_list = [
        {
            "skill": r.skill,
            "share_pct": round(100 * float(r.share), 1),
            "count": int(r.count),
            "essential_share_pct": round(100 * float(r.essential_share), 1),
        }
        for r in freq.itertuples()
    ]

    cv_feedback = None
    llm_message = "Upload a CV to get a match score, skill gaps, and recruiter review."
    skills_to_learn: list[dict[str, Any]] = []
    where_you_are: str | None = None
    if has_cv and scored is not None:
        skills_to_learn = skills_to_learn_from_gaps(scored.get("gaps"))
        where_you_are = where_you_are_from_match(scored)
        cv_feedback = generate_cv_feedback(
            role,
            text,
            freq_list,
            scored,
            jobs=skills_jobs,
            jobs_analyzed_for_skills=jobs_for_skills,
        )
        if cv_feedback is None:
            llm_message = "LLM skipped - no LLM_API_KEY configured."
        elif cv_feedback.get("error"):
            err = re.sub(r"\s+", " ", str(cv_feedback["error"])).strip()[:220]
            llm_message = (
                f"LLM review failed: {err} "
                "Skill match results below are still valid."
            )
            # Keep Python sections even when the narrative fails.
            cv_feedback.setdefault("skills_to_learn", skills_to_learn)
            cv_feedback.setdefault("where_you_are", where_you_are)
            cv_feedback.setdefault("jobs_in_skill_analysis", jobs_for_skills)
        else:
            llm_message = "ok"
            if cv_feedback.get("where_you_are"):
                where_you_are = str(cv_feedback["where_you_are"])
            # Prefer deterministic Python learn-list; LLM narrates in full_report.
            cv_feedback["skills_to_learn"] = skills_to_learn
            cv_feedback["jobs_in_skill_analysis"] = jobs_for_skills

    n = len(matched)
    n_sp = int(matched["is_sponsor"].sum())
    n_verified = (
        int((matched["sponsor_confidence"] == "verified").sum())
        if "sponsor_confidence" in matched.columns
        else 0
    )
    jd_excerpts = (
        int(
            cv_feedback.get("jd_excerpts_used")
            or cv_feedback.get("jobs_reviewed")
            or 0
        )
        if cv_feedback
        else 0
    )
    truncated = bool(cv_feedback.get("jobs_context_truncated")) if cv_feedback else False

    background_tasks.add_task(probe_unknown_employers, employers)

    result: dict[str, Any] = {
        "role": role,
        "has_cv": has_cv,
        "jobs_total": n,
        "jobs_sponsor_matched": n_sp,
        "jobs_verified": n_verified,
        "jobs_scanned_for_skills": jobs_for_skills,
        "jobs_in_skill_analysis": jobs_for_skills if has_cv else 0,
        "jobs_full_description": n_full,
        "jobs_sent_to_llm": jd_excerpts,
        "jd_excerpts_used": jd_excerpts,
        "jobs_llm_truncated": truncated,
        "top_companies_are_sponsors": top_from_sponsors,
        "match_rate_pct": round(100 * n_sp / n, 1) if n else 0.0,
        "min_salary_filter": min_salary_val,
        "experience_level_requested": exp_requested or "any",
        "experience_filter_applied": bool(exp_applied),
        "experience_jobs_count": int(exp_jobs_count),
        "experience_filter_note": exp_note or None,
        "requirement_frequencies": freq_list,
        "sponsors": sponsors_out,
        "top_companies": top_companies,
        "cv_text_chars": len(text) if has_cv else 0,
        "cv_feedback": cv_feedback,
        "where_you_are": where_you_are,
        "skills_to_learn": skills_to_learn,
        "llm_message": llm_message,
        "stability_caveat": TENURE_CAVEAT,
        "skilled_worker_salary_threshold": salary_threshold,
        "is_new_entrant": new_entrant,
        "accuracy_note": (
            "Verified jobs are from company careers pages and identity is certain. "
            "Likely and Possible jobs are name-matched to the register and accurate "
            "in about 59 of 100 cases in our tests. Skills are counted from Reed "
            "full-text job descriptions where available. See ACCURACY.md for the "
            "full methodology."
        ),
        "chart": {
            "top_companies": top_companies,
        },
    }

    if scored is not None:
        result.update(
            {
                "score": scored["score"],
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
        )
    else:
        result.update(
            {
                "score": None,
                "score_label": None,
                "matched_count": None,
                "top_n": None,
                "readiness_pct": None,
                "matched_skills": [],
                "gaps": [],
                "gap_suggestion": None,
            }
        )

    return result


def _parse_recency(val: Any) -> float:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 0.0
    try:
        return float(pd.Timestamp(val).timestamp())
    except (TypeError, ValueError):
        return 0.0


def _build_sponsor_list(
    df: pd.DataFrame,
    retention: dict[str, dict[str, Any]],
    *,
    possible: bool = False,
    limit: int = 40,
    cv_text: str | None = None,
    salary_threshold: float = SKILLED_WORKER_GENERAL_MIN,
) -> list[dict[str, Any]]:
    if df.empty:
        return []

    cv_skills = _cv_skill_set(cv_text) if cv_text else None

    rows = df.copy()
    bands: list[str] = []
    recencies: list[float] = []
    conf_ranks: list[int] = []
    stab_scores: list[float] = []
    for _, row in rows.iterrows():
        mk = row.get("matched_company_key") or row.get("company_key")
        info = retention.get(str(mk)) if mk else None
        duration = info.get("duration_days") if info else None
        band = _tenure_band(duration)
        bands.append(band)
        last = info.get("last_seen") if info else row.get("last_seen")
        recencies.append(_parse_recency(last))
        conf = row.get("sponsor_confidence")
        if conf is None or (isinstance(conf, float) and pd.isna(conf)):
            conf = "possible" if possible else "likely"
        conf_ranks.append(CONF_ORDER.get(str(conf), 2))
        sc = _as_float(info.get("stability_score") if info else None)
        stab_scores.append(sc if sc is not None else -1.0)

    rows["_band"] = bands
    rows["_band_rank"] = rows["_band"].map(lambda b: BAND_ORDER.get(b, 99))
    rows["_recency"] = recencies
    rows["_conf_rank"] = conf_ranks
    rows["_stab"] = stab_scores
    rows = rows.sort_values(
        ["_conf_rank", "_band_rank", "_stab", "_recency"],
        ascending=[True, True, False, False],
        na_position="last",
    )

    out: list[dict[str, Any]] = []
    for _, row in rows.head(limit).iterrows():
        mk = row.get("matched_company_key") or row.get("company_key")
        info = retention.get(str(mk)) if mk else None
        duration = info.get("duration_days") if info else None
        band = _tenure_band(duration)
        years = _licence_years(duration)
        conf_raw = row.get("sponsor_confidence")
        if conf_raw is None or (isinstance(conf_raw, float) and pd.isna(conf_raw)):
            conf_out = "possible" if possible else "likely"
        else:
            conf_out = str(conf_raw)
        ms = row.get("match_score")
        smin = _as_float(row.get("salary_min"))
        smax = _as_float(row.get("salary_max"))
        matched_sponsor = row.get("matched_company_key") or row.get("company_key")
        jd = _jd_skill_payload(row, cv_skills)
        company_raw = row.get("company_raw")
        out.append(
            {
                "title": row.get("title"),
                "company": company_raw,
                "company_raw": company_raw,
                "matched_sponsor": matched_sponsor,
                "match_score": None
                if ms is None or (isinstance(ms, float) and pd.isna(ms))
                else round(float(ms), 1),
                "stability_band": band,
                "licence_years": years,
                "stability_tooltip": _stability_tooltip(band, years),
                "long_standing_licence": _long_standing(duration, band),
                "sponsor_confidence": conf_out,
                "is_possible_sponsor": possible or conf_out == "possible",
                "location": row.get("location") or "Location not stated",
                "salary_min": smin,
                "salary_max": smax,
                "salary_display": _format_salary(smin, smax),
                "salary_vs_threshold": _salary_vs_threshold(
                    smin, smax, salary_threshold
                ),
                "url": row.get("url"),
                "source": row.get("source"),
                "jd_skills": jd["jd_skills"],
                "jd_text_limited": jd["jd_text_limited"],
                "cv_overlap_count": jd["cv_overlap_count"],
                "cv_overlap_total": jd["cv_overlap_total"],
                "cv_matched_skills": jd["cv_matched_skills"],
                "cv_missing_skills": jd["cv_missing_skills"],
                "description_excerpt": jd["description_excerpt"],
            }
        )
    return out


def _top_hiring_companies(
    jobs: pd.DataFrame,
    retention: dict[str, dict[str, Any]],
    limit: int = 12,
) -> list[dict]:
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

    def _mode_location(series: pd.Series) -> str:
        s = series.fillna("").astype(str).str.strip()
        s = s[s != ""]
        if s.empty:
            return "Location not stated"
        return str(s.value_counts().index[0])[:60]

    grouped = (
        df.groupby("company_label", as_index=False)
        .agg(jobs=("title", "size"), location=("location", _mode_location))
        .sort_values("jobs", ascending=False)
        .head(limit)
    )
    result = []
    for r in grouped.itertuples():
        info = retention.get(str(r.company_label))
        duration = info.get("duration_days") if info else None
        band = _tenure_band(duration)
        years = _licence_years(duration)
        result.append(
            {
                "company": str(r.company_label)[:50],
                "jobs": int(r.jobs),
                "location": str(r.location),
                "stability_band": band,
                "licence_years": years,
                "stability_tooltip": _stability_tooltip(band, years),
                "long_standing_licence": _long_standing(duration, band),
            }
        )
    return result

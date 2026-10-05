"""Finding the ads for a search.

Ads come from the job boards (Reed, Adzuna) and from employers' own hiring
boards we already know about. Employer identity is certain for the second kind.
"""

from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import pandas as pd
from fastapi import HTTPException
from rapidfuzz import fuzz

from experience_level import classify_job_level
from job_schema import utc_now_iso
from match_sponsors import match_jobs_to_sponsors
from name_verify import verify_identity
from run_jobs_pipeline import JobFetchError, fetch_all_jobs

from . import ats_probe, ats_store, config
from .job_filters import collapse_repeat_listings, normalise_key
from .register_data import register_display
from .uk_location import board_has_uk_jobs, filter_uk

logger = logging.getLogger(__name__)

# Employers probed for a hiring board after each search. The probe runs after
# the response is sent, so it never slows a user down.
MAX_PROBES_PER_SEARCH = 10

# Words that only describe a kind of job together with another word
# ("Software Engineer" is about "software", not "engineer").
_GENERIC_ROLE_WORDS = {
    "engineer", "engineering", "developer", "development", "analyst", "manager",
    "consultant", "specialist", "officer", "assistant", "executive", "associate",
    "scientist", "designer", "technician", "administrator", "coordinator",
    "graduate", "junior", "senior", "lead", "trainee", "intern", "and", "of", "the",
}


# --- the extra search for the candidate's level -----------------------------------


def level_search_term(role: str, level: str | None) -> str | None:
    """"graduate software engineer" for a graduate searching "software engineer".

    None for mid level (the plain search already covers it) and when the role
    typed already names a level.
    """
    if level not in config.LEVEL_SEARCH_WORDS or classify_job_level(role) is not None:
        return None
    return f"{level} {role}"


def title_fits_role(title: Any, role: str) -> bool:
    """Whether an ad title is the same kind of job as the role searched.

    It must contain every specific word of the role. Job boards match a level
    search like "graduate software engineer" loosely and also return
    "Graduate Structural Engineer" or "Trainee Recruitment Consultant".
    """
    words = re.findall(r"[a-z0-9+#]+", role.lower())
    specific = [w for w in words if w not in _GENERIC_ROLE_WORDS] or words
    low = str(title or "").lower()
    return all(re.search(rf"(?<![a-z0-9]){re.escape(w)}", low) for w in specific)


def _fetch_level_jobs(term: str, role: str) -> pd.DataFrame | None:
    """The extra search. It is a bonus, so any failure just means no bonus ads."""
    try:
        found = fetch_all_jobs(
            term,
            max_per_source=config.LEVEL_SEARCH_MAX_PER_SOURCE,
            max_enrich_reed=config.LEVEL_SEARCH_REED_ENRICH,
        )
    except Exception as exc:  # best effort by design: the main search decides the result
        logger.warning("Level search %r skipped: %s", term, exc)
        return None
    if found is None or found.empty or "title" not in found.columns:
        return found
    kept = found[found["title"].map(lambda t: title_fits_role(t, role))]
    logger.info("Level search %r kept %d of %d ads as the same role", term, len(kept), len(found))
    return kept.reset_index(drop=True)


def search_jobs(role: str, level_term: str | None) -> tuple[pd.DataFrame, pd.DataFrame | None]:
    """The role's ads and, when a level search ran, its ads (already merged in)."""
    level_jobs: pd.DataFrame | None = None
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            level_future = pool.submit(_fetch_level_jobs, level_term, role) if level_term else None
            jobs = fetch_all_jobs(
                role,
                max_per_source=config.MAX_PER_SOURCE,
                max_enrich_reed=config.MAX_REED_ENRICH,
            )
            if level_future is not None:
                level_jobs = level_future.result()
        if level_jobs is not None and not level_jobs.empty:
            jobs = pd.concat([jobs, level_jobs], ignore_index=True)
    except JobFetchError as exc:
        raise HTTPException(status_code=503 if exc.config_error else 502, detail=str(exc)) from exc
    except Exception:
        logger.exception("Job search failed")
        raise HTTPException(status_code=502, detail="Job search failed. Try again shortly.") from None
    return jobs, level_jobs


# --- employers' own hiring boards ----------------------------------------------------


def _ats_row(job: dict[str, Any], provider: str, company_key: str, published: str, role: str, fetched_at: str) -> dict[str, Any]:
    description = job.get("description") or ""
    return {
        "source": provider,
        "source_job_id": str(job.get("external_id") or ""),
        "role_query": role,
        "title": job.get("title") or "",
        "company_raw": published,
        "company_key": company_key,
        "location": job.get("location") or "",
        "salary_min": None,
        "salary_max": None,
        "description": description,
        "url": job.get("url") or "",
        "fetched_at": fetched_at,
        "description_full": bool(description.strip()),
        "sponsor_confidence": "verified",
    }


def fetch_ats_jobs(company_keys: list[str], role: str) -> pd.DataFrame:
    """Ads from boards we already know about. Never probes for new ones."""
    mapping = ats_store.get_many(company_keys)
    role_terms = [t for t in role.lower().split() if len(t) > 2]
    fetched_at = utc_now_iso()

    live = [
        (company_key, row)
        for company_key, row in mapping.items()
        if row.get("status") == "live"
        and row.get("has_uk_jobs")
        and row.get("ats_provider")
        and row.get("board_token")
    ][: config.MAX_ATS_BOARDS]

    rows: list[dict[str, Any]] = []
    for company_key, row in live:
        provider = str(row.get("ats_provider"))
        result = ats_probe.fetch_board(provider, str(row.get("board_token")))
        if not result:
            ats_store.mark_stale(company_key)
            continue
        published = result.get("published_name") or row.get("published_name") or company_key
        for job in filter_uk(result["jobs"]):
            title = (job.get("title") or "").lower()
            if role_terms and not any(t in title for t in role_terms):
                continue
            rows.append(_ats_row(job, provider, company_key, published, role, fetched_at))
    if not rows:
        return pd.DataFrame()
    # Employer identity is certain; sponsor status still comes from the register.
    return match_jobs_to_sponsors(pd.DataFrame(rows))


def probe_unknown_employers(employers: list[tuple[str, str]]) -> None:
    """Look for a hiring board for employers we have not checked before.

    Runs after the response is sent. A board only counts when its published
    name passes the identity check against the register, and a miss is cached
    so we never probe the same employer twice.
    """
    for company_key, name in employers[:MAX_PROBES_PER_SEARCH]:
        if ats_store.get(company_key):
            continue
        try:
            result = ats_probe.probe(name)
        except Exception:  # one odd employer must not stop the rest
            logger.warning("Hiring-board probe for %r failed", name, exc_info=True)
            result = None
        if not result:
            ats_store.upsert_miss(company_key)
            continue

        ats, token, published_name, jobs = result
        register_name = register_display().get(company_key, name)
        verdict, score = verify_identity(register_name, published_name)
        if verdict != "pass":
            logger.info(
                "Hiring board identity %s (%.0f): %r register=%r board=%r",
                verdict, score, company_key, register_name, published_name,
            )
            ats_store.upsert_miss(company_key)
            continue

        match_score = int(fuzz.token_set_ratio(published_name.lower(), name.lower()))
        ats_store.upsert_hit(
            company_key, ats, token, published_name, match_score, board_has_uk_jobs(jobs)
        )


# --- merging and de-duplicating --------------------------------------------------------


def merge_dedupe(ats_jobs: pd.DataFrame, agg_jobs: pd.DataFrame) -> pd.DataFrame:
    """Employers' own boards first, so their (certain) version of an ad wins."""
    frames = [f for f in (ats_jobs, agg_jobs) if f is not None and not f.empty]
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True, sort=False)

    # Same employer, title and place: keep the first.
    seen: set[tuple[str, str, str]] = set()
    keep: list[int] = []
    for i, row in combined.iterrows():
        key = (
            normalise_key(row.get("company_key")),
            normalise_key(row.get("title")),
            normalise_key(row.get("location"))[:20],
        )
        if key not in seen:
            seen.add(key)
            keep.append(int(i))  # type: ignore[arg-type]
    return collapse_repeat_listings(combined.iloc[keep].reset_index(drop=True))


def sponsor_register_keys(matched: pd.DataFrame) -> list[tuple[str, str]]:
    """(register key, employer name) for every ad matched to a current sponsor.

    These are the employers worth probing for a careers board. The probe checks
    the board's name against the register's name, which only means something
    for an employer that is on the register.
    """
    if matched.empty or "matched_company_key" not in matched.columns:
        return []
    sponsors = matched[matched["is_sponsor"].fillna(False) | matched["is_possible_sponsor"].fillna(False)]
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for _, row in sponsors.iterrows():
        key = str(row.get("matched_company_key") or "").strip()
        if not key or key in seen or key == "nan":
            continue
        seen.add(key)
        out.append((key, str(row.get("company_raw") or key).strip() or key))
    return out


def employer_keys(matched: pd.DataFrame) -> list[tuple[str, str]]:
    """Unique (company_key, display name) pairs, for the careers-board cache lookup."""
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for _, row in matched.iterrows():
        for key_col in ("company_key", "matched_company_key"):
            key = str(row.get(key_col) or "").strip()
            if not key or key in seen or key == "nan":
                continue
            seen.add(key)
            out.append((key, str(row.get("company_raw") or key).strip() or key))
    return out

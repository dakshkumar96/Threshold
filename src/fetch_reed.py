"""Fetch UK jobs from the Reed Jobseeker API for a given role."""

from __future__ import annotations

import logging
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd

import settings
from clean_names import clean_company_name
from http_errors import get_json
from job_schema import utc_now_iso
from settings import MissingSettingError

logger = logging.getLogger(__name__)

REED_SEARCH_URL = "https://www.reed.co.uk/api/1.0/search"
REED_JOB_URL = "https://www.reed.co.uk/api/1.0/jobs/{job_id}"
PAGE_SIZE = 100
SEARCH_TIMEOUT_SECONDS = 60
JOB_TIMEOUT_SECONDS = 45


def fetch_reed_jobs(role: str, max_jobs: int = 250) -> pd.DataFrame:
    """Search Reed for `role` and return a normalised jobs dataframe."""
    api_key = settings.reed_api_key()
    if not api_key:
        raise MissingSettingError("Missing REED_API_KEY in .env")

    rows: list[dict] = []
    skip = 0
    fetched_at = utc_now_iso()

    while len(rows) < max_jobs:
        take = min(PAGE_SIZE, max_jobs - len(rows))
        reply = get_json(
            REED_SEARCH_URL,
            params={"keywords": role, "resultsToTake": take, "resultsToSkip": skip},
            auth=(api_key, ""),
            timeout=SEARCH_TIMEOUT_SECONDS,
        )
        results = reply.get("results") or []
        if not results:
            break

        for job in results:
            company = job.get("employerName") or ""
            rows.append(
                {
                    "source": "reed",
                    "source_job_id": str(job.get("jobId", "")),
                    "role_query": role,
                    "title": job.get("jobTitle") or "",
                    "company_raw": company,
                    "company_key": clean_company_name(company),
                    "location": job.get("locationName") or "",
                    "salary_min": job.get("minimumSalary"),
                    "salary_max": job.get("maximumSalary"),
                    "description": job.get("jobDescription") or "",
                    "url": job.get("jobUrl") or "",
                    "fetched_at": fetched_at,
                    "description_full": False,
                }
            )

        skip += len(results)
        if len(results) < take:
            break

    return pd.DataFrame(rows)


def _fetch_one_full_description(api_key: str, job_id: str) -> tuple[str, str]:
    """(job_id, full description), or an empty description if it could not be fetched."""
    try:
        reply = get_json(
            REED_JOB_URL.format(job_id=job_id),
            auth=(api_key, ""),
            timeout=JOB_TIMEOUT_SECONDS,
        )
        return job_id, (reply.get("jobDescription") or "").strip()
    except Exception as exc:  # best effort: the short snippet from the search is kept
        logger.warning("Reed job %s: full description not fetched (%s)", job_id, exc)
        return job_id, ""


def enrich_reed_full_descriptions(
    jobs: pd.DataFrame,
    max_workers: int = 8,
    max_enrich: int | None = None,
) -> pd.DataFrame:
    """Replace Reed's truncated search snippets with full descriptions.

    Other sources are left alone (Adzuna has no public details endpoint).
    """
    if jobs.empty or "source" not in jobs.columns:
        return jobs

    api_key = settings.reed_api_key()
    if not api_key:
        return jobs

    df = jobs.copy()
    if "description_full" not in df.columns:
        df["description_full"] = False

    reed_mask = df["source"].astype(str).str.lower() == "reed"
    ids = [
        str(jid)
        for jid in df.loc[reed_mask, "source_job_id"].tolist()
        if str(jid).strip()
    ]
    if max_enrich is not None and max_enrich >= 0:
        ids = ids[:max_enrich]
    if not ids:
        return df

    updates: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = [pool.submit(_fetch_one_full_description, api_key, jid) for jid in ids]
        for future in as_completed(futures):
            job_id, full = future.result()
            if full:
                updates[job_id] = full

    for idx in df.index[reed_mask]:
        job_id = str(df.at[idx, "source_job_id"])
        if job_id in updates:
            df.at[idx, "description"] = updates[job_id]
            df.at[idx, "description_full"] = True

    logger.info("Reed full description fetch: %d of %d jobs upgraded", len(updates), len(ids))
    return df


if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "data analyst"
    df = fetch_reed_jobs(role)
    print(f"Reed: {len(df)} jobs for '{role}'")
    if not df.empty:
        print(df[["title", "company_raw", "location"]].head())

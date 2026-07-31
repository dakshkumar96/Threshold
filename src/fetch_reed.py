"""Fetch UK jobs from the Reed Jobseeker API for a given role."""

from __future__ import annotations

import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from clean_names import clean_company_name
from job_schema import load_env, utc_now_iso

REED_SEARCH_URL = "https://www.reed.co.uk/api/1.0/search"
REED_JOB_URL = "https://www.reed.co.uk/api/1.0/jobs/{job_id}"
PAGE_SIZE = 100


def fetch_reed_jobs(role: str, max_jobs: int = 250) -> pd.DataFrame:
    """Search Reed for `role` and return a normalised jobs dataframe."""
    load_env()
    api_key = os.getenv("REED_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Missing REED_API_KEY in .env")

    rows: list[dict] = []
    skip = 0
    fetched_at = utc_now_iso()

    while len(rows) < max_jobs:
        take = min(PAGE_SIZE, max_jobs - len(rows))
        response = requests.get(
            REED_SEARCH_URL,
            params={
                "keywords": role,
                "resultsToTake": take,
                "resultsToSkip": skip,
            },
            auth=(api_key, ""),
            timeout=60,
        )
        response.raise_for_status()
        results = response.json().get("results") or []
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
    """Return (job_id, full_description_or_empty)."""
    try:
        r = requests.get(
            REED_JOB_URL.format(job_id=job_id),
            auth=(api_key, ""),
            timeout=45,
        )
        r.raise_for_status()
        return job_id, (r.json().get("jobDescription") or "").strip()
    except Exception:
        return job_id, ""


def enrich_reed_full_descriptions(
    jobs: pd.DataFrame,
    max_workers: int = 8,
    max_enrich: int | None = None,
) -> pd.DataFrame:
    """
    Replace truncated Reed search snippets with full JDs from /jobs/{id}.
    Adzuna / other sources are left unchanged (no public details endpoint).
    """
    if jobs.empty or "source" not in jobs.columns:
        return jobs

    load_env()
    api_key = os.getenv("REED_API_KEY", "").strip()
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
        futs = [
            pool.submit(_fetch_one_full_description, api_key, jid) for jid in ids
        ]
        for fut in as_completed(futs):
            jid, full = fut.result()
            if full:
                updates[jid] = full

    for idx in df.index[reed_mask]:
        jid = str(df.at[idx, "source_job_id"])
        if jid in updates:
            df.at[idx, "description"] = updates[jid]
            df.at[idx, "description_full"] = True

    print(
        f"Reed full JD enrichment: {len(updates)}/{len(ids)} jobs upgraded"
    )
    return df


if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "data analyst"
    df = fetch_reed_jobs(role)
    print(f"Reed: {len(df)} jobs for '{role}'")
    if not df.empty:
        print(df[["title", "company_raw", "location"]].head())

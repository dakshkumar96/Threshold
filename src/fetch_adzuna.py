"""Fetch UK jobs from the Adzuna API for a given role."""

from __future__ import annotations

import html
import os
import re
import sys
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from clean_names import clean_company_name
from job_schema import load_env, utc_now_iso

ADZUNA_SEARCH_URL = "https://api.adzuna.com/v1/api/jobs/gb/search/{page}"
PAGE_SIZE = 50


def _clean_adzuna_description(raw: str) -> str:
    """Adzuna search snippets are HTML-escaped / truncated (~500 chars)."""
    text = html.unescape(raw or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_adzuna_jobs(role: str, max_jobs: int = 250) -> pd.DataFrame:
    """Search Adzuna GB for `role` and return a normalised jobs dataframe."""
    load_env()
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        raise RuntimeError(
            "Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in .env "
            "(Adzuna needs both from developer.adzuna.com)"
        )

    rows: list[dict] = []
    page = 1
    fetched_at = utc_now_iso()

    while len(rows) < max_jobs:
        response = requests.get(
            ADZUNA_SEARCH_URL.format(page=page),
            params={
                "app_id": app_id,
                "app_key": app_key,
                "results_per_page": PAGE_SIZE,
                "what": role,
                "content-type": "application/json",
            },
            timeout=60,
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        if not results:
            break

        for job in results:
            company = (job.get("company") or {}).get("display_name") or ""
            location = (job.get("location") or {}).get("display_name") or ""
            # Prefer longest available text field from the payload
            desc_candidates = [
                job.get("description") or "",
                job.get("snippet") or "",
            ]
            desc = max((_clean_adzuna_description(c) for c in desc_candidates), key=len)
            rows.append(
                {
                    "source": "adzuna",
                    "source_job_id": str(job.get("id", "")),
                    "role_query": role,
                    "title": job.get("title") or "",
                    "company_raw": company,
                    "company_key": clean_company_name(company),
                    "location": location,
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "description": desc,
                    "url": job.get("redirect_url") or "",
                    "fetched_at": fetched_at,
                    "description_full": False,
                }
            )

        page += 1
        if len(results) < PAGE_SIZE:
            break

    return pd.DataFrame(rows[:max_jobs])


def enrich_adzuna_descriptions(jobs: pd.DataFrame) -> pd.DataFrame:
    """
    Best-effort Adzuna enrichment.

    Public Adzuna API has no job-details endpoint and their HTML pages block bots
    (403/429). We still normalise/unescape every description thoroughly so the
    LLM and skill extractor get the cleanest text available from search.
    """
    if jobs.empty or "source" not in jobs.columns:
        return jobs
    df = jobs.copy()
    if "description_full" not in df.columns:
        df["description_full"] = False
    mask = df["source"].astype(str).str.lower() == "adzuna"
    if not mask.any():
        return df
    df.loc[mask, "description"] = df.loc[mask, "description"].map(
        lambda x: _clean_adzuna_description(str(x or ""))
    )
    print(
        f"Adzuna JD note: {int(mask.sum())} jobs cleaned; "
        "API returns truncated snippets only (no public full-JD endpoint)."
    )
    return df


if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "data analyst"
    df = fetch_adzuna_jobs(role)
    print(f"Adzuna: {len(df)} jobs for '{role}'")
    if not df.empty:
        print(df[["title", "company_raw", "location"]].head())

"""Fetch UK jobs from the Adzuna API for a given role."""

from __future__ import annotations

import html
import logging
import re
import sys

import pandas as pd

import settings
from clean_names import clean_company_name
from http_errors import get_json
from job_schema import utc_now_iso
from settings import MissingSettingError

logger = logging.getLogger(__name__)

ADZUNA_SEARCH_URL = "https://api.adzuna.com/v1/api/jobs/gb/search/{page}"
PAGE_SIZE = 50
SEARCH_TIMEOUT_SECONDS = 60


def _clean_adzuna_description(raw: str) -> str:
    """Adzuna search snippets are HTML-escaped and cut off at about 500 characters."""
    text = html.unescape(raw or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_adzuna_jobs(role: str, max_jobs: int = 250) -> pd.DataFrame:
    """Search Adzuna GB for `role` and return a normalised jobs dataframe."""
    app_id, app_key = settings.adzuna_credentials()
    if not app_id or not app_key:
        raise MissingSettingError(
            "Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in .env "
            "(Adzuna needs both from developer.adzuna.com)"
        )

    rows: list[dict] = []
    page = 1
    fetched_at = utc_now_iso()

    while len(rows) < max_jobs:
        reply = get_json(
            ADZUNA_SEARCH_URL.format(page=page),
            params={
                "app_id": app_id,
                "app_key": app_key,
                "results_per_page": PAGE_SIZE,
                "what": role,
                "content-type": "application/json",
            },
            timeout=SEARCH_TIMEOUT_SECONDS,
        )
        results = reply.get("results") or []
        if not results:
            break

        for job in results:
            company = (job.get("company") or {}).get("display_name") or ""
            location = (job.get("location") or {}).get("display_name") or ""
            # Both fields are snippets: keep whichever is longer.
            candidates = [job.get("description") or "", job.get("snippet") or ""]
            description = max((_clean_adzuna_description(c) for c in candidates), key=len)
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
                    "description": description,
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
    """Clean every Adzuna description as thoroughly as we can.

    Adzuna has no job-details endpoint and its web pages block bots, so the
    search snippet is all there is. Cleaning it gives the skill counter and
    the AI the best text available from it.
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
    logger.info("Adzuna: %d descriptions cleaned (snippets only, no full text)", int(mask.sum()))
    return df


if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "data analyst"
    df = fetch_adzuna_jobs(role)
    print(f"Adzuna: {len(df)} jobs for '{role}'")
    if not df.empty:
        print(df[["title", "company_raw", "location"]].head())

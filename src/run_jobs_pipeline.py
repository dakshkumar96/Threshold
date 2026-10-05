"""
Fetch jobs for a role from Reed and Adzuna, match them to sponsors, save parquet.

Usage:
    python src/run_jobs_pipeline.py "data analyst"
"""

from __future__ import annotations

import logging
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent.parent
# This file can be run as a script, so make `src/` and the repo root importable.
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from api.job_filters import collapse_repeat_listings, filter_uk_df  # noqa: E402
from fetch_adzuna import enrich_adzuna_descriptions, fetch_adzuna_jobs  # noqa: E402
from fetch_reed import enrich_reed_full_descriptions, fetch_reed_jobs  # noqa: E402
from http_errors import describe  # noqa: E402
from job_schema import role_slug  # noqa: E402
from match_sponsors import match_jobs_to_sponsors  # noqa: E402
from settings import MissingSettingError  # noqa: E402

logger = logging.getLogger(__name__)


def _reason(exc: Exception) -> str:
    """Why a source failed, safe to show and to log. A raw `requests` error carries the full address."""
    return describe(exc) if isinstance(exc, requests.RequestException) else str(exc)


class JobFetchError(RuntimeError):
    """No jobs could be fetched and at least one source failed."""

    def __init__(self, message: str, *, config_error: bool = False):
        super().__init__(message)
        self.config_error = config_error


def fetch_all_jobs(
    role: str,
    max_per_source: int = 250,
    enrich_full_jd: bool = True,
    max_enrich_reed: int | None = None,
) -> pd.DataFrame:
    """Reed and Adzuna ads for `role`, fetched in parallel, UK locations only.

    One source failing is fine as long as the other returns ads. If every
    source fails this raises JobFetchError, with `config_error` set when the
    cause was missing keys.
    """

    def reed() -> pd.DataFrame:
        jobs = fetch_reed_jobs(role, max_jobs=max_per_source)
        logger.info("Reed: %d jobs", len(jobs))
        if jobs.empty or not enrich_full_jd:
            return jobs
        return enrich_reed_full_descriptions(jobs, max_enrich=max_enrich_reed)

    def adzuna() -> pd.DataFrame:
        jobs = fetch_adzuna_jobs(role, max_jobs=max_per_source)
        logger.info("Adzuna: %d jobs", len(jobs))
        return jobs if jobs.empty else enrich_adzuna_descriptions(jobs)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {"Reed": pool.submit(reed), "Adzuna": pool.submit(adzuna)}

    frames: list[pd.DataFrame] = []
    errors: list[str] = []
    missing_keys = 0
    for label, future in futures.items():
        try:
            jobs = future.result()
        except Exception as exc:  # a failed source is reported, not fatal
            logger.warning("%s skipped: %s", label, _reason(exc))
            errors.append(f"{label}: {_reason(exc)}")
            missing_keys += isinstance(exc, MissingSettingError)
            continue
        if not jobs.empty:
            frames.append(jobs)

    if frames:
        return filter_uk_df(pd.concat(frames, ignore_index=True))
    if errors:
        raise JobFetchError(
            "No jobs fetched. " + " | ".join(errors),
            config_error=missing_keys > 0 and missing_keys == len(errors),
        )
    return pd.DataFrame()


def run(role: str = "data analyst") -> tuple[Path, Path]:
    out_dir = ROOT / "data" / "processed"
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = role_slug(role)

    jobs = fetch_all_jobs(role)
    if jobs.empty:
        raise RuntimeError("No jobs fetched from any source.")

    jobs = jobs.drop_duplicates(subset=["source", "source_job_id"], keep="first")
    jobs = collapse_repeat_listings(filter_uk_df(jobs))

    matched = match_jobs_to_sponsors(jobs)
    jobs_path = out_dir / f"jobs_{slug}.parquet"
    matched_path = out_dir / f"jobs_matched_{slug}.parquet"
    jobs.to_parquet(jobs_path, index=False)
    matched.to_parquet(matched_path, index=False)

    n = len(matched)
    n_sponsor = int(matched["is_sponsor"].sum())
    print(f"\nRole: {role}")
    print(f"Total jobs: {n}")
    print(f"Matched to sponsor: {n_sponsor} ({100 * n_sponsor / n:.1f}%)")
    print(f"Saved: {jobs_path.name}")
    print(f"Saved: {matched_path.name}")
    return jobs_path, matched_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    run(" ".join(sys.argv[1:]) if len(sys.argv) > 1 else "data analyst")

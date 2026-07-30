"""
Fetch jobs for a role from Reed (+ Adzuna if configured), match to sponsors, save parquet.

Usage:
    python src/run_jobs_pipeline.py "data analyst"
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from api.uk_location import is_uk  # noqa: E402
from fetch_adzuna import enrich_adzuna_descriptions, fetch_adzuna_jobs
from fetch_reed import enrich_reed_full_descriptions, fetch_reed_jobs
from job_schema import role_slug
from match_sponsors import match_jobs_to_sponsors


_REF_STRIP = re.compile(
    r"\s*[\(\[](ref\.?|reference|job ref|job no)[^\)\]]*[\)\]]", re.I
)


def _filter_uk_df(jobs: pd.DataFrame) -> pd.DataFrame:
    if jobs.empty or "location" not in jobs.columns:
        return jobs
    mask = jobs["location"].fillna("").astype(str).map(is_uk)
    return jobs.loc[mask].reset_index(drop=True)


def _norm_title(title: object) -> str:
    t = _REF_STRIP.sub("", str(title or ""))
    return re.sub(r"[^a-z0-9]", "", t.lower())


def _secondary_title_dedupe(df: pd.DataFrame) -> pd.DataFrame:
    """Collapse same-title, same-employer listings across different cities."""
    if df.empty:
        return df
    df = df.reset_index(drop=True).copy()
    seen: dict[tuple[str, str], int] = {}
    other_counts: dict[int, int] = {}
    drop_pos: list[int] = []
    for pos in range(len(df)):
        row = df.iloc[pos]
        k = (
            re.sub(r"[^a-z0-9]", "", str(row.get("company_key") or "").lower()),
            _norm_title(row.get("title")),
        )
        if k in seen:
            other_counts[seen[k]] = other_counts.get(seen[k], 0) + 1
            drop_pos.append(pos)
        else:
            seen[k] = pos

    df["other_locations"] = 0
    for kept, count in other_counts.items():
        df.at[kept, "other_locations"] = count

    if drop_pos:
        keep = [i for i in range(len(df)) if i not in set(drop_pos)]
        df = df.iloc[keep].reset_index(drop=True)
    return df


class JobFetchError(RuntimeError):
    """Raised when no jobs could be fetched and at least one source failed."""

    def __init__(self, message: str, *, config_error: bool = False):
        super().__init__(message)
        self.config_error = config_error


def fetch_all_jobs(
    role: str,
    max_per_source: int = 250,
    enrich_full_jd: bool = True,
) -> pd.DataFrame:
    """Fetch jobs from Reed + Adzuna; expand Reed to full JDs; clean Adzuna text."""
    frames: list[pd.DataFrame] = []
    errors: list[str] = []
    config_errors = 0

    try:
        reed = fetch_reed_jobs(role, max_jobs=max_per_source)
        print(f"Reed: {len(reed)} jobs")
        if not reed.empty:
            if enrich_full_jd:
                reed = enrich_reed_full_descriptions(reed)
            frames.append(reed)
    except Exception as exc:
        msg = f"Reed: {exc}"
        print(f"Reed skipped: {exc}")
        errors.append(msg)
        if "Missing REED_API_KEY" in str(exc):
            config_errors += 1

    try:
        adzuna = fetch_adzuna_jobs(role, max_jobs=max_per_source)
        print(f"Adzuna: {len(adzuna)} jobs")
        if not adzuna.empty:
            adzuna = enrich_adzuna_descriptions(adzuna)
            frames.append(adzuna)
    except Exception as exc:
        msg = f"Adzuna: {exc}"
        print(f"Adzuna skipped: {exc}")
        errors.append(msg)
        if "Missing ADZUNA" in str(exc):
            config_errors += 1

    if frames:
        combined = pd.concat(frames, ignore_index=True)
        return _filter_uk_df(combined)

    if errors:
        raise JobFetchError(
            "No jobs fetched. " + " | ".join(errors),
            config_error=config_errors > 0 and config_errors == len(errors),
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
    jobs = _filter_uk_df(jobs)
    jobs = _secondary_title_dedupe(jobs)

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
    role_arg = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "data analyst"
    run(role_arg)

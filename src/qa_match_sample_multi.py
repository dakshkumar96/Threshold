"""Multi-role sponsor-match QA sample — for HUMAN labeling, not auto-scoring.

`qa_match_sample.py`'s reported precision (59% n=100 / 68% n=50, see ACCURACY.md) comes
from a single role ("data analyst") and its own heuristic `label_match()` function acting
as "ground truth" — not human review. ACCURACY.md problem #7 flags both gaps: one role
doesn't generalise, and the labels were never actually verified by a person.

This script pulls a sample across several roles spanning the taxonomy in
`llm_prompt_builder.ROLE_KEYWORDS`, including one of the sectors ACCURACY.md already
flags as weak (hospitality/retail/healthcare/public sector — verified-ATS coverage is
weakest there). It writes ONE combined CSV with an empty `human_label` column for a
person to fill in (Y / N), and keeps the existing heuristic output as `suggested_label`
— a starting point, never a substitute for the real label.

Usage (from repo root):
  .\\.venv\\Scripts\\python.exe src\\qa_match_sample_multi.py
  .\\.venv\\Scripts\\python.exe src\\qa_match_sample_multi.py --roles "data analyst" "nurse"
  .\\.venv\\Scripts\\python.exe src\\qa_match_sample_multi.py --dry-run   # reuse cached parquet only

After labeling: fill `human_label` with Y/N for every row, then run
`src/qa_tier_calibration.py` to compute real per-tier precision.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from job_schema import role_slug  # noqa: E402
from match_sponsors import match_jobs_to_sponsors  # noqa: E402
from qa_match_sample import label_match  # noqa: E402
from run_jobs_pipeline import _filter_uk_df, _secondary_title_dedupe, fetch_all_jobs  # noqa: E402

OUT = ROOT / "data" / "processed" / "match_qa_sample_multi.csv"
PER_ROLE_SAMPLE = 25

# Spans llm_prompt_builder.ROLE_KEYWORDS categories: A (existing single-role baseline),
# B, D, G, and K — K is one of the sectors ACCURACY.md flags as weakest for verified
# ATS coverage (hospitality, retail, healthcare, public sector), so it's deliberately
# included rather than sticking to tech/office roles.
DEFAULT_ROLES = [
    "data analyst",          # A — existing baseline, for a before/after comparison
    "software engineer",     # B
    "marketing executive",   # D
    "operations coordinator",# G
    "retail store manager",  # K — flagged weak-coverage sector
]


def _matched_for_role(role: str, dry_run: bool) -> pd.DataFrame:
    slug = role_slug(role)
    matched_path = ROOT / "data" / "processed" / f"jobs_matched_{slug}.parquet"

    if dry_run and matched_path.exists():
        print(f"  [dry-run] loading cached parquet for {role!r}")
        return pd.read_parquet(matched_path)

    print(f"  fetching live jobs for {role!r}...")
    jobs = fetch_all_jobs(role)
    if jobs.empty:
        print(f"  no jobs found for {role!r} - skipping")
        return pd.DataFrame()
    jobs = jobs.drop_duplicates(subset=["source", "source_job_id"], keep="first")
    jobs = _filter_uk_df(jobs)
    jobs = _secondary_title_dedupe(jobs)
    matched = match_jobs_to_sponsors(jobs)
    matched.to_parquet(matched_path, index=False)
    return matched


def _sample_role(role: str, matched: pd.DataFrame, n: int) -> pd.DataFrame:
    pool = matched[matched["is_sponsor"] | matched.get("is_possible_sponsor", False)].copy()
    if pool.empty:
        return pool
    sample = pool.sample(n=min(n, len(pool)), random_state=42)

    rows = []
    for _, r in sample.iterrows():
        suggested, note = label_match(
            r.get("company_raw"),
            r.get("company_key"),
            r.get("matched_company_key"),
            float(r.get("match_score") or 0),
        )
        rows.append(
            {
                "role": role,
                "source": r.get("source"),
                "source_job_id": r.get("source_job_id"),
                "title": r.get("title"),
                "company_raw": r.get("company_raw"),
                "company_key": r.get("company_key"),
                "matched_company_key": r.get("matched_company_key"),
                "match_score": r.get("match_score"),
                "sponsor_confidence": r.get("sponsor_confidence"),
                "location": r.get("location"),
                "suggested_label": suggested,
                "suggested_note": note,
                "human_label": "",  # fill in Y / N by hand — do not trust suggested_label alone
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--roles", nargs="+", default=None, help="Roles to sample (default: 5-role spread)")
    parser.add_argument("--n", type=int, default=PER_ROLE_SAMPLE, help="Sample size per role")
    parser.add_argument("--dry-run", action="store_true", help="Reuse cached parquet only, no live fetch")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds between roles (rate-limit)")
    args = parser.parse_args()

    roles = args.roles if args.roles else DEFAULT_ROLES

    all_rows: list[pd.DataFrame] = []
    for i, role in enumerate(roles):
        print(f"\n[{i + 1}/{len(roles)}] {role}")
        try:
            matched = _matched_for_role(role, args.dry_run)
        except Exception as exc:
            print(f"  ERROR fetching {role!r}: {exc}")
            continue
        if matched.empty:
            continue
        sampled = _sample_role(role, matched, args.n)
        if sampled.empty:
            print(f"  no sponsor/possible rows for {role!r} - skipping")
            continue
        all_rows.append(sampled)
        print(f"  sampled {len(sampled)} rows")
        if not args.dry_run and i < len(roles) - 1:
            time.sleep(args.delay)

    if not all_rows:
        print("No rows sampled across any role.", file=sys.stderr)
        sys.exit(1)

    out = pd.concat(all_rows, ignore_index=True)
    out.to_csv(OUT, index=False)
    print(f"\nSaved {OUT} ({len(out)} rows across {len(all_rows)} roles)")
    print(out["role"].value_counts().to_string())
    print(
        "\nNext: open the CSV and fill `human_label` with Y/N for every row "
        "(`suggested_label` is a heuristic starting point, not ground truth). "
        "Then run src/qa_tier_calibration.py."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

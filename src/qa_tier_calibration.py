"""Compute real per-tier precision from a HUMAN-labeled QA sample.

ACCURACY.md problem #7: "likely" (score >= 90) and "possible" tiers are score cutoffs,
not verified precision numbers — nobody has checked whether "likely" sponsors are
actually right ~90% of the time. This reads `data/processed/match_qa_sample_multi.csv`
(from `src/qa_match_sample_multi.py`) once its `human_label` column has been filled in
(Y/N per row) and reports actual precision per `sponsor_confidence` tier, flagging any
tier whose real precision doesn't match what its name implies.

Usage (from repo root):
  .\\.venv\\Scripts\\python.exe src\\qa_tier_calibration.py
  .\\.venv\\Scripts\\python.exe src\\qa_tier_calibration.py --file data\\processed\\match_qa_sample_multi.csv

Only rows with a filled `human_label` (Y or N) count — unlabeled rows are reported
separately and excluded from precision, never treated as correct by default.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FILE = ROOT / "data" / "processed" / "match_qa_sample_multi.csv"

# What each tier's name implies to a user — for flagging, not a hard rule.
TIER_EXPECTATION = {
    "verified": 0.95,  # ATS-published identity; should be near-certain
    "likely": 0.90,    # name implies "likely correct"
    "possible": 0.50,  # name already signals low confidence; low bar
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    args = parser.parse_args()

    if not args.file.exists():
        print(f"Not found: {args.file}", file=sys.stderr)
        print("Run src/qa_match_sample_multi.py first.", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(args.file, dtype=str)
    if "human_label" not in df.columns or "sponsor_confidence" not in df.columns:
        print(
            f"{args.file} is missing human_label/sponsor_confidence columns — "
            "expected output from src/qa_match_sample_multi.py.",
            file=sys.stderr,
        )
        sys.exit(1)

    df["human_label"] = df["human_label"].fillna("").str.strip().str.upper()
    labeled = df[df["human_label"].isin(["Y", "N"])].copy()
    unlabeled_count = len(df) - len(labeled)

    print(f"Total rows: {len(df)}  Labeled: {len(labeled)}  Unlabeled: {unlabeled_count}")
    if unlabeled_count:
        print(
            f"WARNING: {unlabeled_count} rows still have no human_label — "
            "fill those in before trusting these numbers."
        )
    if labeled.empty:
        print("No labeled rows yet — nothing to calibrate.")
        return

    labeled["sponsor_confidence"] = labeled["sponsor_confidence"].fillna("unknown")
    print("\nPer-tier precision (human-labeled):")
    print(f"{'tier':<12}{'n':>6}{'precision':>12}  implies vs actual")
    for tier, group in labeled.groupby("sponsor_confidence"):
        n = len(group)
        precision = (group["human_label"] == "Y").mean()
        expected = TIER_EXPECTATION.get(tier)
        flag = ""
        if expected is not None and precision < expected - 0.05:
            flag = f"  <-- below what '{tier}' implies (~{expected:.0%})"
        print(f"{tier:<12}{n:>6}{precision:>11.1%} {flag}")

    overall = (labeled["human_label"] == "Y").mean()
    print(f"\nOverall precision (labeled rows): {overall:.1%} ({(labeled['human_label']=='Y').sum()}/{len(labeled)})")

    if "role" in labeled.columns:
        print("\nPer-role precision:")
        for role, group in labeled.groupby("role"):
            precision = (group["human_label"] == "Y").mean()
            print(f"  {role:<28}{precision:>7.1%}  (n={len(group)})")


if __name__ == "__main__":
    main()

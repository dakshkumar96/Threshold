"""Sample sponsor matches and label precision by name review (default n=100)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pandas as pd
from rapidfuzz import fuzz

ROOT = Path(__file__).resolve().parent.parent
MATCHED = ROOT / "data" / "processed" / "jobs_matched_data_analyst.parquet"
OUT = ROOT / "data" / "processed" / "match_qa_sample.csv"


def norm(s: object) -> str:
    return re.sub(r"\s+", " ", str(s or "").lower()).strip()


def label_match(company_raw: str, company_key: str, matched_key: str, score: float) -> tuple[str, str]:
    """
    Y = same employer (allow legal suffix / minor wording noise)
    N = different firm, recruiter mismatch, or weak token collision
    """
    raw = norm(company_raw)
    key = norm(company_key)
    matched = norm(matched_key)

    if not key or not matched:
        return "N", "empty key"

    # Exact or near-exact cleaned names
    if key == matched:
        return "Y", "exact company_key"
    if key in matched or matched in key:
        # Avoid tiny substring traps (e.g. "qa" inside a long name)
        shorter = key if len(key) <= len(matched) else matched
        if len(shorter) >= 6:
            return "Y", "substring containment"
        return "N", "short substring collision"

    ratio = fuzz.token_set_ratio(key, matched)
    partial = fuzz.partial_ratio(key, matched)

    # High score but clearly different core tokens → reject common false friends
    key_tokens = set(key.split())
    matched_tokens = set(matched.split())
    overlap = key_tokens & matched_tokens
    # Drop ultra-generic tokens
    generic = {"group", "uk", "digital", "technology", "services", "solutions", "global", "international", "ltd", "limited", "home", "improvements", "care", "company", "the", "and"}
    meaningful = overlap - generic

    if score >= 95 and (meaningful or ratio >= 95):
        return "Y", f"high score with overlap {sorted(meaningful) or 'near-exact'}"
    if meaningful and ratio >= 90 and len(max(meaningful, key=len)) >= 5:
        return "Y", f"shared distinctive token {sorted(meaningful)}"
    if ratio >= 92 and partial >= 90 and len(key) >= 8:
        return "Y", f"fuzzy strong ratio={ratio}"

    return "N", f"weak/ambiguous overlap ratio={ratio} tokens={sorted(overlap)}"


def main() -> None:
    df = pd.read_parquet(MATCHED)
    sponsors = df[df["is_sponsor"]].copy()
    sample = sponsors.sample(n=min(100, len(sponsors)), random_state=42)

    rows = []
    for _, r in sample.iterrows():
        correct, note = label_match(
            r["company_raw"],
            r["company_key"],
            r["matched_company_key"],
            float(r["match_score"] or 0),
        )
        rows.append(
            {
                "source": r["source"],
                "source_job_id": r["source_job_id"],
                "title": r["title"],
                "company_raw": r["company_raw"],
                "company_key": r["company_key"],
                "matched_company_key": r["matched_company_key"],
                "match_score": r["match_score"],
                "correct": correct,
                "note": note,
            }
        )

    out = pd.DataFrame(rows)
    out.to_csv(OUT, index=False)
    precision = (out["correct"] == "Y").mean()
    print(f"Saved {OUT} ({len(out)} rows)")
    print(f"Precision: {precision:.1%} ({(out['correct']=='Y').sum()}/{len(out)})")
    print(out["correct"].value_counts().to_string())


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

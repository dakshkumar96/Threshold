"""Sample Reed full-text JDs for hand-label skill recall QA.

Usage:
  python src/qa_skill_recall.py
  python src/qa_skill_recall.py --n 30

Output CSV columns for manual labelling:
  source_job_id, title, desc_len, description, skills_present (fill in)
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from fetch_reed import enrich_reed_full_descriptions

JOBS_PATH = ROOT / "data" / "processed" / "jobs_matched_data_analyst.parquet"
OUT_PATH = ROOT / "data" / "processed" / "skill_recall_sample.csv"


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Sample Reed JDs for hand-label recall QA")
    parser.add_argument("--n", type=int, default=30, help="Sample size (default 30)")
    args = parser.parse_args()

    if not JOBS_PATH.exists():
        raise SystemExit(f"Missing {JOBS_PATH} — run jobs pipeline first")

    df = pd.read_parquet(JOBS_PATH)
    df = enrich_reed_full_descriptions(df)

    reed = df[df["source"].astype(str).str.lower() == "reed"].copy()
    full = reed[reed["description_full"].fillna(False)]
    pool = full if len(full) >= args.n else reed

    sample = pool.sample(n=min(args.n, len(pool)), random_state=7).copy()

    rows = []
    for _, job in sample.iterrows():
        desc = clean(str(job.get("description") or ""))
        rows.append(
            {
                "source_job_id": job.get("source_job_id"),
                "title": job.get("title"),
                "desc_len": len(desc),
                "description_full": bool(job.get("description_full")),
                "description": desc[:8000],
                "skills_present": "",
            }
        )

    out = pd.DataFrame(rows)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(out)} rows to {OUT_PATH}")
    print("Hand-label skills_present with comma-separated canonical skills (e.g. SQL, Python, Excel).")


if __name__ == "__main__":
    main()

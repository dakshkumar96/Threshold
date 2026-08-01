"""QA for dynamic skill extraction against job description text.

Measures:
1. Precision of positive hits (alias must appear in that JD)
2. Recall against a ground-truth pattern set (skills clearly written in the JD)
3. Coverage: share of jobs with ≥1 skill detected

Usage:
  python src/qa_dynamic_skills.py
  python src/qa_dynamic_skills.py --enrich   # re-fetch Reed full JDs for sample
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from dynamic_skills import SKILL_ALIASES, extract_skills_from_text
from fetch_reed import enrich_reed_full_descriptions

JOBS_PATH = ROOT / "data" / "processed" / "jobs_matched_data_analyst.parquet"
OUT_PATH = ROOT / "data" / "processed" / "skill_qa_sample.csv"

# Ground-truth: if this pattern appears in the JD, we expect the canonical skill
GROUND_TRUTH: list[tuple[str, str]] = [
    (r"\bpower\s*bi\b|\bpowerbi\b", "Power BI"),
    (r"\bsql\b", "SQL"),
    (r"\bpython\b", "Python"),
    (r"\bexcel\b", "Excel"),
    (r"\btableau\b", "Tableau"),
    (r"\bsnowflake\b", "Snowflake"),
    (r"\bazure\b", "Azure"),
    (r"\baws\b", "AWS"),
    (r"\betl\b", "ETL"),
    (r"\blooker\b", "Looker"),
    (r"\bdocker\b", "Docker"),
    (r"\bkubernetes\b|\bk8s\b", "Kubernetes"),
    (r"\bjava\b(?!script)", "Java"),
    (r"\bjavascript\b|\bjs\b", "JavaScript"),
    (r"\breact\b", "React"),
]


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--enrich", action="store_true", help="Upgrade Reed snippets to full JDs")
    parser.add_argument("--n", type=int, default=100, help="Sample size")
    args = parser.parse_args()

    if not JOBS_PATH.exists():
        raise SystemExit(f"Missing {JOBS_PATH} — run jobs pipeline first")

    df = pd.read_parquet(JOBS_PATH)
    if args.enrich:
        df = enrich_reed_full_descriptions(df)

    sample = df.sample(n=min(args.n, len(df)), random_state=42).copy()

    rows = []
    tp = fp = 0
    gt_found = gt_recalled = 0
    jobs_with_skill = 0

    for _, job in sample.iterrows():
        text = clean(f"{job.get('title') or ''} {job.get('description') or ''}")
        low = text.lower()
        predicted = extract_skills_from_text(text)
        if predicted:
            jobs_with_skill += 1

        for skill in predicted:
            aliases = [a for a, c in SKILL_ALIASES.items() if c == skill]
            ok = any(
                re.search(r"(?<![a-z0-9])" + re.escape(a) + r"(?![a-z0-9])", low)
                for a in aliases
            )
            if ok:
                tp += 1
                label = "Y"
            else:
                fp += 1
                label = "N"
            rows.append(
                {
                    "source": job.get("source"),
                    "source_job_id": job.get("source_job_id"),
                    "title": job.get("title"),
                    "desc_len": len(text),
                    "description_full": bool(job.get("description_full")),
                    "check": "precision",
                    "skill": skill,
                    "correct": label,
                }
            )

        for pattern, skill in GROUND_TRUTH:
            if re.search(pattern, low, flags=re.I):
                gt_found += 1
                hit = skill in predicted
                if hit:
                    gt_recalled += 1
                rows.append(
                    {
                        "source": job.get("source"),
                        "source_job_id": job.get("source_job_id"),
                        "title": job.get("title"),
                        "desc_len": len(text),
                        "description_full": bool(job.get("description_full")),
                        "check": "recall",
                        "skill": skill,
                        "correct": "Y" if hit else "N",
                    }
                )

    out = pd.DataFrame(rows)
    out.to_csv(OUT_PATH, index=False)

    precision = tp / max(1, tp + fp)
    recall = gt_recalled / max(1, gt_found)
    coverage = jobs_with_skill / max(1, len(sample))
    full_n = (
        int(sample["description_full"].fillna(False).sum())
        if "description_full" in sample.columns
        else 0
    )

    print(f"Saved {OUT_PATH} ({len(out)} labeled rows from {len(sample)} jobs)")
    print(f"Full Reed JDs in sample: {full_n}/{len(sample)}")
    print(f"Jobs with >=1 skill: {jobs_with_skill}/{len(sample)} ({100*coverage:.1f}%)")
    print(f"Positive precision (alias present): {100*precision:.1f}% ({tp}/{tp+fp})")
    print(f"Recall vs ground-truth patterns: {100*recall:.1f}% ({gt_recalled}/{gt_found})")
    print(
        "Note: Adzuna remains truncated (~500 chars); Reed full JD when --enrich or live API path."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

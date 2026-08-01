"""Label req QA by reviewing title+description snippets (independent of 'correctness' circularity for False).

For tool/degree/years:
- If predicted positive: Y if the snippet clearly supports it, else N
- If predicted negative: Y if snippet has no clear mention; N if mention is clearly present; N/A if text too truncated to trust absence
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
from extract_requirements import TOOL_PATTERNS, extract_degree, extract_years

QA_PATH = ROOT / "data" / "processed" / "req_qa_sample.csv"
JOBS_PATH = ROOT / "data" / "processed" / "jobs_matched_data_analyst.parquet"


def clean(title: object, description: object) -> str:
    text = f"{title or ''} {description or ''}"
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def label_row(field: str, predicted: object, text: str) -> str:
    pred = "" if predicted is None or (isinstance(predicted, float) and pd.isna(predicted)) else str(predicted)
    truncated = text.endswith("…") or text.endswith("...") or len(text) >= 480

    if field in TOOL_PATTERNS:
        mentioned = bool(re.search(TOOL_PATTERNS[field], text, flags=re.I))
        pred_true = pred.lower() == "true"
        if pred_true:
            return "Y" if mentioned else "N"
        # predicted False
        if mentioned:
            return "N"
        return "N/A" if truncated else "Y"

    if field == "degree":
        # Independent read: any explicit degree wording
        has_degree = bool(
            re.search(
                r"bachelor|master|phd|doctorate|degree|undergraduate|postgraduate|msc|bsc|\bmba\b",
                text,
                flags=re.I,
            )
        )
        pred_none = pred.lower() in {"none", ""}
        if pred_none:
            if has_degree:
                return "N"
            return "N/A" if truncated else "Y"
        # predicted a degree level — check consistency with extract_degree as soft check + wording
        level = extract_degree(text.lower())
        return "Y" if level == pred.lower() else "N"

    if field == "years_experience":
        years = extract_years(text.lower())
        pred_empty = pred in {"", "nan", "None"}
        if pred_empty:
            if years is not None:
                return "N"
            return "N/A" if truncated else "Y"
        try:
            return "Y" if years is not None and float(pred) == float(years) else "N"
        except ValueError:
            return "N"

    return "N/A"


def main() -> None:
    qa = pd.read_csv(QA_PATH)
    jobs = pd.read_parquet(JOBS_PATH)
    jobs["source_job_id"] = jobs["source_job_id"].astype(str)
    qa["source_job_id"] = qa["source_job_id"].astype(str)
    merged = qa.merge(
        jobs[["source", "source_job_id", "description"]],
        on=["source", "source_job_id"],
        how="left",
    )

    corrects = []
    for _, row in merged.iterrows():
        text = clean(row["title"], row["description"])
        corrects.append(label_row(str(row["field"]), row["predicted"], text))
    merged["correct"] = corrects

    out = merged[["source", "source_job_id", "title", "field", "predicted", "correct"]]
    out.to_csv(QA_PATH, index=False)

    labeled = out[out["correct"].isin(["Y", "N"])]
    print(f"Rows: {len(out)} | scored: {len(labeled)} | N/A: {(out['correct']=='N/A').sum()}")
    if len(labeled):
        print(f"Overall precision: {(labeled['correct']=='Y').mean():.1%}")
        print(
            labeled.groupby("field")
            .apply(lambda g: pd.Series({
                "n": len(g),
                "precision": (g["correct"] == "Y").mean(),
            }), include_groups=False)
            .to_string()
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

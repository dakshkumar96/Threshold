"""Extract job requirements and score a CV profile against requirement frequencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

TOOL_PATTERNS = {
    "sql": r"\bsql\b",
    "python": r"\bpython\b",
    "excel": r"\bexcel\b|\bmicrosoft excel\b|\bspreadsheets?\b",
    "tableau": r"\btableau\b",
    "power_bi": r"\bpower\s*bi\b|\bpowerbi\b",
    "r": r"(?<![a-z])r(?![a-z])|\br studio\b|\brstudio\b",
    "spark": r"\bspark\b|\bpyspark\b",
    "aws": r"\baws\b|\bamazon web services\b",
    "azure": r"\bazure\b",
}


def _text(row: pd.Series) -> str:
    parts = [str(row.get("title") or ""), str(row.get("description") or "")]
    text = " ".join(parts)
    text = re.sub(r"<[^>]+>", " ", text)  # strip HTML from API snippets
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).lower()


def extract_degree(text: str) -> str:
    if re.search(r"\bph\.?d\b|\bdoctorate\b", text):
        return "phd"
    if re.search(r"\bmaster'?s\b|\bmsc\b|\bmba\b|\bpostgraduate\b", text):
        return "masters"
    if re.search(
        r"\bbachelor'?s\b|\bundergraduate\b|\bdegree\b|\bbsc\b|\bba\b",
        text,
    ):
        return "bachelors"
    return "none"


def extract_years(text: str) -> float | None:
    patterns = [
        r"(\d+)\+?\s*(?:\+|plus)?\s*years?(?:\s+of)?\s+experience",
        r"at least\s+(\d+)\s*years?",
        r"minimum(?:\s+of)?\s+(\d+)\s*years?",
        r"(\d+)\s*-\s*\d+\s*years?",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return float(m.group(1))
    return None


def extract_flags(text: str) -> dict:
    return {
        "graduate_welcome": bool(
            re.search(r"graduate\s+(welcome|scheme|programme|program)|recent graduate", text)
        ),
        "or_equivalent": bool(re.search(r"or equivalent|equivalent experience", text)),
        "mentions_essential": bool(re.search(r"\bessential\b", text)),
        "mentions_desirable": bool(re.search(r"\bdesirable\b|\bnice to have\b", text)),
    }


def extract_row(row: pd.Series) -> dict:
    text = _text(row)
    out = {
        "source": row.get("source"),
        "source_job_id": row.get("source_job_id"),
        "role_query": row.get("role_query"),
        "title": row.get("title"),
        "company_raw": row.get("company_raw"),
        "is_sponsor": bool(row.get("is_sponsor")),
        "degree": extract_degree(text),
        "years_experience": extract_years(text),
    }
    for tool, pat in TOOL_PATTERNS.items():
        out[f"req_{tool}"] = bool(re.search(pat, text, flags=re.IGNORECASE))
    out.update(extract_flags(text))
    return out


def extract_requirements(jobs: pd.DataFrame) -> pd.DataFrame:
    if jobs.empty:
        return pd.DataFrame()
    return pd.DataFrame([extract_row(row) for _, row in jobs.iterrows()])


def requirement_frequencies(
    reqs: pd.DataFrame,
    sponsors_only: bool = False,
) -> pd.DataFrame:
    df = reqs
    if sponsors_only and "is_sponsor" in reqs.columns:
        df = reqs[reqs["is_sponsor"]].copy()
    n = len(df)
    if n == 0:
        return pd.DataFrame(columns=["criterion", "count", "share", "n_jobs"])

    rows = []
    tool_cols = [c for c in df.columns if c.startswith("req_")]
    for col in tool_cols:
        count = int(df[col].sum())
        rows.append(
            {
                "criterion": col.replace("req_", ""),
                "count": count,
                "share": count / n,
                "n_jobs": n,
            }
        )

    # Degree mentioned (any of bachelors+)
    degree_any = int((df["degree"] != "none").sum())
    rows.append(
        {
            "criterion": "degree_any",
            "count": degree_any,
            "share": degree_any / n,
            "n_jobs": n,
        }
    )
    years_any = int(df["years_experience"].notna().sum())
    rows.append(
        {
            "criterion": "years_experience_mentioned",
            "count": years_any,
            "share": years_any / n,
            "n_jobs": n,
        }
    )
    out = pd.DataFrame(rows).sort_values("share", ascending=False).reset_index(drop=True)
    return out


def score_cv(profile: dict, frequencies: pd.DataFrame) -> dict:
    """
    Weighted match score: sum(weight for met criteria) / sum(weights).
    Weights = requirement frequency shares.
    """
    freq = frequencies.set_index("criterion")["share"].to_dict()
    tools = {t.lower() for t in profile.get("tools", [])}
    years = profile.get("years_experience")
    degree = str(profile.get("degree", "none")).lower()

    matched = []
    gaps = []
    weighted_hit = 0.0
    weighted_total = 0.0

    for criterion, weight in freq.items():
        if weight <= 0:
            continue
        weighted_total += weight
        met = False
        if criterion == "degree_any":
            met = degree in {"bachelors", "masters", "phd"}
        elif criterion == "years_experience_mentioned":
            # If jobs mention years, CV meets if it has any years value
            met = years is not None
        else:
            met = criterion in tools or criterion.replace("_", " ") in tools

        if met:
            matched.append(criterion)
            weighted_hit += weight
        else:
            gaps.append({"criterion": criterion, "frequency": weight})

    gaps_sorted = sorted(gaps, key=lambda g: g["frequency"], reverse=True)
    score = (weighted_hit / weighted_total) if weighted_total else 0.0
    return {
        "score": round(100 * score, 1),
        "matched_criteria": matched,
        "gaps": gaps_sorted,
    }


def run_for_role(role_slug: str = "data_analyst") -> None:
    jobs_path = ROOT / "data" / "processed" / f"jobs_matched_{role_slug}.parquet"
    if not jobs_path.exists():
        raise FileNotFoundError(f"Missing {jobs_path}. Run jobs pipeline first.")

    jobs = pd.read_parquet(jobs_path)
    reqs = extract_requirements(jobs)
    freq_all = requirement_frequencies(reqs, sponsors_only=False)
    freq_sp = requirement_frequencies(reqs, sponsors_only=True)

    out_dir = ROOT / "data" / "processed"
    req_path = out_dir / f"job_requirements_{role_slug}.parquet"
    freq_path = out_dir / f"requirement_frequencies_{role_slug}.parquet"
    reqs.to_parquet(req_path, index=False)
    freq_sp.to_parquet(freq_path, index=False)

    profile_path = out_dir / "sample_cv_profile.json"
    if not profile_path.exists():
        profile = {
            "degree": "masters",
            "years_experience": 1,
            "tools": ["python", "sql", "excel"],
        }
        profile_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    else:
        profile = json.loads(profile_path.read_text(encoding="utf-8"))

    result = score_cv(profile, freq_sp if len(freq_sp) else freq_all)
    print(f"Jobs: {len(jobs)} | Requirements rows: {len(reqs)}")
    print("Top requirements (sponsor jobs):")
    print(freq_sp.head(10).to_string(index=False))
    print("CV score:", result["score"])
    print("Gaps:", [g["criterion"] for g in result["gaps"][:8]])
    print("Saved:", req_path.name, freq_path.name)


if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "data_analyst"
    try:
        run_for_role(slug)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

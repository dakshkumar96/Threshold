"""
Build static role benchmark JSON files consumed by the Next.js benchmarks pages.

For each role in BENCHMARK_ROLES, fetches live jobs, matches sponsors, computes
skill frequencies, and writes to frontend/data/benchmarks/<slug>.json.
Also writes frontend/data/benchmarks/index.json for the index page.

Usage:
    python scripts/build_role_benchmarks.py [--roles "data analyst" "software engineer"]
    python scripts/build_role_benchmarks.py --list-roles

The script runs offline-safe against cached data only when --dry-run is passed
(reads last matched parquet if it exists rather than hitting live APIs).

Set up as a GitHub Actions weekly cron (see .github/workflows/benchmarks.yml).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from statistics import median, quantiles

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

OUT_DIR = ROOT / "frontend" / "data" / "benchmarks"

BENCHMARK_ROLES = [
    "data analyst",
    "software engineer",
    "product manager",
    "data scientist",
    "machine learning engineer",
    "devops engineer",
    "backend engineer",
    "frontend engineer",
    "full stack engineer",
    "ux designer",
    "business analyst",
    "project manager",
    "finance analyst",
    "marketing manager",
    "hr manager",
]

MAX_PER_SOURCE = 100


def _slug(role: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", role.lower()).strip("-")


def _median_salary(df) -> float | None:
    import pandas as pd
    vals = []
    for _, row in df.iterrows():
        smin = row.get("salary_min")
        smax = row.get("salary_max")
        if smin is not None and not pd.isna(smin):
            vals.append(float(smin))
        elif smax is not None and not pd.isna(smax):
            vals.append(float(smax))
    if not vals:
        return None
    return median(vals)


def _quartiles(df) -> tuple[float | None, float | None]:
    import pandas as pd
    vals = []
    for _, row in df.iterrows():
        smin = row.get("salary_min")
        smax = row.get("salary_max")
        if smin is not None and not pd.isna(smin):
            vals.append(float(smin))
        elif smax is not None and not pd.isna(smax):
            vals.append(float(smax))
    if len(vals) < 4:
        return None, None
    qs = quantiles(vals, n=4)
    return qs[0], qs[2]


def build_benchmark(role: str, dry_run: bool = False) -> dict:
    import pandas as pd

    from dynamic_skills import skill_frequencies
    from job_schema import role_slug
    from match_sponsors import match_jobs_to_sponsors

    slug = role_slug(role)
    matched_path = ROOT / "data" / "processed" / f"jobs_matched_{slug}.parquet"

    if dry_run and matched_path.exists():
        print(f"  [dry-run] loading cached parquet for {role!r}")
        matched = pd.read_parquet(matched_path)
    else:
        from run_jobs_pipeline import fetch_all_jobs, _filter_uk_df, _secondary_title_dedupe  # type: ignore[attr-defined]
        print(f"  fetching live jobs for {role!r}…")
        jobs = fetch_all_jobs(role, max_per_source=MAX_PER_SOURCE)
        if jobs.empty:
            print(f"  no jobs found for {role!r} — skipping")
            return {}
        jobs = jobs.drop_duplicates(subset=["source", "source_job_id"], keep="first")
        jobs = _filter_uk_df(jobs)
        jobs = _secondary_title_dedupe(jobs)
        matched = match_jobs_to_sponsors(jobs)

    if matched.empty:
        print(f"  empty after matching for {role!r} — skipping")
        return {}

    sponsor_mask = matched["is_sponsor"] | matched["is_possible_sponsor"]
    sponsor_rows = matched[sponsor_mask]

    freq = skill_frequencies(matched, sponsors_only=False, top_n=15)
    top_skills = []
    if not freq.empty:
        for r in freq.itertuples():
            top_skills.append(
                {
                    "skill": r.skill,
                    "share_pct": round(100 * float(r.share), 1),
                    "essential_share_pct": round(100 * float(r.essential_share), 1),
                }
            )

    conf_counts: dict[str, int] = {}
    if "sponsor_confidence" in matched.columns:
        for v in matched["sponsor_confidence"].dropna():
            conf_counts[str(v)] = conf_counts.get(str(v), 0) + 1

    median_sal = _median_salary(matched)
    q1, q3 = _quartiles(matched)

    band_dist: dict[str, int] = {}
    if "still_active" in matched.columns:
        from api.main import ESTABLISHED_DAYS, MODERATE_DAYS  # type: ignore[import-untyped]
        for _, row in matched.iterrows():
            fs = row.get("first_seen")
            ls = row.get("last_seen")
            if fs is None or ls is None:
                continue
            try:
                days = (pd.Timestamp(ls) - pd.Timestamp(fs)).days
            except Exception:
                continue
            if days >= ESTABLISHED_DAYS:
                band_dist["Established"] = band_dist.get("Established", 0) + 1
            elif days >= MODERATE_DAYS:
                band_dist["Moderate"] = band_dist.get("Moderate", 0) + 1
            else:
                band_dist["Newly registered"] = band_dist.get("Newly registered", 0) + 1

    return {
        "role": role,
        "slug": _slug(role),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "total_ads_scanned": int(len(matched)),
        "sponsor_match_count": int(len(sponsor_rows)),
        "verified_count": int(conf_counts.get("verified", 0)),
        "likely_count": int(conf_counts.get("likely", 0)),
        "possible_count": int(conf_counts.get("possible", 0)),
        "median_salary": round(median_sal) if median_sal is not None else None,
        "salary_q1": round(q1) if q1 is not None else None,
        "salary_q3": round(q3) if q3 is not None else None,
        "top_skills": top_skills,
        "tenure_band_distribution": band_dist,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static role benchmark JSON")
    parser.add_argument("--roles", nargs="+", default=None, help="Roles to build (default: all)")
    parser.add_argument("--dry-run", action="store_true", help="Use cached parquet; no live fetch")
    parser.add_argument("--list-roles", action="store_true", help="Print role list and exit")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds between roles (rate-limit)")
    args = parser.parse_args()

    if args.list_roles:
        for r in BENCHMARK_ROLES:
            print(f"  {_slug(r)}: {r}")
        return

    roles = args.roles if args.roles else BENCHMARK_ROLES
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index: list[dict] = []
    for i, role in enumerate(roles):
        print(f"\n[{i + 1}/{len(roles)}] {role}")
        try:
            data = build_benchmark(role, dry_run=args.dry_run)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            data = {}

        if not data:
            continue

        slug = _slug(role)
        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"  → {out_path.name}  ({data.get('total_ads_scanned')} ads, {data.get('sponsor_match_count')} sponsors)")

        index.append(
            {
                "role": role,
                "slug": slug,
                "generated_at": data["generated_at"],
                "sponsor_match_count": data["sponsor_match_count"],
                "median_salary": data["median_salary"],
                "top_skill": data["top_skills"][0]["skill"] if data.get("top_skills") else None,
            }
        )

        if i < len(roles) - 1:
            time.sleep(args.delay)

    index_path = OUT_DIR / "index.json"
    index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"\nIndex written → {index_path}  ({len(index)} roles)")


if __name__ == "__main__":
    main()

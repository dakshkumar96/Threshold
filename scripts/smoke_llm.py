"""Minimal Groq/OpenAI-compat smoke test for CV feedback.

Usage (from repo root):
  .\\.venv\\Scripts\\python.exe scripts\\smoke_llm.py

Does not print secrets. Exits 0 on success.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from cv_feedback import generate_cv_feedback  # noqa: E402
from job_schema import load_env  # noqa: E402


def main() -> int:
    load_env()
    # Realistic-length CV (not the tiny stub that used to hide 413s).
    cv = (
        "Jane Doe\nData Analyst, London\n"
        "jane@example.com | linkedin.com/in/janedoe | github.com/janedoe\n\n"
        "SUMMARY\nData analyst with 4 years in product analytics, SQL, Python, "
        "and dashboarding for growth and marketing stakeholders.\n\n"
        "EXPERIENCE\nSenior Data Analyst — Acme Analytics, London (2022–Present)\n"
        "- Built Power BI funnel dashboards used weekly by 12 stakeholders\n"
        "- Wrote 40+ dbt/SQL models; cut report latency from 2h to 8 minutes\n"
        "- Designed A/B analysis that lifted retention 3.2 percentage points\n"
        "- Mentored two junior analysts on reproducible analysis\n\n"
        "Data Analyst — Beta Retail, Manchester (2020–2022)\n"
        "- Automated weekly KPI packs in Python/pandas replacing Excel\n"
        "- Analysed churn cohorts for CRM campaigns\n"
        "- Responsible for assisting with data quality across five sources\n\n"
        "EDUCATION\nBSc Economics 2:1, University of Manchester\n\n"
        "SKILLS\nSQL, Python, Power BI, Excel, Tableau, dbt, Snowflake, A/B testing\n"
    )
    cv = (cv + "\n" + ("Additional project: demand forecasting notes. " * 60))[:5200]
    jobs_rows = []
    for i in range(12):
        jobs_rows.append(
            {
                "title": f"Data Analyst {i}",
                "company_raw": f"Co {i}",
                "location": "London" if i % 2 == 0 else "Remote",
                "source": "reed" if i % 2 == 0 else "adzuna",
                "description": (
                    "SQL Power BI Python reporting stakeholders A/B testing dbt. "
                    * 50
                ),
                "description_full": i % 2 == 0,
                "is_sponsor": i % 3 == 0,
            }
        )
    jobs = pd.DataFrame(jobs_rows)
    match = {"score": 60, "matched_count": 3, "top_n": 10, "label": "partial"}
    freq = [{"skill": "SQL", "share_pct": 80}, {"skill": "Power BI", "share_pct": 50}]

    t0 = time.time()
    out = generate_cv_feedback("Data Analyst", cv, freq, match, jobs=jobs)
    elapsed = round(time.time() - t0, 2)

    if out is None:
        print("FAIL: LLM_API_KEY missing")
        return 1
    if out.get("error"):
        print(f"FAIL ({elapsed}s): {out['error']}")
        return 1

    print(
        f"OK ({elapsed}s) model={out.get('model')} "
        f"score={out.get('score_out_of_100')} "
        f"ads={out.get('jobs_in_skill_analysis')} "
        f"excerpts={out.get('jd_excerpts_used')} "
        f"prompt_chars={out.get('prompt_chars')} "
        f"report_chars={len(out.get('full_report') or '')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

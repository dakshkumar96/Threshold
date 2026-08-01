"""Role-agnostic skill frequencies from job description text."""

from __future__ import annotations

import re
from collections import Counter

import pandas as pd

# Map messy variants → canonical skill labels
SKILL_ALIASES: dict[str, str] = {
    "powerbi": "Power BI",
    "power bi": "Power BI",
    "ms excel": "Excel",
    "microsoft excel": "Excel",
    "excel": "Excel",
    "sql": "SQL",
    "python": "Python",
    "tableau": "Tableau",
    "r studio": "R",
    "rstudio": "R",
    "javascript": "JavaScript",
    "java script": "JavaScript",
    "typescript": "TypeScript",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "react.js": "React",
    "reactjs": "React",
    "react": "React",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "power point": "PowerPoint",
    "powerpoint": "PowerPoint",
    "ms office": "Microsoft Office",
    "microsoft office": "Microsoft Office",
    "c#": "C#",
    "c++": "C++",
    "java": "Java",
    "scala": "Scala",
    "kotlin": "Kotlin",
    "swift": "Swift",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "spark": "Spark",
    "pyspark": "PySpark",
    "hadoop": "Hadoop",
    "snowflake": "Snowflake",
    "databricks": "Databricks",
    "looker": "Looker",
    "qlik": "Qlik",
    "sas": "SAS",
    "spss": "SPSS",
    "jira": "Jira",
    "confluence": "Confluence",
    "salesforce": "Salesforce",
    "sap": "SAP",
    "matlab": "MATLAB",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "NumPy",
    "git": "Git",
    "linux": "Linux",
    "agile": "Agile",
    "scrum": "Scrum",
    "devops": "DevOps",
    "ci/cd": "CI/CD",
    "rest api": "REST API",
    "graphql": "GraphQL",
    "html": "HTML",
    "css": "CSS",
    "figma": "Figma",
    "photoshop": "Photoshop",
    "communication": "Communication",
    "stakeholder management": "Stakeholder Management",
    "project management": "Project Management",
    "data visualisation": "Data Visualisation",
    "data visualization": "Data Visualisation",
    "etl": "ETL",
    "data modelling": "Data Modelling",
    "data modeling": "Data Modelling",
    "dax": "DAX",
    "power query": "Power Query",
    "bigquery": "BigQuery",
    "big query": "BigQuery",
    "airflow": "Airflow",
    "dbt": "dbt",
    "kafka": "Kafka",
    "redshift": "Redshift",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "oracle": "Oracle",
    "ssis": "SSIS",
    "ssrs": "SSRS",
    "alteryx": "Alteryx",
    "cognos": "Cognos",
    "statistics": "Statistics",
    "statistical": "Statistics",
    "a/b testing": "A/B Testing",
    "ab testing": "A/B Testing",
    "nlp": "NLP",
    "r programming": "R",
}

STOP = {
    "experience",
    "experience.",
    "skills",
    "skill",
    "ability",
    "knowledge",
    "working",
    "work",
    "using",
    "including",
    "strong",
    "good",
    "team",
    "role",
    "job",
    "company",
    "please",
    "required",
    "essential",
    "desirable",
    "years",
    "year",
    "within",
    "across",
    "based",
    "will",
    "must",
    "have",
    "with",
    "from",
    "that",
    "this",
    "your",
    "our",
    "the",
    "and",
    "for",
    "are",
    "you",
}


def _clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _essential_flag(text: str, skill: str) -> str:
    """Return essential / desirable / unclear from nearby wording."""
    low = text.lower()
    key = skill.lower()
    idx = low.find(key)
    if idx < 0:
        return "unclear"
    window = low[max(0, idx - 40) : idx + len(key) + 40]
    if re.search(r"\b(essential|required|must have|mandatory)\b", window):
        return "essential"
    if re.search(r"\b(desirable|nice to have|preferred|bonus)\b", window):
        return "desirable"
    return "unclear"


def extract_skills_from_text(text: str) -> list[str]:
    """Find known skill aliases in text; return canonical names."""
    low = _clean_text(text).lower()
    found: set[str] = set()
    # Longer aliases first so "power bi" wins over fragments
    for alias in sorted(SKILL_ALIASES.keys(), key=len, reverse=True):
        pattern = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
        if re.search(pattern, low):
            found.add(SKILL_ALIASES[alias])
    return sorted(found)


def _job_description_text(row) -> str:
    """Prefer Reed full-text JDs; fall back to whatever description we have."""
    title = row.get("title") or ""
    desc = row.get("description") or ""
    return f"{title} {desc}"


def skill_frequencies(
    jobs: pd.DataFrame,
    sponsors_only: bool = True,
    top_n: int = 25,
) -> pd.DataFrame:
    """
    Count skill presence across job descriptions for this role's postings.
    Not a fixed analyst-only checklist — only skills that appear in these ads.

    Prefers Reed full-text descriptions when available; Adzuna snippets are
    included but contribute less reliable signal.
    """
    df = jobs
    if sponsors_only and "is_sponsor" in jobs.columns:
        df = jobs[jobs["is_sponsor"]].copy()
        if df.empty:
            df = jobs

    if "description_full" in df.columns:
        full = df[df["description_full"].fillna(False)].copy()
        if len(full) >= 5:
            df = full

    n = len(df)
    if n == 0:
        return pd.DataFrame(
            columns=["skill", "count", "share", "n_jobs", "essential_share"]
        )

    counter: Counter[str] = Counter()
    essential_hits: Counter[str] = Counter()
    for _, row in df.iterrows():
        text = _job_description_text(row)
        skills = extract_skills_from_text(text)
        for s in skills:
            counter[s] += 1
            if _essential_flag(text, s) == "essential":
                essential_hits[s] += 1

    rows = []
    for skill, count in counter.most_common(top_n):
        rows.append(
            {
                "skill": skill,
                "count": count,
                "share": count / n,
                "n_jobs": n,
                "essential_share": essential_hits[skill] / n,
            }
        )
    return pd.DataFrame(rows)


def match_cv_to_skills(cv_text: str, frequencies: pd.DataFrame) -> dict:
    """Compare CV text to role skill frequencies; weighted score + gaps."""
    from skill_ease import ease_weeks_for, priority_score

    if frequencies.empty:
        return {
            "score": 0.0,
            "matched": [],
            "gaps": [],
            "top_n": 0,
            "matched_count": 0,
            "label": "match score against current market requirements",
            "gap_suggestion": None,
        }

    cv_skills = {s.lower() for s in extract_skills_from_text(cv_text)}
    # Word-boundary only — never raw substring (avoids git⊂digital, sap⊂whatsapp)
    cv_low = _clean_text(cv_text).lower()

    matched = []
    gaps = []
    weighted_hit = 0.0
    weighted_total = 0.0
    for row in frequencies.itertuples():
        skill = str(row.skill)
        weight = float(row.share)
        if weight <= 0:
            continue
        weighted_total += weight
        pattern = r"(?<![a-z0-9])" + re.escape(skill.lower()) + r"(?![a-z0-9])"
        has = skill.lower() in cv_skills or bool(re.search(pattern, cv_low))
        freq_pct = round(100 * weight, 1)
        if has:
            matched.append(
                {
                    "skill": skill,
                    "frequency_pct": freq_pct,
                }
            )
            weighted_hit += weight
        else:
            weeks = ease_weeks_for(skill)
            gaps.append(
                {
                    "skill": skill,
                    "frequency_pct": freq_pct,
                    "essential_share_pct": round(100 * float(row.essential_share), 1),
                    "ease_weeks": weeks,
                    "priority_score": round(priority_score(freq_pct, weeks), 2),
                }
            )

    gaps = sorted(gaps, key=lambda g: g["priority_score"], reverse=True)
    suggestion = None
    if gaps:
        top = gaps[0]
        suggestion = (
            f"Learn {top['skill']} first — ~{top['frequency_pct']}% of ads, "
            f"~{top['ease_weeks']} weeks."
        )
    score = (100 * weighted_hit / weighted_total) if weighted_total else 0.0
    return {
        "score": round(score, 1),
        "matched": matched,
        "gaps": gaps,
        "top_n": len(frequencies),
        "matched_count": len(matched),
        "label": "match score against current market requirements",
        "readiness_pct": round(score, 1),
        "gap_suggestion": suggestion,
    }

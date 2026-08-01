"""Rough weeks-to-learn estimates for gap prioritisation."""

from __future__ import annotations

# Canonical skill → approximate weeks to reach job-ad competence.
# Unlisted skills use DEFAULT_EASE_WEEKS.
SKILL_EASE_WEEKS: dict[str, int] = {
    "Git": 1,
    "HTML": 1,
    "CSS": 2,
    "Excel": 2,
    "PowerPoint": 1,
    "Microsoft Office": 2,
    "Communication": 2,
    "Jira": 1,
    "Confluence": 1,
    "SQL": 2,
    "CI/CD": 2,
    "REST API": 2,
    "Agile": 2,
    "Scrum": 2,
    "Power BI": 3,
    "Tableau": 3,
    "Looker": 3,
    "Power Query": 2,
    "DAX": 3,
    "Python": 4,
    "R": 4,
    "JavaScript": 4,
    "TypeScript": 4,
    "pandas": 2,
    "NumPy": 2,
    "PostgreSQL": 3,
    "MySQL": 3,
    "MongoDB": 3,
    "Oracle": 4,
    "React": 5,
    "Node.js": 4,
    "Java": 6,
    "C#": 6,
    "C++": 8,
    "Scala": 6,
    "Kotlin": 5,
    "Swift": 5,
    "AWS": 5,
    "Azure": 5,
    "GCP": 5,
    "BigQuery": 3,
    "Docker": 3,
    "Kubernetes": 8,
    "DevOps": 6,
    "Spark": 6,
    "PySpark": 5,
    "Hadoop": 6,
    "Snowflake": 4,
    "Databricks": 5,
    "Airflow": 4,
    "dbt": 3,
    "Kafka": 5,
    "Redshift": 4,
    "ETL": 4,
    "Data Modelling": 4,
    "Data Visualisation": 3,
    "Machine Learning": 8,
    "Deep Learning": 10,
    "TensorFlow": 8,
    "PyTorch": 8,
    "scikit-learn": 4,
    "NLP": 8,
    "Statistics": 4,
    "A/B Testing": 3,
    "GraphQL": 3,
    "Salesforce": 4,
    "SAP": 8,
    "SAS": 5,
    "SPSS": 3,
    "MATLAB": 5,
    "Alteryx": 3,
    "Cognos": 4,
    "Qlik": 3,
    "SSIS": 4,
    "SSRS": 3,
    "Figma": 3,
    "Photoshop": 4,
    "Linux": 3,
    "Project Management": 4,
    "Stakeholder Management": 3,
}

DEFAULT_EASE_WEEKS = 4


def ease_weeks_for(skill: str) -> int:
    return SKILL_EASE_WEEKS.get(skill, DEFAULT_EASE_WEEKS)


def priority_score(frequency_pct: float, ease_weeks: int | None) -> float:
    weeks = ease_weeks if ease_weeks is not None else DEFAULT_EASE_WEEKS
    return float(frequency_pct) / max(weeks, 1)

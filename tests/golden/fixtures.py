"""Fixed test data for the golden (characterization) tests.

Everything here is made up except the company names, which are real sponsors
so the matcher runs against the real Home Office register. No test touches the
network: `harness.py` serves this data in place of Reed, Adzuna, the ATS
boards and the AI service.
"""

from __future__ import annotations

import copy
from typing import Any

# --- job descriptions ------------------------------------------------------

_DESC_BACKEND = (
    "We are hiring a backend engineer to build services in Python. "
    "Essential skills: Python, SQL and experience with AWS. "
    "You will design REST APIs, work with Docker and Kubernetes, and use "
    "CI/CD pipelines with Git. Desirable: Kafka, Terraform and PostgreSQL. "
    "You will work in an Agile team and communicate well with stakeholders."
)
_DESC_FRONTEND = (
    "Build customer-facing products with TypeScript and React. Required: "
    "JavaScript, HTML, CSS and Git. Nice to have: GraphQL, Node.js and AWS. "
    "You will work in Agile sprints with designers using Figma."
)
_DESC_DATA = (
    "Join our data platform team. Must have Python, SQL and Spark. You will "
    "build ETL pipelines on Airflow, model data in Snowflake and share "
    "insight with Power BI and Tableau. Statistics knowledge is desirable."
)
_DESC_ENTERPRISE = (
    "Develop enterprise software in Java. Essential: Java, SQL and Linux. "
    "Experience with Docker, Jenkins pipelines and Agile delivery. "
    "Knowledge of Azure is preferred."
)
_DESC_GRAD = (
    "A graduate scheme for computer science graduates. No experience required. "
    "You will learn Python, Git and SQL while rotating across teams."
)
_DESC_SHORT = "Great role."


def _reed(
    job_id: int,
    company: str,
    title: str,
    location: str,
    smin: float | None,
    smax: float | None,
    desc: str,
) -> dict[str, Any]:
    return {
        "jobId": job_id,
        "employerName": company,
        "jobTitle": title,
        "locationName": location,
        "minimumSalary": smin,
        "maximumSalary": smax,
        # Reed's search endpoint only returns a short snippet.
        "jobDescription": desc[:90] + "...",
        "jobUrl": f"https://www.reed.co.uk/jobs/{job_id}",
        "_full": desc,
    }


# Reed rows for the plain role search ("Software Engineer").
REED_MAIN: list[dict[str, Any]] = [
    _reed(1001, "Monzo Bank Limited", "Backend Engineer (Python)", "London", 60000, 80000, _DESC_BACKEND),
    _reed(1002, "Revolut Ltd", "Senior Software Engineer", "London", 90000, 120000, _DESC_BACKEND),
    _reed(1003, "Deloitte LLP", "Graduate Software Engineer", "London", 32000, 32000, _DESC_GRAD),
    _reed(1004, "PwC", "Junior Developer", "Manchester", 38000, 42000, _DESC_FRONTEND),
    _reed(1005, "Capgemini UK Plc", "Software Engineer", "Birmingham", None, None, _DESC_ENTERPRISE),
    _reed(1006, "Starling Bank", "Lead Backend Developer", "London", 100000, 130000, _DESC_BACKEND),
    _reed(1007, "Hays Recruitment", "Python Software Engineer", "Leeds", 50000, 60000, _DESC_BACKEND),
    _reed(1008, "Robert Walters", "Software Engineer III", "Edinburgh", 70000, 85000, _DESC_ENTERPRISE),
    _reed(1009, "Thoughtworks", "Software Developer", "London", 55000, 70000, _DESC_FRONTEND),
    _reed(1010, "Cloudflare", "Software Engineer - Systems", "London, UK", 85000, 110000, _DESC_BACKEND),
    _reed(1011, "Acme Local Bakery Ltd", "Software Engineer (Remote)", "Remote", 40000, 50000, _DESC_FRONTEND),
    _reed(1012, "Bloomberg", "Software Engineer", "New York", 150000, 190000, _DESC_BACKEND),
    _reed(1013, "Reed", "Data Engineer", "London", 55000, 65000, _DESC_DATA),
    _reed(1014, "FDM Group", "Graduate Software Developer", "London", 28000, 30000, _DESC_GRAD),
    _reed(1015, "Arm Limited", "Software Engineer", "Cambridge", 65000, 85000, _DESC_BACKEND),
    _reed(1016, "Zopa Bank Limited", "Full Stack Engineer", "London", 62000, 62000, _DESC_FRONTEND),
    _reed(1017, "Spotify UK", "Backend Engineer", "London", 75000, 95000, _DESC_BACKEND),
    _reed(1018, "Northern Trust", "Software Engineer", "Glasgow", 45000, 45000, _DESC_ENTERPRISE),
    # Same employer and title in another city: collapsed by the cross-city dedupe.
    _reed(1019, "Monzo Bank Limited", "Backend Engineer (Python)", "Manchester", 60000, 80000, _DESC_BACKEND),
    # Same job id as 1001: dropped by the (source, job id) dedupe.
    _reed(1001, "Monzo Bank Limited", "Backend Engineer (Python)", "London", 60000, 80000, _DESC_BACKEND),
    _reed(1021, "Sky UK Limited", "Software Engineer (Ref: 12345)", "London", 50000, 60000, _DESC_BACKEND),
    _reed(1022, "Sky UK Limited", "Software Engineer (Ref: 99999)", "Leeds", 50000, 60000, _DESC_BACKEND),
    _reed(1023, "Palantir Technologies UK Limited", "Forward Deployed Software Engineer", "London", 80000, 100000, _DESC_DATA),
    _reed(1024, "Ocado Technology", "Software Engineer", "Hatfield", 60000, 60000, _DESC_BACKEND),
    _reed(1025, "Thoughtworks", "Software Engineer", "London", 55000, 60000, _DESC_SHORT),
    _reed(1026, "Spotify UK", "Junior Software Engineer", "London", 36000, 40000, _DESC_BACKEND),
    _reed(1027, "Cloudflare", "Software Engineer - Edge", "London", 70000, None, _DESC_BACKEND),
    _reed(1028, "Lloyds Banking Group", "Graduate Programme Software Engineer", "Bristol", None, 35000, _DESC_GRAD),
    _reed(1029, "Amazon UK Services Ltd", "Software Development Engineer", "London", 80000, 100000, _DESC_BACKEND),
    _reed(1030, "Accenture (UK) Limited", "Principal Software Engineer", "London", 110000, 140000, _DESC_ENTERPRISE),
]

# What Adzuna returns for the same search (short snippets, different ids).
ADZUNA_MAIN: list[dict[str, Any]] = [
    {
        "id": "ad-1",
        "title": "Software Engineer",
        "company": {"display_name": "Wise Payments Limited"},
        "location": {"display_name": "London, UK"},
        "salary_min": 65000.0,
        "salary_max": 85000.0,
        "description": "Build payments systems in Java and Python &amp; AWS. SQL needed.",
        "redirect_url": "https://www.adzuna.co.uk/jobs/ad-1",
    },
    {
        "id": "ad-2",
        "title": "Junior Data Engineer",
        "company": {"display_name": "Zopa Bank Limited"},
        "location": {"display_name": "London"},
        "salary_min": 40000.0,
        "salary_max": 50000.0,
        "description": "<p>Python and SQL with Airflow and Spark.</p>",
        "redirect_url": "https://www.adzuna.co.uk/jobs/ad-2",
    },
    {
        "id": "ad-3",
        "title": "Software Engineer",
        "company": {"display_name": "Acme Local Bakery Ltd"},
        "location": {"display_name": "Dublin"},
        "salary_min": None,
        "salary_max": None,
        "description": "Not in the UK.",
        "redirect_url": "https://www.adzuna.co.uk/jobs/ad-3",
    },
]

# The extra search the API runs for a graduate ("graduate Software Engineer").
REED_GRADUATE: list[dict[str, Any]] = [
    _reed(2001, "Northrop Grumman", "Graduate Software Engineer", "Bristol", 34000, 38000, _DESC_GRAD),
    _reed(2002, "BAE Systems", "Software Engineer - Graduate Programme 2027", "Warton", 33000, 33000, _DESC_GRAD),
    # Not the same kind of job: the title check drops these two.
    _reed(2003, "Brandon James Ltd", "Graduate Structural Engineer", "Leeds", 28000, 30000, _DESC_GRAD),
    _reed(2004, "Rule Recruitment", "Trainee Recruitment Consultant", "London", 25000, 45000, _DESC_SHORT),
]
ADZUNA_GRADUATE: list[dict[str, Any]] = [
    {
        "id": "ad-g1",
        "title": "Graduate Software Developer",
        "company": {"display_name": "FDM Group"},
        "location": {"display_name": "London"},
        "salary_min": 28000.0,
        "salary_max": 30000.0,
        "description": "Graduate scheme. Python, SQL and Git.",
        "redirect_url": "https://www.adzuna.co.uk/jobs/ad-g1",
    }
]

# A Greenhouse board for a company the ATS cache already knows ("live").
GREENHOUSE_BOARDS: dict[str, dict[str, Any]] = {
    "monzo": {
        "jobs": [
            {
                "id": 7001,
                "title": "Backend Engineer",
                "location": {"name": "London, UK"},
                "content": "&lt;p&gt;Python, SQL, AWS and Docker. Essential: Python.&lt;/p&gt;",
                "absolute_url": "https://boards.greenhouse.io/monzo/jobs/7001",
                "updated_at": "2026-09-01T10:00:00Z",
                "departments": [{"name": "Engineering"}],
                "company_name": "Monzo",
            },
            {
                "id": 7002,
                "title": "Marketing Manager",
                "location": {"name": "London, UK"},
                "content": "Marketing role.",
                "absolute_url": "https://boards.greenhouse.io/monzo/jobs/7002",
                "updated_at": "2026-09-02T10:00:00Z",
                "departments": [],
                "company_name": "Monzo",
            },
            {
                "id": 7003,
                "title": "Software Engineer",
                "location": {"name": "San Francisco, CA"},
                "content": "US only.",
                "absolute_url": "https://boards.greenhouse.io/monzo/jobs/7003",
                "updated_at": "2026-09-03T10:00:00Z",
                "departments": [],
                "company_name": "Monzo",
            },
        ]
    }
}

# What ats_store says is already cached (company_key -> row).
ATS_CACHE: dict[str, dict[str, Any]] = {
    "monzo bank": {
        "company_key": "monzo bank",
        "ats_provider": "greenhouse",
        "board_token": "monzo",
        "published_name": "Monzo",
        "has_uk_jobs": 1,
        "status": "live",
    },
    "cloudflare": {
        "company_key": "cloudflare",
        "ats_provider": "ashby",
        "board_token": "cloudflare",
        "published_name": "Cloudflare",
        "has_uk_jobs": 1,
        "status": "live",
    },
    "arm": {
        "company_key": "arm",
        "ats_provider": "workable",
        "board_token": "arm",
        "published_name": "Arm",
        "has_uk_jobs": 0,
        "status": "live",
    },
}


def reed_search(keywords: str, take: int, skip: int) -> dict[str, Any]:
    kw = keywords.lower()
    if "zzzz" in kw:
        rows: list[dict[str, Any]] = []
    elif "graduate" in kw:
        rows = REED_GRADUATE
    else:
        rows = REED_MAIN
    page = [{k: v for k, v in r.items() if k != "_full"} for r in rows[skip : skip + take]]
    return {"results": copy.deepcopy(page), "totalResults": len(rows)}


def reed_full_description(job_id: str) -> str | None:
    for rows in (REED_MAIN, REED_GRADUATE):
        for r in rows:
            if str(r["jobId"]) == job_id:
                return r["_full"]
    return None


def adzuna_search(role: str) -> dict[str, Any]:
    kw = role.lower()
    if "zzzz" in kw:
        return {"results": []}
    rows = ADZUNA_GRADUATE if "graduate" in kw else ADZUNA_MAIN
    return {"results": copy.deepcopy(rows)}


# --- CVs ---------------------------------------------------------------------

CV_GRADUATE = """Sam Patel
Computer Science student at Royal Holloway, University of London

EXPERIENCE
Software Engineering Intern, Brightline Analytics, Jun 2024 - Sep 2024
- Built REST API endpoints in Python and FastAPI for an internal reporting tool.
- Co-authored research on anomaly detection methods with the data science team.
- Wrote unit tests and fixed bugs reported by the QA team.

Teaching Assistant, Royal Holloway, Oct 2023 - May 2024
- Helped first-year students with Java lab exercises.
- Marked weekly coursework and gave written feedback.

PROJECTS
- Built a Discord bot in Python that tracks study sessions.

EDUCATION
BSc Computer Science, Royal Holloway, University of London, 2022-2025

SKILLS
Python, Java, SQL, FastAPI, Git, Docker, Linux
"""

CV_JUNIOR = """Priya Shah
Backend developer, London.

PROFILE
Backend developer with two years in a payments-adjacent fintech, working mostly
in Python on services that handle invoices, partner webhooks and search.

EXPERIENCE
Junior Backend Developer, Ledgerly (fintech), Aug 2023 - Sep 2026
- Set up a GitHub Actions pipeline that runs the test suite and deploys to staging on every merge.
- Wrote the PostgreSQL queries and indexes behind the invoice search, cutting p95 latency from 1.8s to 300ms.
- Moved two Flask services into containers and onto EKS with the platform team.
- Built and documented the public webhooks endpoint used by 60 partner integrations.

Software Engineering Intern, Northbeam, Jun 2022 - Sep 2022
- Fixed bugs in a Django admin dashboard.

EDUCATION
BSc Computer Science, University of Leeds, 2020-2023, 2:1

SKILLS
Python, Flask, Django, TypeScript, Terraform, Redis, Linux
"""

CV_SENIOR = """Jordan Lee
Staff-level data engineer

EXPERIENCE
Senior Data Engineer
Monzo | March 2018 - Present
- Built Spark and Airflow pipelines on AWS feeding Snowflake and Power BI.
- Led a team of five and mentored graduates.
Data Engineer
Ocado | 06/2014 - 02/2018
- Wrote SQL and Python ETL jobs.

EDUCATION
MSc Data Science, UCL, 2013 - 2014
"""


def llm_content(cv: str) -> str:
    """A canned AI reply in the format the prompt asks for.

    Evidence quotes are copied from the fixture CVs so the "found in your
    work" path runs. It deliberately contains an em dash, a semicolon, a bare
    section header and markdown, which the API has to clean up.
    """
    if cv == "junior":
        judgements = (
            '[{"skill": "CI/CD", "status": "demonstrated", "evidence": "Set up a GitHub Actions pipeline that runs the test suite", "blocking": false, "why": "Shows automated testing and deployment"},'
            '{"skill": "Docker", "status": "demonstrated", "evidence": "Moved two Flask services into containers", "blocking": false, "why": "Containers imply Docker"},'
            '{"skill": "REST API", "status": "demonstrated", "evidence": "Built and documented the public webhooks endpoint", "blocking": false, "why": "Webhooks are HTTP APIs"},'
            '{"skill": "Kubernetes", "status": "listed", "evidence": "", "blocking": false, "why": "Mentioned only as EKS"},'
            '{"skill": "Java", "status": "missing", "evidence": "", "blocking": true, "why": "Many ads ask for Java; none shown"},'
            '{"skill": "Agile", "status": "missing", "evidence": "", "blocking": false, "why": "Not mentioned"},'
            '{"skill": "Kafka", "status": "demonstrated", "evidence": "built a Kafka streaming platform", "blocking": false, "why": "Made up quote that must be rejected"}]'
        )
        strengths = '["Python in production, ~80% of ads", "CI/CD pipeline work", "SQL performance tuning"]'
        gaps = '["Java - ~30% of ads (blocking)", "Docker - ~40% of ads", "Agile - ~25% of ads"]'
        total, band = 76, "solid maybe"
    elif cv == "graduate":
        judgements = (
            '[{"skill": "Python", "status": "demonstrated", "evidence": "Built REST API endpoints in Python and FastAPI", "blocking": false, "why": "Used in an internship"},'
            '{"skill": "SQL", "status": "listed", "evidence": "", "blocking": false, "why": "Only in the skills list"},'
            '{"skill": "AWS", "status": "missing", "evidence": "", "blocking": true, "why": "Cloud is expected"}]'
        )
        strengths = '["Python internship experience", "Clear degree and dates", "Relevant project"]'
        gaps = '["AWS - ~45% of ads", "CI/CD - ~35% of ads", "Kubernetes - ~30% of ads"]'
        total, band = 48, "not competitive"
    else:
        judgements = (
            '[{"skill": "SQL", "status": "demonstrated", "evidence": "Wrote SQL and Python ETL jobs", "blocking": false, "why": "Daily use"}]'
        )
        strengths = '["Seniority and scope", "Spark and Airflow", "Mentoring"]'
        gaps = '["Kubernetes - ~30% of ads", "Docker - ~40% of ads", "Java - ~30% of ads"]'
        total, band = 88, "put forward"
    put_forward = "Yes" if total >= 85 else "No"
    return f"""<<<SKILL_JUDGEMENTS>>>
{judgements}
<<<END_SKILL_JUDGEMENTS>>>
One entry for each of the first 10 market skills, in order.

SECTION: Where you are now
- The CV shows a clear path — junior to mid; the story points at this role.
- **Python** is in ~80% of ads and is clearly used.

SECTION: Strengths
- Quote a real line and name the skill it shows.
- Second strength with evidence.

Gaps
- Blocking: Java — ~30% of ads — none shown in the CV.
- Nice to have: Agile — ~25% of ads — not mentioned.
- Nice to have: Docker — ~40% of ads — containers shown without the name.

## Skills to learn for sponsored roles
- Java — ~30% of ads — ~6 weeks

**Scores**
- Seven-Second Survivability: 16/20 — clean layout; name top left.
- Evidence of Real Impact: 15/20 — some numbers.
- Authenticity vs AI Sameness: 14/20 — specific projects.
- Relevance and Skills Credibility: 15/20 — good evidence.
- Differentiation and Progression: 16/20 — steady dates.
- Total: {total}/100 — {band}

<<<SUMMARY_JSON>>>
{{
  "bucket": "MAYBE",
  "score_out_of_100": {total},
  "first_impression": "A clear junior profile — solid basics.",
  "where_you_are": "You show real Python work; the gap is Java.",
  "top_3_strengths": {strengths},
  "top_3_gaps": {gaps},
  "one_thing_to_fix_first": "Name Docker in the EKS bullet",
  "would_put_forward": "{put_forward}",
  "jobs_analyzed_for_skills": 10,
  "jd_excerpts_in_prompt": 5,
  "jobs_reviewed": 5
}}
<<<END_SUMMARY_JSON>>>

RED FLAGS
- No metrics on two bullets.

SECTION: Experience bullets
- Original: "Fixed bugs in a Django admin dashboard."
- Verdict: weak and has no outcome.
- Rewrite: Fixed bugs in a Django admin dashboard used by the support team.

SECTION: Fix first
- Name Docker explicitly.

SECTION: Rewritten summary
- Backend developer with two years of Python experience.

## Put forward
- {put_forward} — one sentence why.
"""

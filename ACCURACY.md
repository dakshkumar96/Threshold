# Accuracy

Figures from automated / reviewed samples of the `"data analyst"` job run (Reed + Adzuna → sponsor match → skill extract), plus ATS board fetches where mapped.

## Source precision (employer identity)

| Source | Employer identity | Precision |
|--------|-------------------|-----------|
| ATS (Greenhouse, Ashby, Workable, Recruitee) | Published by the employer on their own board | **Certain** |
| Reed / Adzuna | Fuzzy name match against Home Office register | **~59%** (n=100) |

Employer identity is certain for roles fetched directly from a company's own applicant tracking system. For aggregator-sourced roles, employer identity is inferred by fuzzy name matching. Confidence is labelled per row:

| Label | Rule |
|-------|------|
| **Verified sponsor** | Fetched from the employer's own ATS board |
| **Likely sponsor** | Name match ≥ 90 |
| **Possible sponsor** | Name match 80–89, or recruitment-agency match |
| *(dropped)* | Name match &lt; 80 |

Overall aggregator precision remains approximately **59%** (n=100). The ATS mapping is built lazily from real searches and requires no scheduled maintenance.

**Coverage caveat:** verified identity is available where a company publishes roles through a supported ATS. Coverage is strongest in technology, fintech, and scale-up hiring, and weakest in healthcare, hospitality, retail, and the public sector, where employers typically use systems without public job feeds. Those sectors are shown with name-matched confidence instead.

## Licence tenure bands (UI)

User-facing bands use **observed register tenure** (`duration_days` in the retention parquet), not Cox hazard terciles:

| Band | Rule |
|------|------|
| Established | ≥ 5 years on the register in our archive |
| Moderate | 2–5 years |
| Newly registered | &lt; 2 years or unknown |

**Long-standing licence** is flagged when Established or tenure ≥ 3 years. This is an honest proxy for licence age — not evidence of CoS hires or “hired international graduates.” Cox `stability_score` may still be used as a secondary sort offline; see `ANALYSIS.md`.

## ATS layer smoke checks

```powershell
.\.venv\Scripts\python.exe -c "from api import ats_store, ats_probe; from api.uk_location import is_uk; ats_store.init_db(); print(ats_store.load_seed(), ats_store.stats()); r=ats_probe.fetch_board('greenhouse','monzo'); print(r['published_name'], len(r['jobs'])); print(ats_probe.slug_variants('Monzo Bank Ltd')); assert is_uk('London, England') and not is_uk('Remote') and not is_uk('New York') and is_uk('York, UK')"
.\.venv\Scripts\python.exe scripts\check_uk_location.py
```

`data/ats_map.db` is a learned cache (gitignored). Seed file `data/ats_seed.json` is committed.

## Sponsor name match (rapidfuzz ≥ 80 floor; likely ≥ 90)

| Sample | n | Correct (Y) | Incorrect (N) | Precision |
|--------|---|-------------|---------------|-----------|
| Initial review | 50 | 34 | 16 | **68.0%** |
| Expanded (same labeling rules) | 100 | 59 | 41 | **59.0%** |

**Label rule:** Y if `company_raw` / `company_key` clearly refers to the same employer as `matched_company_key` (legal suffixes OK). N for recruiters matched to the wrong firm, short-token collisions (e.g. “QA”, “Wise”), or generic overlap (“group”, “recruitment”).

**File:** `data/processed/match_qa_sample.csv` (current = 100-row expanded sample)  
**Script:** `src/qa_match_sample.py`

Common failure modes: recruitment agencies, short brand names, shared generic tokens. Larger samples surface more of those hard cases — treat ~60% as the more cautious product figure. Matches below 80 are not listed as sponsors.

**Methodology caveat:** the 68%/59% figures above are labeled by `qa_match_sample.py`'s own `label_match()` heuristic, not by a person — they're a consistent proxy, not verified ground truth, and they cover one role (`data analyst`) only. `src/qa_match_sample_multi.py` pulls a fresh sample across 5 roles (including a sector ATS coverage is weakest in — see above) into `data/processed/match_qa_sample_multi.csv` with an empty `human_label` column for real review; `src/qa_tier_calibration.py` computes actual precision per `sponsor_confidence` tier once that column is filled in. Numbers here should be replaced once that human-labeled pass is done.

## Requirement / skill extraction

### Legacy static checklist sample

| Field | n scored | Precision |
|-------|----------|-----------|
| power_bi | 4 | 100% |
| sql | 1 | 100% |
| python | 1 | 100% |
| excel | 1 | 100% |
| degree / years / tool=False | mostly N/A | — |

**Overall on scored rows:** 7 / 7 = **100%** (only rows where the snippet clearly supported a judgment).

**File:** `data/processed/req_qa_sample.csv`  
**Script:** `src/qa_requirements_sample.py`

### Dynamic skills (current product path)

Skills come from alias matching + frequency counts over **every fetched job’s JD** (`src/dynamic_skills.py`).

#### What was wrong before
- Search APIs return **~500-character snippets** (median length 500 on 449 jobs).
- Only **57 / 449** jobs produced any skill hit from those snippets.
- The API previously counted skills on **sponsor-matched jobs only**.

#### What we do now
1. For every **Reed** job, call `/jobs/{id}` and replace the snippet with the **full JD** (199/199 upgraded in the sample parquet).
2. Scan **Reed full-text JDs primarily** for skills (all fetched jobs when fewer than 5 full Reed texts).
3. Adzuna still has no public full-JD endpoint, so those stay truncated.

#### Coverage impact (same 449-job parquet)

| Metric | Truncated snippets | After Reed full JD |
|--------|--------------------|--------------------|
| Jobs with ≥1 skill | **57 (13%)** | **229 (51%)** |
| SQL mentions counted | 25 | **149** |
| Python mentions counted | 6 | **119** |
| Excel mentions counted | 16 | **137** |

#### QA sample (n=100 jobs, Reed enriched where available)

| Check | Result |
|-------|--------|
| Positive precision (predicted skill alias present in that JD) | **100%** (235/235) |
| Recall vs ground-truth patterns (SQL, Python, Power BI, …) | **100%** (147/147) on skills in the alias/pattern list |
| Full Reed JDs in sample | 45–47 of 100 (rest mostly Adzuna snippets) |

**File:** `data/processed/skill_qa_sample.csv`  
**Script:** `src/qa_dynamic_skills.py` (`--enrich` upgrades Reed text first)

**Honest limits:**
- Alias list cannot invent skills that are worded oddly or absent from the list.
- Soft skills / niche tools still under-counted.
- Adzuna truncation still hides skills on that source.
- “100% recall” only means: if a ground-truth pattern is in the text we have, we detect the mapped skill — not that we recover every possible skill a human would list.

### Hand-label recall sample (pending)

| Check | Status |
|-------|--------|
| Human recall on 30 Reed full-text JDs | **Pending** — label `skills_present` in sample CSV |

**File:** `data/processed/skill_recall_sample.csv` (generate with `src/qa_skill_recall.py`)  
**Script:** `src/qa_skill_recall.py`

Match score label in the API: *match score against current market requirements*.

## How to re-run

```powershell
.\.venv\Scripts\python.exe src\qa_match_sample.py
.\.venv\Scripts\python.exe src\qa_requirements_sample.py
.\.venv\Scripts\python.exe src\qa_dynamic_skills.py --enrich --n 100
.\.venv\Scripts\python.exe src\qa_skill_recall.py
```

# STAGE 05 — Matching, scoring, free-LLM CV feedback

## Goal
Score the user against market requirements, show gaps, rank sponsor jobs by stability, and optionally critique the CV with a free LLM.

## Inputs
- Matched jobs + dynamic skill frequencies
- CV text (PDF) and/or checklist
- `sponsor_retention_scores.parquet`

## Tasks
- [x] Weighted match score by skill frequency
- [x] Gaps ranked by frequency; skills present listed
- [x] Sponsors sorted by `stability_score` descending
- [x] OpenAI-compatible LLM client (default Groq); skip if no key
- [x] API multipart: `role` + optional `cv_file`

## Outputs
- Updated `api/main.py` `/analyze`
- `src/cv_feedback.py`

## Env
```
LLM_API_KEY=...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
```

## Done when
JSON includes score, gaps, sponsors with stability, and `cv_feedback` or null + message.

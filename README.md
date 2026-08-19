# uk-sponsor-analysis

**Threshold** — UK visa sponsor jobs, CV gaps, and licence retention signals.

Pick any role, optionally upload a CV PDF, fetch live Reed + Adzuna jobs, match employers to Skilled Worker sponsors, score skills against that role's ads, and rank sponsors by licence stability band.

No fake probabilities. Numbers trace back to government register data and job APIs.

## Status

- Stages 0–7: see [`docs/stages/`](docs/stages/)
- QA accuracy: [`ACCURACY.md`](ACCURACY.md) (sponsor-name match **~59%** on n=100; earlier n=50 was 68%)
- Analysis write-up: [`ANALYSIS.md`](ANALYSIS.md)
- Local web app: FastAPI + Next.js SaaS shell (Clerk auth, landing, home, search, insights, solutions, profile)

## Accuracy (short)

| Source / check | Result |
|----------------|--------|
| ATS board fetch (Greenhouse, Ashby, Workable, Recruitee) | Employer identity **certain** (published on the company's own board) |
| Job → sponsor name match (Reed / Adzuna) | **59%** precision (100-row sample); 68% on earlier n=50 |
| Skill hits (legacy QA sample) | **100%** on 7 positive tool predictions; negatives often N/A (truncated ads) |
| Dynamic skills | Frequency signal from role ads; truncated JD limits apply |

ATS verification covers employers that publish via supported public job boards — strongest in tech/fintech/scale-ups; weakest in healthcare, hospitality, retail, and public sector. See [`ACCURACY.md`](ACCURACY.md).

## Running locally

### 1. Python env + keys

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `.env` (never commit secrets):

```
REED_API_KEY=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...

# Optional free LLM (OpenAI-compatible; default Groq)
LLM_API_KEY=...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# Optional gate for /analyze (recommended when API is public)
# ANALYZE_API_KEY=...
# ANALYZE_RATE_LIMIT_PER_MIN=6
# CORS_ALLOW_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

If `LLM_API_KEY` is missing, role-only search still works (jobs, sponsors, skill frequencies). When a CV is uploaded, `LLM_API_KEY` is **required** (HTTP 503 otherwise).

CV critique uses modular prompts in `prompts/` (core + one role rubric + up to 3 failure patterns + one calibration example). Assembled by `src/llm_prompt_builder.py`. Default model: `llama-3.3-70b-versatile`.

### 2. Survival scores (once, or after panel refresh)

```powershell
.\.venv\Scripts\python.exe src\run_survival.py
```

Writes `data/processed/sponsor_retention_scores.parquet` (with `stability_score`), figures, and `data/processed/dashboard_exports/`.

### 3. API

```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --reload --port 8000
```

`POST /analyze` is multipart: fields `role` (required) + optional `cv_file` (PDF/TXT). Optional header `X-Analyze-Key` if `ANALYZE_API_KEY` is set. CV upload requires `LLM_API_KEY`. Frontend timeout: 210s; LLM HTTP timeout: 150s. Job context sent to the LLM is packed to ≤6 JDs (~8k chars) to avoid provider 413 errors.

Smoke-test the LLM key without running a full job search:

```powershell
.\.venv\Scripts\python.exe scripts\smoke_llm.py
```

### 4. Frontend (SaaS shell)

```powershell
cd frontend
npm install
copy .env.local.example .env.local
# Optional: paste Clerk keys from https://dashboard.clerk.com
# Or leave blank — Clerk keyless mode works in `next dev` (claim banner appears)
npm run dev
```

Open http://localhost:3000.

| Route | Access |
|-------|--------|
| `/` | Public marketing landing |
| `/about`, `/solutions/*`, `/methodology`, `/benchmarks` | Public |
| `/sign-in`, `/sign-up` | Clerk |
| `/home`, `/search`, `/results`, `/insights`, `/profile` | Signed-in required |

`frontend/.env.local`:

```
# Optional — blank uses Clerk keyless mode in local next dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/search
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

API Clerk JWT verification (for saved searches / profile). If unset, the API derives JWKS from the token issuer:

```
CLERK_JWKS_URL=https://YOUR_INSTANCE.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://YOUR_INSTANCE.clerk.accounts.dev
# Local-only: CLERK_DEV_BYPASS=1 accepts Authorization: Bearer user_…
```

Protected app routes always require sign-in. Analyze speed knobs (optional): `ANALYZE_MAX_PER_SOURCE` (default 40), `ANALYZE_MAX_REED_ENRICH` (30), `ANALYZE_MAX_ATS_BOARDS` (12).

### Pipeline scripts (optional)

```powershell
.\.venv\Scripts\python.exe src\run_jobs_pipeline.py "data analyst"
.\.venv\Scripts\python.exe src\run_survival.py
```

## Deploy

Only after a local E2E (role, with and without sample CV) succeeds:

| Piece | Suggested host | Notes |
|-------|----------------|-------|
| Frontend | **Vercel** | Set `NEXT_PUBLIC_API_URL` to the public API URL |
| API | **Render** (or similar) | Python service: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`; include `data/processed/*.parquet` or rebuild on deploy; set Reed/Adzuna/LLM env vars |

CORS origins come from `CORS_ALLOW_ORIGINS` (comma-separated). Default is localhost:3000/3001. Set your Vercel URL before deploying.

### Optional Tableau Public (market dashboard)

Personal CV charts stay in-app (Recharts). For a public market view, upload CSVs from `data/processed/dashboard_exports/` to Tableau Public and embed the link on `/insights` or methodology. Cut this first if short on time.

## Limitations

- Licence held ≠ actively hiring
- Name matching is imperfect (~59–68% QA precision depending on sample size)
- Job descriptions are often truncated
- Retention timing follows irregular snapshots; tenure is left-truncated
- Register has **no sector** — see [`LATER.md`](LATER.md)

## Why

Built from personal experience as an international student navigating UK sponsorship, where clear information is hard to find.

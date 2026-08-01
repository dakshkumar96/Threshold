# Analysis: What is linked to sponsor licence retention?

## Question
Within our 2023-09 → 2026-07 snapshot window, which observable factors are linked to Skilled Worker sponsors staying on the Home Office register?

## Data
- Panel of **133,979** unique cleaned company keys across **10** irregular snapshots (earliest 2023-09-21, latest 2026-07-28)
- **12,780** observed exits; **121,199** still active (right-censored at the latest snapshot)
- Covariates from each firm’s first observed row: licence **rating** (A/B/other) and coarse **region** (London / rest of England / Scotland / Wales / NI / unknown)
- No sector field exists on the register

## Method
- Survival time = days from `first_seen` to `last_seen` (exit) or to latest snapshot (censored)
- **Left truncation:** companies already licensed before our earliest archive appear with `first_seen` = that archive date; true pre-period tenure is not observed
- Kaplan–Meier curves + multivariate log-rank tests by rating and region
- Cox proportional hazards with `rating_A` and region dummies (reference ≈ London)
- Unit of analysis: `company_key` (cleaned name), not a legal company number
- **Stability score 0–100:** invert Cox partial hazard, min–max normalise across companies (higher = more stable relative to peers)

## Finding
**Region is linked to exit risk; London sponsors exit more often than Scottish ones in this window.**

- Exit rate: London **10.1%** vs Scotland **8.3%** vs rest of England **9.4%** (raw shares of firms with an observed exit)
- Log-rank test across regions: **p ≈ 7.2×10⁻⁵**
- Cox model: Scotland coefficient ≈ **-0.18** → hazard ratio ≈ **0.84** (95% CI about 0.75–0.94), i.e. lower estimated exit hazard than the London reference
- Rating log-rank is weaker (**p ≈ 0.043**); almost all firms are A-rated, so rating is a thin signal here
- KM overall median survival: **not reached** (>50% still active in-window; ~121k of 134k censored)
- Among companies first seen in our **2023** snapshots, about **12.9%** later exited before the latest snapshot

Practical takeaway for the product: a **stability score** from this model is a coarse relative signal to rank sponsors beside job matches — not a prediction that a given employer will hire or revoke a licence tomorrow.

Label used in the product: *relative licence stability score — not a guarantee of active hiring*.

## Public dashboard exports
Chart-ready CSVs for an optional Tableau Public market dashboard:

| File | Content |
|------|---------|
| `data/processed/dashboard_exports/sponsors_by_region.csv` | Counts + exit rates by region |
| `data/processed/dashboard_exports/headline_stats.csv` | % of 2023-first-seen sponsors later exited |
| `data/processed/dashboard_exports/stability_scores_sample.csv` | Sample of stability scores |
| `data/processed/figures/km_overall.png` | Overall KM curve |
| `data/processed/figures/km_by_region.png` | KM by region |

Personal (user-specific) skill/CV charts stay in the Next.js app via Recharts — they are not Tableau Public.

## Limitations
- Snapshot gaps (often 2–7 months) mean exit dates are approximate (interval censoring simplified)
- Identity is names-only; cleaning errors can merge or split firms
- No sector / size / CoS volume covariates — cannot test 2024–25 salary-threshold effects by sector
- Some region dummies showed PH-assumption strain in lifelines checks
- Holding a licence ≠ actively hiring; job postings are a biased sample
- Product ATS verification (Greenhouse / Ashby / Workable / Recruitee) strengthens employer identity for tech and scale-up hiring, but does not cover healthcare, hospitality, retail, or public-sector employers that lack public job feeds — those stay name-matched only

## What I’d do differently
- Denser historical snapshots (closer to monthly) if archives allow
- Companies House matching for a stable company number
- Stratified Cox or time-varying region effects where PH fails
- Enrich with sector from an external source before claiming industry patterns

# STAGE 03 — Survival analysis + stability score

## Goal
Estimate how long Skilled Worker sponsors stay on the register and attach a **0–100 relative licence stability score** to each company.

## Inputs
- `data/processed/sponsor_panel.parquet`
- `data/processed/sponsor_company_summary.parquet`

## Tasks
- [x] Unit = `company_key`; event = exit if not `still_active`; duration = tenure days
- [x] Document left truncation (firms already licensed before first snapshot)
- [x] KM overall + median (or “median not reached”)
- [x] KM by **region** (no sector column on register) + log-rank
- [x] Cox with region + first_rating; PH check; HRs
- [x] Invert + min–max normalise hazard → `stability_score` 0–100
- [x] Save figures under `data/processed/figures/`

## Outputs
- `data/processed/survival_table.parquet`
- `data/processed/sponsor_retention_scores.parquet` (includes `stability_score`)
- `data/processed/figures/km_overall.png`, `km_by_region.png`

## Limitations
- Irregular snapshots → approximate exit timing
- Names-only ID; no sector
- Stability score is **not** a guarantee of hiring

## Done when
Sponsors can be ranked by `stability_score` with label: *relative licence stability score — not a guarantee of active hiring*.

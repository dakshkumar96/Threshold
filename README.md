# uk-sponsor-analysis

Analysing UK visa sponsorship data to help international students understand where they realistically stand in the job market.

## What it does

Upload a CV, pick a target role, and get:

- How many licensed sponsors are hiring for that role, and where
- A match score against the most common stated requirements
- A gap analysis showing exactly what you're missing, ranked by importance
- The specific roles you already fully match
- Which sponsors have a stable licence history vs newly registered ones

No fake probabilities. Every number traces back to real government and job-market data.

## Data sources

- Home Office Register of Licensed Sponsors
- Historical register snapshots (for licence-retention analysis)
- Live job postings (Adzuna / Reed)
- ONS business demography (baseline comparison)



## Tech

Python · pandas · lifelines · rapidfuzz · Next.js · Vercel

## Status

🚧 In development — building v1 by 10 August 2026

## Why

Built from personal experience as an international student navigating the UK sponsorship system, where clear, honest information is genuinely hard to find.

## Running locally

*Coming soon.*

## Limitations

Holding a sponsor licence is not the same as actively hiring. Job-posting data is a partial sample. This tool is for guidance, not a guarantee.
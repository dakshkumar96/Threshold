# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

International students and recent graduates in the UK, typically 21-24, who need to identify realistic sponsored-job opportunities while under visa, financial, and time pressure. They are often searching after previous rejections and need clear, confidence-building guidance rather than more noise.

## Product Purpose

Sponsor Signal combines live UK job ads, the Home Office Skilled Worker sponsor register, employer licence history, market skill demand, and optional CV feedback. It helps users answer three questions: which licensed employers are hiring, how trustworthy each sponsor match is, and what they should improve next.

## Positioning

Unlike a generic job board, Sponsor Signal verifies or qualifies employer sponsor identity, keeps results UK-only, adds licence-tenure context, and turns skills from current adverts into a personal roadmap.

## Operating Context

Guests see a marketing landing, public guides, Insights, and can run a search without an account. Signed-in users get a home dashboard, saved searches, and profile preferences. Mobile-first; main workflow remains search → results → apply on the source site.

## Capabilities and Constraints

- Live UK roles from Reed, Adzuna, and supported employer ATS boards.
- Sponsor confidence is `verified`, `likely`, or `possible`; aggregator name matching is not certain.
- Licence tenure is archive-derived and is not a guarantee of future sponsorship.
- CV analysis uses deterministic skill frequencies plus one third-party LLM call for narrative feedback.
- Salary may be missing from adverts; unknown-salary roles remain visible.
- The product does not prove that an employer hired international graduates and does not predict visa approval.

## Brand Commitments

- Product name: Sponsor Signal.
- Voice: calm, candid, precise, supportive, and never patronising.
- Visual references explicitly named by the user: Linear, Raycast, Clerk, Notion, and Monzo for restraint, trust, editorial whitespace, and humane financial-product clarity.
- Avoid corporate job-board styling, LinkedIn blue-and-white energy, AI gradients, cartoon illustrations, and anxiety-inducing urgency.

## Evidence on Hand

- Home Office sponsor snapshots and processed sponsor summaries under `data/processed/`.
- Licence retention and duration data under `data/processed/sponsor_retention_scores.parquet`.
- Live job-source integrations and ATS cache.
- Accuracy methodology in `ACCURACY.md`; current aggregator name-match precision is approximately 59% on the reviewed sample.
- No testimonials, customer logos, cohort percentiles, or confirmed Certificate of Sponsorship hiring history. Future work must not fabricate them.

## Product Principles

1. Signal before volume: surface the strongest sponsor evidence first.
2. Honest confidence: label uncertainty and explain what each tier means.
3. Action over judgment: frame skill gaps as a practical learning roadmap.
4. Calm under pressure: reduce cognitive load and always provide a next step.
5. Data before prose: deterministic analysis owns facts; the LLM explains them.

## Accessibility & Inclusion

Mobile-first, keyboard accessible, readable under stress, and not dependent on colour alone. Visa explanations must use plain English and link to dated official guidance.

# RECON

## What this data is

This project uses the UK Home Office **Register of Licensed Sponsors (Workers)**.

The current file is:

- `data/raw/sponsor_register_2026-07-28.csv`

It contains one row per sponsor entry and has 5 columns:

- `Organisation Name`
- `Town/City`
- `County`
- `Type & Rating`
- `Route`

The current file has about **142,635 rows**.

## What we learned from the first check

### 1. Company identifier or names only?

**Names only.**

There is no company number or licence ID column in this file.

That means later matching will need to use company names, not a clean unique ID.

### 2. Is route included? Can we isolate Skilled Worker?

**Yes.**

The `Route` column is present, and `Skilled Worker` can be filtered directly.

### 3. Is licence rating included?

**Yes.**

The rating is inside `Type & Rating`, for example `Worker (A rating)`.

### 4. Is county / region included?

**Yes, partly.**

The file includes both `Town/City` and `County`.

`Town/City` is mostly filled in. `County` exists but has many blanks, so location analysis will probably rely more on `Town/City`.

## Historical snapshot hunt

We searched in this order:

1. data.gov.uk
2. The National Archives web archive
3. Wayback Machine
4. GitHub

### Results

- **data.gov.uk:** no usable historical snapshots found
- **National Archives:** archived pages exist, but no usable CSV downloads found
- **Wayback Machine:** success
- **GitHub:** repos exist that use the register, but no clear public archive of historical CSVs

We downloaded **9 usable historical snapshots** into `data/raw/snapshots/`:

- `sponsor_register_2023-09-21.csv`
- `sponsor_register_2024-01-05.csv`
- `sponsor_register_2024-04-03.csv`
- `sponsor_register_2024-07-11.csv`
- `sponsor_register_2025-01-08.csv`
- `sponsor_register_2025-04-17.csv`
- `sponsor_register_2025-06-30.csv`
- `sponsor_register_2025-10-29.csv`
- `sponsor_register_2025-12-31.csv`

These snapshots load correctly and use the same main columns as the current file.

## Fork decision

**Decision: Plan A**

Reason: we found more than 2 historical snapshots, so survival / panel analysis is viable.

## Simple takeaway

We now have:

- the current sponsor register
- answers to the four recon questions
- enough historical snapshots to study change over time

That means the project can move forward with **Plan A**.

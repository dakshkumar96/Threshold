"""Prepare survival table and covariates for sponsor licence retention."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
PANEL_PATH = ROOT / "data" / "processed" / "sponsor_panel.parquet"
SUMMARY_PATH = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"
OUT_SURVIVAL = ROOT / "data" / "processed" / "survival_table.parquet"


def parse_rating(type_and_rating: object) -> str:
    text = str(type_and_rating or "").lower()
    if "a rating" in text:
        return "A"
    if "b rating" in text:
        return "B"
    return "other"


def parse_region(town: object, county: object) -> str:
    blob = f"{town or ''} {county or ''}".lower()
    if not blob.strip() or blob.strip() == "nan":
        return "unknown"
    if "london" in blob:
        return "london"
    if "scotland" in blob or any(
        x in blob
        for x in ("glasgow", "edinburgh", "aberdeen", "dundee", "inverness")
    ):
        return "scotland"
    if "wales" in blob or any(
        x in blob for x in ("cardiff", "swansea", "newport", "wrexham")
    ):
        return "wales"
    if (
        "northern ireland" in blob
        or "belfast" in blob
        or re.search(r"\bni\b", blob)
    ):
        return "ni"
    return "rest_england"


def first_seen_covariates(panel: pd.DataFrame) -> pd.DataFrame:
    """Take rating/region from each company's earliest snapshot row."""
    ordered = panel.sort_values(["company_key", "snapshot_date"])
    first = ordered.groupby("company_key", as_index=False).first()
    first["rating"] = first["Type & Rating"].map(parse_rating)
    first["region"] = [
        parse_region(t, c) for t, c in zip(first["Town/City"], first["County"])
    ]
    return first[["company_key", "rating", "region", "Organisation Name", "Town/City"]]


def build_survival_table(
    panel_path: Path = PANEL_PATH,
    summary_path: Path = SUMMARY_PATH,
) -> pd.DataFrame:
    panel = pd.read_parquet(panel_path)
    summary = pd.read_parquet(summary_path)
    latest = pd.to_datetime(panel["snapshot_date"]).max()

    cov = first_seen_covariates(panel)
    surv = summary.merge(cov, on="company_key", how="left")

    surv["start"] = pd.to_datetime(surv["first_seen"])
    surv["last_seen"] = pd.to_datetime(surv["last_seen"])
    surv["still_active"] = surv["still_active"].astype(bool)
    surv["event"] = (~surv["still_active"]).astype(int)
    # Still active: censored at latest snapshot. Exited: event at last_seen.
    surv["end"] = surv["last_seen"].where(~surv["still_active"], latest)
    surv["duration_days"] = (surv["end"] - surv["start"]).dt.days.clip(lower=0)
    surv["latest_snapshot"] = latest
    surv["rating"] = surv["rating"].fillna("other")
    surv["region"] = surv["region"].fillna("unknown")

    cols = [
        "company_key",
        "Organisation Name",
        "Town/City",
        "start",
        "end",
        "duration_days",
        "event",
        "still_active",
        "first_seen",
        "last_seen",
        "n_snapshots",
        "rating",
        "region",
        "latest_snapshot",
    ]
    return surv[cols]


def main() -> None:
    surv = build_survival_table()
    OUT_SURVIVAL.parent.mkdir(parents=True, exist_ok=True)
    surv.to_parquet(OUT_SURVIVAL, index=False)
    print(f"Saved {OUT_SURVIVAL} ({len(surv)} companies)")
    print("Events:", int(surv["event"].sum()), "Censored:", int((surv["event"] == 0).sum()))
    print(surv["rating"].value_counts().to_string())
    print(surv["region"].value_counts().to_string())


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

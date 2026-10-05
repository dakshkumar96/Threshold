"""Sponsor register tables the API reads. Each is loaded once per process."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import pandas as pd

from .config import RETENTION_PATH, SUMMARY_PATH


@lru_cache(maxsize=1)
def register_display() -> dict[str, str]:
    """{company_key: a readable name}, to check a job board's name against the register."""
    if not SUMMARY_PATH.exists():
        return {}
    df = pd.read_parquet(SUMMARY_PATH, columns=["company_key", "example_name"])
    return {
        str(r.company_key): str(r.example_name or r.company_key)
        for r in df.drop_duplicates("company_key").itertuples()
        if str(getattr(r, "company_key", "")).strip()
    }


@lru_cache(maxsize=1)
def retention_by_key() -> dict[str, dict[str, Any]]:
    """How long each company has been on the register, plus its stability score."""
    if not RETENTION_PATH.exists():
        return {}
    df = pd.read_parquet(RETENTION_PATH)
    if "company_key" not in df.columns:
        return {}
    return {
        str(row.company_key): {
            "duration_days": getattr(row, "duration_days", None),
            "stability_score": getattr(row, "stability_score", None),
            "still_active": getattr(row, "still_active", None),
            "last_seen": getattr(row, "last_seen", None),
        }
        for row in df.itertuples()
    }

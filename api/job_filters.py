"""Small DataFrame helpers shared by the API and the offline pipeline."""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

from .uk_location import is_uk

# "(Ref: 12345)" style suffixes that make the same ad look different per city.
_REF_SUFFIX = re.compile(r"\s*[\(\[](ref\.?|reference|job ref|job no)[^\)\]]*[\)\]]", re.I)


def as_float(val: Any) -> float | None:
    """A number, or None for missing, NaN or unparseable values."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def passes_min_salary(row: pd.Series, min_salary: float) -> bool:
    """Keep ads with no stated pay. Drop an ad only when its pay is known and too low."""
    known = as_float(row.get("salary_max"))
    if known is None:
        known = as_float(row.get("salary_min"))
    return True if known is None else known >= min_salary


def normalise_key(value: object) -> str:
    """Lower-case letters and digits only, for comparing names."""
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def normalise_title(title: object) -> str:
    """normalise_key without any "(Ref: ...)" suffix."""
    return normalise_key(_REF_SUFFIX.sub("", str(title or "")))


def filter_uk_df(jobs: pd.DataFrame) -> pd.DataFrame:
    """Keep ads whose location is in the UK."""
    if jobs.empty or "location" not in jobs.columns:
        return jobs
    mask = jobs["location"].fillna("").astype(str).map(is_uk)
    return jobs.loc[mask].reset_index(drop=True)


def collapse_repeat_listings(jobs: pd.DataFrame) -> pd.DataFrame:
    """One row per employer and title, however many cities it is posted in.

    The first listing is kept and `other_locations` counts the rest.
    """
    if jobs.empty:
        return jobs
    df = jobs.reset_index(drop=True).copy()
    first_seen: dict[tuple[str, str], int] = {}
    repeats: dict[int, int] = {}
    dropped: set[int] = set()
    for pos in range(len(df)):
        row = df.iloc[pos]
        key = (normalise_key(row.get("company_key")), normalise_title(row.get("title")))
        if key in first_seen:
            repeats[first_seen[key]] = repeats.get(first_seen[key], 0) + 1
            dropped.add(pos)
        else:
            first_seen[key] = pos

    df["other_locations"] = 0
    for pos, count in repeats.items():
        df.at[pos, "other_locations"] = count
    if dropped:
        df = df.iloc[[i for i in range(len(df)) if i not in dropped]].reset_index(drop=True)
    return df

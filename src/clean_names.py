"""Clean company names so the same firm matches across snapshots."""

from __future__ import annotations

import re

import pandas as pd

SUFFIXES = (" limited", " ltd", " plc", " llp", " inc", " company", " co")


def clean_company_name(name: object) -> str:
    """Lowercase, strip punctuation/legal suffixes, collapse spaces."""
    if pd.isna(name):
        return ""
    text = str(name).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    for suffix in SUFFIXES:
        if text.endswith(suffix):
            text = text[: -len(suffix)].strip()
    return text

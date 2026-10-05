"""Limits, thresholds and tuning knobs for the API.

Settings that come from the environment are read through `settings`, so the
list of environment variables lives in one file (`src/settings.py`).
"""

from __future__ import annotations

from pathlib import Path

import settings

ROOT = Path(__file__).resolve().parent.parent

# How many ads to pull per job board, and how many Reed ads get their full
# description fetched. Lower values make a search faster.
MAX_PER_SOURCE = settings.get_int("ANALYZE_MAX_PER_SOURCE", 100)
MAX_REED_ENRICH = settings.get_int("ANALYZE_MAX_REED_ENRICH", 30)
MAX_ATS_BOARDS = settings.get_int("ANALYZE_MAX_ATS_BOARDS", 12)

# A second, smaller search for the candidate's level ("graduate software
# engineer"). A plain role search rarely returns graduate or junior ads, so
# without it a graduate's list is mostly ads that state no level at all.
LEVEL_SEARCH_MAX_PER_SOURCE = settings.get_int("ANALYZE_LEVEL_SEARCH_MAX_PER_SOURCE", 50)
LEVEL_SEARCH_REED_ENRICH = settings.get_int("ANALYZE_LEVEL_SEARCH_REED_ENRICH", 10)
LEVEL_SEARCH_WORDS = {"graduate", "junior", "senior", "lead"}

# Calls per client address per minute, in each server process. Zero turns a limit off.
RATE_LIMIT_PER_MIN = settings.get_int("ANALYZE_RATE_LIMIT_PER_MIN", 6)
# A sponsor lookup scans the whole register, about a tenth of a second of CPU each.
SPONSOR_CHECK_RATE_LIMIT_PER_MIN = settings.get_int("SPONSOR_CHECK_RATE_LIMIT_PER_MIN", 30)
# Saved searches, preferences and the last result. A page view makes a few of these.
ACCOUNT_RATE_LIMIT_PER_MIN = settings.get_int("ACCOUNT_RATE_LIMIT_PER_MIN", 120)
# Searches one server process runs at the same time. Extra ones are turned away.
MAX_CONCURRENT_ANALYSES = settings.get_int("ANALYZE_MAX_CONCURRENT", 2)

MAX_CV_BYTES = 5 * 1024 * 1024
# The biggest request accepted: a 5 MB CV plus the other form fields.
MAX_REQUEST_BYTES = 6 * 1024 * 1024
MAX_CV_TEXT_CHARS = 80_000
# A real CV is one to three pages. This leaves room for a long academic one.
MAX_CV_PAGES = 10

# Skilled Worker salary floors (GBP a year). New entrants get the lower one.
SKILLED_WORKER_GENERAL_MIN = 41_700.0
SKILLED_WORKER_NEW_ENTRANT_MIN = 33_400.0

RETENTION_PATH = ROOT / "data" / "processed" / "sponsor_retention_scores.parquet"
SUMMARY_PATH = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"

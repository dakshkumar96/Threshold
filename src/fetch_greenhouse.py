"""Fetch jobs from public Greenhouse Job Board API for configured employer boards.

No API key required — see https://developers.greenhouse.io/job-board.html

Note: the live /analyze path uses the cache-driven ATS layer in api/ats_store.py
+ api/ats_probe.py (no probing in the request path). This module remains a
standalone/offline helper for curated GREENHOUSE_BOARDS lists.
"""

from __future__ import annotations

import html
import os
import re
import sys
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from clean_names import clean_company_name
from job_schema import load_env, utc_now_iso

GREENHOUSE_JOBS_URL = "https://boards-api.greenhouse.io/v1/boards/{board}/jobs"
GREENHOUSE_BOARD_URL = "https://boards-api.greenhouse.io/v1/boards/{board}"
MAX_JOBS_PER_BOARD = 50

# UK / visa-relevant tech sponsors with public Greenhouse boards (override via GREENHOUSE_BOARDS).
DEFAULT_BOARDS = [
    "stripe",
    "notion",
    "figma",
    "monzo",
    "datadog",
    "cloudflare",
    "spotify",
    "revolut",
]

BOARD_DISPLAY_NAMES: dict[str, str] = {
    "stripe": "Stripe",
    "notion": "Notion",
    "figma": "Figma",
    "monzo": "Monzo",
    "datadog": "Datadog",
    "cloudflare": "Cloudflare",
    "spotify": "Spotify",
    "revolut": "Revolut",
}


def _strip_html(raw: str) -> str:
    text = html.unescape(raw or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _parse_boards_env() -> list[str]:
    load_env()
    raw = os.getenv("GREENHOUSE_BOARDS", "").strip()
    if raw:
        return [b.strip().lower() for b in raw.split(",") if b.strip()]
    return list(DEFAULT_BOARDS)


def _board_display_name(board: str, metadata_name: str | None = None) -> str:
    if metadata_name:
        return metadata_name.strip()
    return BOARD_DISPLAY_NAMES.get(board.lower(), board.replace("-", " ").title())


def _fetch_board_metadata(board: str) -> str | None:
    try:
        r = requests.get(GREENHOUSE_BOARD_URL.format(board=board), timeout=30)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return (r.json().get("name") or "").strip() or None
    except Exception:
        return None


def _matches_role(title: str, description: str, role: str) -> bool:
    role_norm = role.lower().strip()
    if not role_norm:
        return True
    title_lower = (title or "").lower()
    if role_norm in title_lower:
        return True
    combined = f"{title} {description}".lower()
    tokens = [t for t in re.split(r"\s+", role_norm) if t]
    return bool(tokens) and all(t in combined for t in tokens)


def _fetch_board_jobs(board: str) -> list[dict]:
    response = requests.get(
        GREENHOUSE_JOBS_URL.format(board=board),
        params={"content": "true"},
        timeout=60,
    )
    if response.status_code == 404:
        return []
    response.raise_for_status()
    return response.json().get("jobs") or []


def fetch_greenhouse_jobs(
    role: str,
    max_jobs: int = 250,
    max_per_board: int = MAX_JOBS_PER_BOARD,
) -> tuple[pd.DataFrame, int]:
    """
    Fetch jobs from configured Greenhouse boards, filter by role client-side.

    Returns (dataframe, number of boards successfully queried).
    Public boards API — no API key required.
    """
    boards = _parse_boards_env()
    rows: list[dict] = []
    fetched_at = utc_now_iso()
    boards_queried = 0

    for board in boards:
        if len(rows) >= max_jobs:
            break
        try:
            company_meta = _fetch_board_metadata(board)
            jobs = _fetch_board_jobs(board)
            boards_queried += 1
        except Exception as exc:
            print(f"Greenhouse board '{board}' skipped: {exc}")
            continue

        company_raw = _board_display_name(board, company_meta)
        company_key = clean_company_name(company_raw)
        board_matches = 0

        for job in jobs:
            if len(rows) >= max_jobs or board_matches >= max_per_board:
                break

            title = job.get("title") or ""
            content_html = job.get("content") or ""
            description = _strip_html(content_html)
            has_full = bool(content_html.strip())

            if not _matches_role(title, description, role):
                continue

            location_obj = job.get("location") or {}
            location = location_obj.get("name") if isinstance(location_obj, dict) else ""

            rows.append(
                {
                    "source": "greenhouse",
                    "source_job_id": str(job.get("id", "")),
                    "role_query": role,
                    "title": title,
                    "company_raw": company_raw,
                    "company_key": company_key,
                    "location": location or "",
                    "salary_min": None,
                    "salary_max": None,
                    "description": description,
                    "url": job.get("absolute_url") or "",
                    "fetched_at": fetched_at,
                    "description_full": has_full,
                }
            )
            board_matches += 1

    return pd.DataFrame(rows), boards_queried


if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "data analyst"
    df, n_boards = fetch_greenhouse_jobs(role)
    print(f"Greenhouse: {len(df)} jobs from {n_boards} boards for '{role}'")
    if not df.empty:
        sample = df.iloc[0]
        print(f"  sample: {sample['title']!r} @ {sample['company_raw']}")
        print(f"  description length: {len(str(sample['description']))}")

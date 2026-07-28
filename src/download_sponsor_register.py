"""
Download the UK Home Office Register of Licensed Sponsors (workers).

Saves into data/raw/ with the register date in the filename, e.g.:
  data/raw/sponsor_register_2026-07-28.csv
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import requests

# Official GOV.UK page that hosts the latest CSV
PAGE_URL = (
    "https://www.gov.uk/government/publications/"
    "register-of-licensed-sponsors-workers"
)

# Project root = two levels up from this file (src/ -> project)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"

# Match the dated CSV filename on GOV.UK, e.g.
# SP_-_Worker_and_Temporary_Worker_Web_Register_-_2026-07-28.csv
FILENAME_RE = re.compile(
    r"SP_-_Worker_and_Temporary_Worker_Web_Register_-_(\d{4}-\d{2}-\d{2})\.csv",
    re.IGNORECASE,
)
ASSET_URL_RE = re.compile(
    r"https://assets\.publishing\.service\.gov\.uk[^\"'\s>]+\.csv",
    re.IGNORECASE,
)


def find_latest_csv(page_html: str) -> tuple[str, str]:
    """
    Find the download URL and the date string from the GOV.UK page HTML.

    Returns:
        (csv_url, date_str) e.g. ("https://assets.../....csv", "2026-07-28")
    """
    urls = ASSET_URL_RE.findall(page_html)
    if not urls:
        raise RuntimeError("Could not find a CSV download link on the GOV.UK page.")

    # Prefer the Worker register file that includes a date in the name
    for url in urls:
        match = FILENAME_RE.search(url)
        if match:
            return url, match.group(1)

    # Fallback: first CSV link found; date unknown so use "unknown"
    return urls[0], "unknown"


def download_register() -> Path:
    """Download the register CSV into data/raw/ and return the saved path."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching page: {PAGE_URL}")
    page = requests.get(PAGE_URL, timeout=60)
    page.raise_for_status()

    csv_url, date_str = find_latest_csv(page.text)
    out_path = RAW_DIR / f"sponsor_register_{date_str}.csv"

    if out_path.exists():
        print(f"Already downloaded: {out_path}")
        print("Delete the file first if you want to re-download.")
        return out_path

    print(f"Downloading CSV: {csv_url}")
    print(f"Saving to: {out_path}")

    with requests.get(csv_url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with out_path.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if chunk:
                    f.write(chunk)

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Done. File size: {size_mb:.1f} MB")
    return out_path


if __name__ == "__main__":
    try:
        download_register()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

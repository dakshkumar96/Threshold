"""
Hunt for historical snapshots of the sponsor register via the Wayback Machine.

How it works:
1. Ask the Wayback CDX API for archived copies of the GOV.UK publication page.
2. For each chosen snapshot, open the archived page and find the CSV link.
3. Download the CSV through the Wayback Machine into data/raw/snapshots/.

Usage:
    python src/hunt_snapshots.py --list          # just show what exists
    python src/hunt_snapshots.py --download 6    # download ~6 spread-out snapshots
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from pathlib import Path

import requests

PAGE_URL = (
    "https://www.gov.uk/government/publications/"
    "register-of-licensed-sponsors-workers"
)
CDX_URL = "http://web.archive.org/cdx/search/cdx"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SNAP_DIR = PROJECT_ROOT / "data" / "raw" / "snapshots"

CSV_LINK_RE = re.compile(
    r"https?://[^\"'\s]+?\.csv", re.IGNORECASE
)
DATE_IN_NAME_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")

session = requests.Session()
session.headers["User-Agent"] = "uk-sponsor-analysis recon (personal project)"


def list_page_snapshots() -> list[str]:
    """Return Wayback timestamps of archived publication pages (one per month)."""
    r = session.get(
        CDX_URL,
        params={
            "url": PAGE_URL.replace("https://", ""),
            "output": "json",
            "collapse": "timestamp:6",  # one snapshot per month
            "fl": "timestamp",
            "filter": "statuscode:200",
        },
        timeout=120,
    )
    r.raise_for_status()
    rows = r.json()
    return [row[0] for row in rows[1:]]


def find_csv_in_snapshot(timestamp: str) -> str | None:
    """Open one archived page and return the register CSV URL, if present."""
    url = f"http://web.archive.org/web/{timestamp}/{PAGE_URL}"
    try:
        r = session.get(url, timeout=120)
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    for link in CSV_LINK_RE.findall(r.text):
        if "worker" in link.lower() and "web.archive.org" not in link.lower():
            return link
        if "worker" in link.lower():
            return link
    return None


def download_csv(timestamp: str, csv_url: str) -> Path | None:
    """Download the archived CSV. Returns saved path, or None if it failed."""
    # Strip any wayback prefix so we can request the raw archived file (id_)
    clean = re.sub(r"^https?://web\.archive\.org/web/\d+(?:id_)?/", "", csv_url)
    raw_url = f"http://web.archive.org/web/{timestamp}id_/{clean}"

    match = DATE_IN_NAME_RE.search(clean)
    date_str = match.group(1) if match else timestamp[:8]
    out_path = SNAP_DIR / f"sponsor_register_{date_str}.csv"
    if out_path.exists():
        print(f"  already have {out_path.name}")
        return out_path

    try:
        with session.get(raw_url, stream=True, timeout=300) as r:
            if r.status_code != 200:
                print(f"  no archived file ({r.status_code})")
                return None
            SNAP_DIR.mkdir(parents=True, exist_ok=True)
            with out_path.open("wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 256):
                    if chunk:
                        f.write(chunk)
    except requests.RequestException as exc:
        print(f"  download failed: {exc}")
        return None

    size_mb = out_path.stat().st_size / (1024 * 1024)
    if size_mb < 0.5:  # tiny file = probably an error page, not the register
        print(f"  file too small ({size_mb:.2f} MB), discarding")
        out_path.unlink()
        return None
    print(f"  saved {out_path.name} ({size_mb:.1f} MB)")
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="list snapshots only")
    parser.add_argument("--download", type=int, default=0, metavar="N",
                        help="download about N snapshots spread over time")
    args = parser.parse_args()

    print("Asking Wayback Machine for archived pages...")
    stamps = list_page_snapshots()
    print(f"Found {len(stamps)} archived pages "
          f"({stamps[0][:8]} to {stamps[-1][:8]})")

    if args.list or not args.download:
        for ts in stamps:
            print(" ", ts[:8])
        return

    # Pick N timestamps spread across the available range, newest included
    n = min(args.download, len(stamps))
    step = max(1, len(stamps) // n)
    chosen = stamps[::-1][::step][:n]  # newest first, spread out

    saved = []
    for ts in chosen:
        print(f"Snapshot {ts[:8]}:")
        csv_url = find_csv_in_snapshot(ts)
        if not csv_url:
            print("  no CSV link found on archived page")
            continue
        path = download_csv(ts, csv_url)
        if path:
            saved.append(path)
        time.sleep(2)  # be polite to the archive

    print(f"\nDone. {len(saved)} snapshot(s) in {SNAP_DIR}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

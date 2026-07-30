"""
Revalidate all live ATS cache rows against the register's display names.

  pass   → status stays 'live'
  fail   → status = 'unverified'
  review → status = 'unverified'  (fail-closed)

Both fail and review are written to data/processed/ats_revalidation_review.csv.
A full DB backup is written to data/ats_map.db.bak before any writes.

Usage:
    python scripts/revalidate_ats_map.py [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import shutil
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402

from api import ats_store  # noqa: E402
from name_verify import verify_identity  # noqa: E402

SUMMARY_PATH = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"
SEED_PATH = ROOT / "data" / "ats_seed.json"
DB_PATH = ats_store.DB_PATH
BAK_PATH = DB_PATH.parent / (DB_PATH.name + ".bak")
REVIEW_CSV = ROOT / "data" / "processed" / "ats_revalidation_review.csv"


def load_seed_keys() -> set[str]:
    """Return the set of company_keys that are hand-verified in the seed file."""
    if not SEED_PATH.exists():
        return set()
    import json
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    return set(data.keys())


def load_register_display() -> dict[str, str]:
    """Return {company_key: example_name} for the full register."""
    df = pd.read_parquet(SUMMARY_PATH, columns=["company_key", "example_name"])
    return {
        str(row.company_key): str(row.example_name or row.company_key)
        for row in df.itertuples(index=False)
        if str(row.company_key).strip()
    }


def load_live_rows(db_path: Path = DB_PATH) -> list[dict]:
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT company_key, published_name, ats_provider, board_token,
                   match_score, has_uk_jobs
            FROM ats_map
            WHERE status = 'live' AND published_name IS NOT NULL
            """
        ).fetchall()
    return [dict(r) for r in rows]


def ensure_verified_at_column(db_path: Path = DB_PATH) -> None:
    with sqlite3.connect(db_path) as conn:
        cols = {
            r[1]
            for r in conn.execute("PRAGMA table_info(ats_map)").fetchall()
        }
        if "verified_at" not in cols:
            conn.execute("ALTER TABLE ats_map ADD COLUMN verified_at TEXT")


def demote(company_key: str, db_path: Path = DB_PATH) -> None:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "UPDATE ats_map SET status='unverified', last_checked=? WHERE company_key=?",
            (now, company_key),
        )


def mark_verified(company_key: str, db_path: Path = DB_PATH) -> None:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "UPDATE ats_map SET verified_at=? WHERE company_key=?",
            (now, company_key),
        )


def print_stats(label: str, db_path: Path = DB_PATH) -> None:
    print(f"\n{label}:")
    print(f"  {ats_store.stats(db_path=db_path)}")


def main(dry_run: bool = False) -> None:
    if not SUMMARY_PATH.exists():
        sys.exit(f"Register parquet not found: {SUMMARY_PATH}")
    if not DB_PATH.exists():
        sys.exit(f"ATS DB not found: {DB_PATH}")

    print("Loading register display names…")
    display = load_register_display()
    print(f"  {len(display):,} register keys loaded")

    seed_keys = load_seed_keys()
    print(f"  {len(seed_keys)} hand-verified seed keys (will skip)")

    print("Loading live ATS rows…")
    rows = load_live_rows()
    print(f"  {len(rows):,} live rows to revalidate ({len([r for r in rows if r['company_key'] in seed_keys])} are seed entries, skipped)")

    if not dry_run:
        print(f"\nBacking up DB → {BAK_PATH}")
        shutil.copy2(DB_PATH, BAK_PATH)
        ensure_verified_at_column()

    print_stats("Before", DB_PATH)

    verdicts: dict[str, int] = {"pass": 0, "review": 0, "fail": 0, "no_register": 0}
    review_rows: list[dict] = []

    for row in rows:
        ck = row["company_key"]
        published = row["published_name"] or ck

        # Seed entries are hand-verified — skip and mark as pass.
        if ck in seed_keys:
            verdicts["pass"] = verdicts.get("pass", 0) + 1
            if not dry_run:
                mark_verified(ck)
            continue

        register_display = display.get(ck)

        if not register_display:
            verdicts["no_register"] += 1
            review_rows.append({
                "company_key": ck,
                "published_name": published,
                "register_name": "",
                "verdict": "no_register",
                "score": "",
                "cov_note": "key not in register — likely orphaned cache row",
                "ats_provider": row.get("ats_provider"),
                "board_token": row.get("board_token"),
            })
            if not dry_run:
                demote(ck)
            continue

        verdict, score = verify_identity(register_display, published)
        verdicts[verdict] = verdicts.get(verdict, 0) + 1

        if verdict != "pass":
            review_rows.append({
                "company_key": ck,
                "published_name": published,
                "register_name": register_display,
                "verdict": verdict,
                "score": round(score, 1),
                "cov_note": "",
                "ats_provider": row.get("ats_provider"),
                "board_token": row.get("board_token"),
            })
            if not dry_run:
                demote(ck)
        elif not dry_run:
            mark_verified(ck)

    print(f"\nRevalidation results: {verdicts}")
    demoted = verdicts["review"] + verdicts["fail"] + verdicts["no_register"]
    print(f"  Demoted to 'unverified': {demoted}")
    print(f"  Kept as 'live': {verdicts['pass']}")

    if not dry_run:
        REVIEW_CSV.parent.mkdir(parents=True, exist_ok=True)
        with REVIEW_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "company_key", "published_name", "register_name",
                    "verdict", "score", "cov_note", "ats_provider", "board_token",
                ],
            )
            writer.writeheader()
            writer.writerows(review_rows)
        print(f"\nReview CSV written → {REVIEW_CSV} ({len(review_rows)} rows)")
        print_stats("After", DB_PATH)
    else:
        print(f"\n[DRY RUN] Would demote {demoted} rows; no DB changes made.")
        print(f"[DRY RUN] Would write {len(review_rows)} rows to {REVIEW_CSV}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Revalidate ATS cache identity matches")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without writing to the DB",
    )
    args = parser.parse_args()
    main(dry_run=args.dry_run)

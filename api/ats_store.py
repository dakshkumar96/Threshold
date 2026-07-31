"""SQLite cache of employer → ATS board mappings (data/ats_map.db)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "ats_map.db"
SEED_PATH = ROOT / "data" / "ats_seed.json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS ats_map (
    company_key     TEXT PRIMARY KEY,
    ats_provider    TEXT,
    board_token     TEXT,
    published_name  TEXT,
    match_score     INTEGER,
    has_uk_jobs     INTEGER DEFAULT 0,
    status          TEXT,
    first_seen      TEXT,
    last_checked    TEXT,
    last_ok         TEXT
);
CREATE INDEX IF NOT EXISTS idx_status ON ats_map(status);
"""


def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get(company_key: str, db_path: Path = DB_PATH) -> dict | None:
    """Return cached mapping or None if never probed."""
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM ats_map WHERE company_key = ?", (company_key,)
        ).fetchone()
    return dict(row) if row else None


def get_many(company_keys: list[str], db_path: Path = DB_PATH) -> dict[str, dict]:
    """Batch lookup. Returns {company_key: row} for keys that exist."""
    if not company_keys:
        return {}
    placeholders = ",".join("?" * len(company_keys))
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            f"SELECT * FROM ats_map WHERE company_key IN ({placeholders})",
            company_keys,
        ).fetchall()
    return {r["company_key"]: dict(r) for r in rows}


def upsert_hit(
    company_key: str,
    ats: str,
    token: str,
    published_name: str,
    match_score: int,
    has_uk: bool,
    db_path: Path = DB_PATH,
) -> None:
    now = _now()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO ats_map (
                company_key, ats_provider, board_token,
                published_name, match_score, has_uk_jobs, status,
                first_seen, last_checked, last_ok
            )
            VALUES (?,?,?,?,?,?,'live',?,?,?)
            ON CONFLICT(company_key) DO UPDATE SET
                ats_provider=excluded.ats_provider,
                board_token=excluded.board_token,
                published_name=excluded.published_name,
                match_score=excluded.match_score,
                has_uk_jobs=excluded.has_uk_jobs,
                status='live',
                last_checked=excluded.last_checked,
                last_ok=excluded.last_ok
            """,
            (
                company_key,
                ats,
                token,
                published_name,
                match_score,
                int(has_uk),
                now,
                now,
                now,
            ),
        )


def upsert_miss(company_key: str, db_path: Path = DB_PATH) -> None:
    """No ATS found. Cache the miss so we never probe again."""
    now = _now()
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO ats_map (company_key, status, first_seen, last_checked)
            VALUES (?,'none',?,?)
            ON CONFLICT(company_key) DO UPDATE SET
                status='none', last_checked=excluded.last_checked
            """,
            (company_key, now, now),
        )


def mark_stale(company_key: str, db_path: Path = DB_PATH) -> None:
    """Board used to work, now 404s. Falls back to fuzzy matching."""
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "UPDATE ats_map SET status='stale', last_checked=? WHERE company_key=?",
            (_now(), company_key),
        )


def load_seed(
    seed_path: Path | str = SEED_PATH, db_path: Path = DB_PATH
) -> int:
    """Import the manual seed file. Idempotent — does not overwrite learned rows."""
    p = Path(seed_path)
    if not p.exists():
        return 0
    seed = json.loads(p.read_text(encoding="utf-8"))
    n = 0
    for company_key, cfg in seed.items():
        if get(company_key, db_path=db_path):
            continue
        upsert_hit(
            company_key,
            cfg["ats"],
            cfg["token"],
            cfg.get("published_name", company_key),
            100,
            True,
            db_path=db_path,
        )
        n += 1
    return n


def stats(db_path: Path = DB_PATH) -> dict[str, int]:
    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT status, COUNT(*) FROM ats_map GROUP BY status"
        ).fetchall()
    return {str(status): int(count) for status, count in rows}

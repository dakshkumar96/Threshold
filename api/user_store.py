"""SQLite persistence for signed-in user profile data."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "user_data.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS saved_searches (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT NOT NULL,
              role TEXT NOT NULL,
              experience TEXT,
              min_salary REAL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_searches(user_id);

            CREATE TABLE IF NOT EXISTS user_preferences (
              user_id TEXT PRIMARY KEY,
              default_experience TEXT,
              locations TEXT,
              email_alerts INTEGER NOT NULL DEFAULT 0,
              cv_filename TEXT,
              is_new_entrant INTEGER NOT NULL DEFAULT 0,
              updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS last_match_snapshot (
              user_id TEXT PRIMARY KEY,
              role TEXT,
              score REAL,
              payload_json TEXT NOT NULL,
              updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            """
        )
        # Migrate older DBs that predate is_new_entrant.
        cols = {
            r[1]
            for r in conn.execute("PRAGMA table_info(user_preferences)").fetchall()
        }
        if "is_new_entrant" not in cols:
            conn.execute(
                "ALTER TABLE user_preferences "
                "ADD COLUMN is_new_entrant INTEGER NOT NULL DEFAULT 0"
            )


def list_saved_searches(user_id: str) -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, role, experience, min_salary, created_at FROM saved_searches "
            "WHERE user_id = ? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_saved_search(
    user_id: str,
    role: str,
    experience: str | None = None,
    min_salary: float | None = None,
) -> dict[str, Any]:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO saved_searches (user_id, role, experience, min_salary) "
            "VALUES (?, ?, ?, ?)",
            (user_id, role.strip(), experience, min_salary),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, role, experience, min_salary, created_at FROM saved_searches "
            "WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()
    return dict(row)


def delete_saved_search(user_id: str, search_id: int) -> bool:
    with _connect() as conn:
        cur = conn.execute(
            "DELETE FROM saved_searches WHERE id = ? AND user_id = ?",
            (search_id, user_id),
        )
        conn.commit()
        return cur.rowcount > 0


def get_preferences(user_id: str) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT user_id, default_experience, locations, email_alerts, "
            "cv_filename, is_new_entrant, updated_at "
            "FROM user_preferences WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return {
            "user_id": user_id,
            "default_experience": "mid",
            "locations": "",
            "email_alerts": False,
            "cv_filename": None,
            "is_new_entrant": False,
            "updated_at": None,
        }
    d = dict(row)
    d["email_alerts"] = bool(d.get("email_alerts"))
    d["is_new_entrant"] = bool(d.get("is_new_entrant"))
    return d


def upsert_preferences(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    current = get_preferences(user_id)
    experience = data.get("default_experience", current["default_experience"])
    locations = data.get("locations", current["locations"] or "")
    email_alerts = 1 if data.get("email_alerts", current["email_alerts"]) else 0
    cv_filename = data.get("cv_filename", current.get("cv_filename"))
    is_new_entrant = (
        1 if data.get("is_new_entrant", current.get("is_new_entrant")) else 0
    )
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO user_preferences
              (user_id, default_experience, locations, email_alerts, cv_filename,
               is_new_entrant, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
              default_experience = excluded.default_experience,
              locations = excluded.locations,
              email_alerts = excluded.email_alerts,
              cv_filename = excluded.cv_filename,
              is_new_entrant = excluded.is_new_entrant,
              updated_at = datetime('now')
            """,
            (user_id, experience, locations, email_alerts, cv_filename, is_new_entrant),
        )
        conn.commit()
    return get_preferences(user_id)


def get_last_match(user_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT user_id, role, score, payload_json, updated_at "
            "FROM last_match_snapshot WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    payload = json.loads(row["payload_json"])
    return {
        "user_id": row["user_id"],
        "role": row["role"],
        "score": row["score"],
        "updated_at": row["updated_at"],
        **payload,
    }


def put_last_match(user_id: str, body: dict[str, Any]) -> dict[str, Any]:
    role = str(body.get("role") or "")
    score = body.get("score")
    payload = {
        "gaps": body.get("gaps") or [],
        "sponsors": body.get("sponsors") or [],
        "top_companies": body.get("top_companies") or [],
        "requirement_frequencies": body.get("requirement_frequencies") or [],
        "where_you_are": body.get("where_you_are"),
        "jobs_total": body.get("jobs_total"),
        "sponsor_count": body.get("sponsor_count"),
    }
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO last_match_snapshot (user_id, role, score, payload_json, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
              role = excluded.role,
              score = excluded.score,
              payload_json = excluded.payload_json,
              updated_at = datetime('now')
            """,
            (user_id, role, score, json.dumps(payload)),
        )
        conn.commit()
    return get_last_match(user_id) or {}

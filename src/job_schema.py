"""Shared helpers for job fetch scripts."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def load_env() -> None:
    load_dotenv(PROJECT_ROOT / ".env")


def role_slug(role: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", role.lower().strip())
    return slug.strip("_") or "role"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

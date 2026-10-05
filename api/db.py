"""How the two small SQLite stores open their database."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any


@contextmanager
def connect(path: Path, *, row_factory: Any = None) -> Iterator[sqlite3.Connection]:
    """Open the database, commit on success, roll back on error, and always close it.

    `with sqlite3.connect(...)` alone only ends the transaction. The connection,
    and on Windows the lock on the file, then lives until it is garbage collected.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    if row_factory is not None:
        conn.row_factory = row_factory
    try:
        with conn:
            yield conn
    finally:
        conn.close()

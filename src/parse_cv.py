"""Extract text from CV PDF (and plain text fallback)."""

from __future__ import annotations

import io
from pathlib import Path
from typing import BinaryIO


def _extract(source: str | Path | BinaryIO) -> str:
    import pdfplumber

    chunks: list[str] = []
    with pdfplumber.open(source) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            if t.strip():
                chunks.append(t)
    return "\n".join(chunks).strip()


def extract_text_from_pdf(path: str | Path) -> str:
    return _extract(Path(path))


def extract_text_from_bytes(data: bytes, filename: str = "cv.pdf") -> str:
    """Parse uploaded file bytes. PDF via pdfplumber; .txt as utf-8."""
    name = filename.lower()
    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore").strip()
    if name.endswith(".pdf") or data[:4] == b"%PDF":
        # In-memory buffer avoids Windows temp-file locking
        return _extract(io.BytesIO(data))
    return data.decode("utf-8", errors="ignore").strip()

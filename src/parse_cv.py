"""Extract text from CV PDF (and plain text fallback)."""

from __future__ import annotations

import unicodedata
from pathlib import Path


def _extract(data: bytes) -> str:
    try:
        import pymupdf
    except ImportError:
        # Older PyMuPDF releases (the newest pip will install on Python 3.8,
        # which the Oracle deploy target runs) only expose the legacy name.
        import fitz as pymupdf

    # PyMuPDF uses the PDF's own internal word/character layout rather than
    # inferring word gaps from a tunable x-distance (pdfplumber's approach),
    # which silently merges adjacent words into one ("ComputerScience...")
    # on PDFs that position glyphs precisely without a literal space
    # character between them - common with LaTeX output (Carlito/Computer
    # Modern CVs especially). Confirmed via a reproduction test: the exact
    # merge-no-space layout that breaks pdfplumber's default extraction
    # extracts correctly with PyMuPDF.
    chunks: list[str] = []
    with pymupdf.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            t = page.get_text("text") or ""
            if t.strip():
                chunks.append(t)
    text = "\n".join(chunks).strip()
    # Some CV fonts (exported from Canva/Word/LaTeX) use ligature glyphs
    # ("ﬁ", "ﬂ", ...) that PyMuPDF passes through as the raw ligature
    # codepoint rather than expanding it; NFKC folds these back to plain
    # ASCII so downstream skill/keyword matching does not silently miss
    # words like "office" -> "oce".
    return unicodedata.normalize("NFKC", text)


def extract_text_from_pdf(path: str | Path) -> str:
    return _extract(Path(path).read_bytes())


def extract_text_from_bytes(data: bytes, filename: str = "cv.pdf") -> str:
    """Parse uploaded file bytes. PDF via PyMuPDF; .txt as utf-8."""
    name = filename.lower()
    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore").strip()
    if name.endswith(".pdf") or data[:4] == b"%PDF":
        return _extract(data)
    return data.decode("utf-8", errors="ignore").strip()

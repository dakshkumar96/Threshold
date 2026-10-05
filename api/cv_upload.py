"""Turning pasted text or an uploaded file into the CV's plain text."""

from __future__ import annotations

import logging
import re

from fastapi import HTTPException, UploadFile

from parse_cv import CvTooLongError, extract_text_from_bytes

from .config import MAX_CV_BYTES, MAX_CV_PAGES, MAX_CV_TEXT_CHARS

logger = logging.getLogger(__name__)

EMPTY_PDF_MSG = (
    "This PDF has no text we can read. It is probably a scan or a photo. "
    "Save it again as a text-based PDF and try again."
)
GARBLED_PDF_MSG = (
    "The text in this PDF is scrambled, so we cannot read it reliably. "
    "Try exporting it again, or save it as a different PDF or text file."
)

# Some fonts have no Unicode mapping, so a PDF "extracts" as placeholder
# characters that would pass for real CV text. Each extractor shows them in
# its own way: pdfplumber writes "(cid:12)", PyMuPDF writes raw control codes.
_CID_PLACEHOLDER_RE = re.compile(r"\(cid:\d+\)")
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_MAX_GARBLED_SHARE = 0.15


def _looks_garbled(text: str) -> bool:
    bad = len(_CID_PLACEHOLDER_RE.findall(text)) + len(_CONTROL_CHAR_RE.findall(text))
    words = max(len(text.split()), 1)
    return bad > 0 and bad / words > _MAX_GARBLED_SHARE


def _check_length(text: str) -> None:
    """Pasted text and text read from a file have the same limit, so a big file cannot keep the server busy."""
    if len(text) > MAX_CV_TEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"CV text is too long (max {MAX_CV_TEXT_CHARS:,} characters).",
        )


def read_cv_text(cv_text: str, cv_file: UploadFile | None) -> str:
    """The CV as plain text, or "" when none was given.

    An uploaded file wins over pasted text. An empty upload counts as no CV.
    """
    text = (cv_text or "").strip()
    _check_length(text)
    if cv_file is None or not cv_file.filename:
        return text

    name = cv_file.filename.lower()
    if not name.endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="CV must be a PDF or TXT file.")
    raw = cv_file.file.read(MAX_CV_BYTES + 1)
    if len(raw) > MAX_CV_BYTES:
        raise HTTPException(status_code=400, detail="CV file is too large (max 5 MB).")
    if not raw:
        return text

    try:
        extracted = extract_text_from_bytes(raw, cv_file.filename, max_pages=MAX_CV_PAGES)
    except CvTooLongError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"That PDF has {exc.pages} pages. We read CVs of up to {exc.limit} pages.",
        ) from None
    except Exception:  # an unreadable file is the user's problem, not a server error
        logger.warning("Could not read an uploaded CV", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail="We could not read that CV. Please use a text-based PDF and not a scan.",
        ) from None
    _check_length(extracted)
    if name.endswith(".pdf"):
        if not extracted.strip():
            raise HTTPException(status_code=400, detail=EMPTY_PDF_MSG)
        if _looks_garbled(extracted):
            raise HTTPException(status_code=400, detail=GARBLED_PDF_MSG)
    return extracted

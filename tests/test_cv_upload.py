"""CV uploads have limits on size, pages and text, so one request cannot keep the server busy (H2)."""

from __future__ import annotations

import io
import time

import pymupdf
import pytest
import requests
from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient

from api.cv_upload import read_cv_text
from api.main import create_app

LIMIT = 80_000


def make_pdf(pages: int, text: str = "Python SQL dashboards") -> bytes:
    doc = pymupdf.open()
    for number in range(pages):
        doc.new_page().insert_text((72, 72), f"{text} page {number}")
    data = doc.tobytes()
    doc.close()
    return data


def blank_pdf() -> bytes:
    doc = pymupdf.open()
    doc.new_page()
    data = doc.tobytes()
    doc.close()
    return data


def upload(name: str, data: bytes) -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=name)


def refused(cv_text: str, cv_file) -> HTTPException:
    with pytest.raises(HTTPException) as caught:
        read_cv_text(cv_text, cv_file)
    assert caught.value.status_code == 400
    return caught.value


# --- pages -------------------------------------------------------------------------------------


def test_a_normal_cv_still_reads():
    text = read_cv_text("", upload("cv.pdf", make_pdf(2)))
    assert "Python SQL dashboards page 0" in text and "page 1" in text


def test_a_ten_page_pdf_is_accepted():
    assert "page 9" in read_cv_text("", upload("cv.pdf", make_pdf(10)))


def test_an_eleven_page_pdf_is_refused_with_a_clear_message():
    problem = refused("", upload("cv.pdf", make_pdf(11)))
    assert problem.detail == "That PDF has 11 pages. We read CVs of up to 10 pages."


def test_a_pdf_with_hundreds_of_pages_is_refused_without_reading_them():
    doc = pymupdf.open()
    for _ in range(300):
        doc.new_page()
    data = doc.tobytes(garbage=4, deflate=True)
    started = time.perf_counter()
    problem = refused("", upload("cv.pdf", data))
    assert time.perf_counter() - started < 3
    assert "300 pages" in problem.detail


# --- text ----------------------------------------------------------------------------------------


def test_pasted_text_at_the_limit_is_accepted_and_one_over_is_refused():
    assert len(read_cv_text("a" * LIMIT, None)) == LIMIT
    assert "too long" in refused("a" * (LIMIT + 1), None).detail


def test_text_read_from_a_file_has_the_same_limit():
    assert len(read_cv_text("", upload("cv.txt", b"a" * LIMIT))) == LIMIT
    problem = refused("", upload("cv.txt", b"a" * (LIMIT + 1)))
    assert problem.detail == f"CV text is too long (max {LIMIT:,} characters)."


def test_a_five_megabyte_text_file_is_refused_at_once():
    """Before the limit this took about two minutes of server time."""
    started = time.perf_counter()
    refused("", upload("cv.txt", b"Python SQL pandas dashboards " * 170_000))  # 4.9 MB
    assert time.perf_counter() - started < 2


def test_text_with_bad_bytes_is_still_read():
    assert "Python" in read_cv_text("", upload("cv.txt", b"Python \xff\xfe developer"))


# --- the size limit and the other checks keep working ----------------------------------------------


def test_the_other_checks_are_unchanged():
    assert read_cv_text("  pasted  ", None) == "pasted"
    assert read_cv_text("", upload("cv.pdf", b"")) == ""
    assert refused("", upload("cv.docx", b"PK")).detail == "CV must be a PDF or TXT file."
    assert refused("", upload("cv.txt", b"a" * (5 * 1024 * 1024 + 1))).detail == "CV file is too large (max 5 MB)."
    assert "could not read" in refused("", upload("cv.pdf", b"not a pdf")).detail
    assert "no text we can read" in refused("", upload("cv.pdf", blank_pdf())).detail


# --- through the API -------------------------------------------------------------------------------


def test_an_oversized_cv_is_refused_before_any_search(monkeypatch):
    def no_network(*args, **kwargs):
        raise AssertionError("the search must not start for a CV that is refused")

    monkeypatch.setattr(requests, "get", no_network)
    monkeypatch.setattr(requests, "post", no_network)
    client = TestClient(create_app())
    response = client.post(
        "/analyze",
        data={"role": "Data Analyst"},
        files={"cv_file": ("cv.txt", b"Python SQL pandas dashboards " * 170_000, "text/plain")},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": f"CV text is too long (max {LIMIT:,} characters)."}

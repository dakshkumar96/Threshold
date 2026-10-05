"""A failed call to a job board must not put the board's API key in a response or a log (H1)."""

from __future__ import annotations

import logging

import pytest
import requests
from fastapi.testclient import TestClient

from api.main import create_app
from http_errors import SourceError, describe, get_json

MARKER = "SECRET_KEY_MARKER"
ADZUNA_URL = f"https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=ID123&app_key={MARKER}&what=analyst"


def real_response(status: int, url: str, body: bytes = b"{}") -> requests.Response:
    """A genuine requests.Response, so its error text is the real thing."""
    response = requests.Response()
    response.status_code = status
    response.reason = {401: "Unauthorized", 429: "Too Many Requests", 503: "Service Unavailable"}.get(status, "Error")
    response._content = body
    response.url = url
    return response


# --- the helper ------------------------------------------------------------------------------


def test_the_library_really_does_put_the_key_in_its_error_text():
    """If this ever stops being true the helper is no longer needed, but today it is."""
    with pytest.raises(requests.HTTPError) as caught:
        real_response(401, ADZUNA_URL).raise_for_status()
    assert MARKER in str(caught.value)


def test_describe_never_includes_the_address():
    http_error = requests.HTTPError("boom", response=real_response(429, ADZUNA_URL))
    connection_error = requests.ConnectionError(f"Max retries exceeded with url: {ADZUNA_URL}")
    timeout = requests.Timeout(f"timed out for url: {ADZUNA_URL}")
    unreadable = ValueError(f"Expecting value near {ADZUNA_URL}")
    assert describe(http_error) == "answered HTTP 429"
    assert describe(connection_error) == "could not be reached"
    assert describe(timeout) == "timed out"
    assert describe(unreadable) == "sent a reply we could not read"
    for exc in (http_error, connection_error, timeout, unreadable, RuntimeError(ADZUNA_URL)):
        assert MARKER not in describe(exc)


def test_get_json_turns_an_http_error_into_a_safe_source_error(monkeypatch):
    monkeypatch.setattr(requests, "get", lambda url, **kw: real_response(401, ADZUNA_URL))
    with pytest.raises(SourceError) as caught:
        get_json("https://api.adzuna.com/v1/api/jobs/gb/search/1", params={"app_key": MARKER})
    assert str(caught.value) == "answered HTTP 401"
    assert caught.value.__cause__ is None and caught.value.__suppress_context__


def test_get_json_turns_a_connection_error_into_a_safe_source_error(monkeypatch):
    def refuse(url, **kw):
        raise requests.ConnectionError(f"Max retries exceeded with url: {ADZUNA_URL}")

    monkeypatch.setattr(requests, "get", refuse)
    with pytest.raises(SourceError) as caught:
        get_json("https://api.adzuna.com/x")
    assert str(caught.value) == "could not be reached"


def test_get_json_turns_a_non_json_reply_into_a_safe_source_error(monkeypatch):
    monkeypatch.setattr(requests, "get", lambda url, **kw: real_response(200, ADZUNA_URL, b"<html>not json</html>"))
    with pytest.raises(SourceError) as caught:
        get_json("https://api.adzuna.com/x")
    assert str(caught.value) == "sent a reply we could not read"


def test_get_json_returns_the_reply_when_all_is_well(monkeypatch):
    monkeypatch.setattr(requests, "get", lambda url, **kw: real_response(200, ADZUNA_URL, b'{"results": [1]}'))
    assert get_json("https://api.adzuna.com/x") == {"results": [1]}


# --- through the whole API ---------------------------------------------------------------------


@pytest.fixture()
def adzuna_fails(monkeypatch):
    """Reed answers with no ads and Adzuna fails the way a real outage or quota error does."""
    monkeypatch.setenv("ADZUNA_APP_KEY", MARKER)
    monkeypatch.setenv("LLM_API_KEY", "")

    def failing(kind):
        def fake_get(url, params=None, **kw):
            if "reed.co.uk" in url:
                return real_response(200, url, b'{"results": []}')
            full = requests.Request("GET", url, params=params).prepare().url
            if kind == "http":
                return real_response(429, full)
            raise requests.ConnectionError(f"HTTPSConnectionPool: Max retries exceeded with url: {full}")

        return fake_get

    def install(kind):
        monkeypatch.setattr(requests, "get", failing(kind))

    return install


@pytest.mark.parametrize("kind", ["http", "connection"])
def test_the_502_body_and_the_logs_never_contain_the_key(adzuna_fails, caplog, kind):
    adzuna_fails(kind)
    caplog.set_level(logging.DEBUG)
    response = TestClient(create_app()).post("/analyze", data={"role": "Data Analyst"})
    assert response.status_code == 502
    assert response.json()["detail"].startswith("No jobs fetched. ")
    assert MARKER not in response.text
    assert "app_key" not in response.text
    assert MARKER not in caplog.text, "the key reached the logs"


def test_the_request_logging_libraries_are_kept_quiet():
    """urllib3 logs whole request addresses at DEBUG, so it must never be turned up by LOG_LEVEL."""
    import api.main  # noqa: F401  (importing it sets the levels)

    for name in ("urllib3", "httpx", "httpcore"):
        assert logging.getLogger(name).level >= logging.WARNING

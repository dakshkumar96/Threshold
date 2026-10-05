"""Rate limits, the cap on searches running at once, and the upload size limit (M1 and M4)."""

from __future__ import annotations

import threading

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api import routes, security
from api.main import create_app

ALLOWED_ORIGIN = "http://localhost:3000"  # the CORS origin the tests run with


@pytest.fixture()
def client():
    return TestClient(create_app())


# --- the rate limiter ----------------------------------------------------------------------


def test_the_limit_allows_exactly_n_calls_a_minute():
    limiter = security.RateLimiter(3, "slow down")
    for _ in range(3):
        limiter.check("1.2.3.4")
    with pytest.raises(HTTPException) as caught:
        limiter.check("1.2.3.4")
    assert caught.value.status_code == 429
    assert caught.value.detail == "slow down"
    assert caught.value.headers == {"Retry-After": "60"}


def test_each_address_has_its_own_count():
    limiter = security.RateLimiter(1, "slow down")
    limiter.check("1.1.1.1")
    limiter.check("2.2.2.2")
    with pytest.raises(HTTPException):
        limiter.check("1.1.1.1")


def test_zero_turns_the_limit_off():
    limiter = security.RateLimiter(0, "slow down")
    for _ in range(1000):
        limiter.check("1.2.3.4")


def test_calls_older_than_a_minute_stop_counting(monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr(security.time, "monotonic", lambda: clock[0])
    limiter = security.RateLimiter(1, "slow down")
    limiter.check("1.2.3.4")
    clock[0] += 61
    limiter.check("1.2.3.4")


def test_idle_addresses_are_forgotten_so_the_table_cannot_grow_forever(monkeypatch):
    clock = [1000.0]
    monkeypatch.setattr(security.time, "monotonic", lambda: clock[0])
    limiter = security.RateLimiter(5, "slow down")
    for n in range(500):
        limiter.check(f"10.0.{n // 250}.{n % 250}")
    assert limiter.tracked_clients() == 500
    clock[0] += 61
    limiter.check("192.0.2.1")
    assert limiter.tracked_clients() == 1


def test_the_search_limit_keeps_its_message(client, monkeypatch):
    monkeypatch.setattr(security, "analyze_limiter", security.RateLimiter(1, security.analyze_limiter.message))
    monkeypatch.setattr(routes, "run_analysis", lambda **kwargs: {"ok": True})
    assert client.post("/analyze", data={"role": "Data Analyst"}).status_code == 200
    second = client.post("/analyze", data={"role": "Data Analyst"})
    assert second.status_code == 429
    assert second.json() == {"detail": "Too many analyses from this address. Wait a minute and try again."}
    assert second.headers["retry-after"] == "60"


def test_sponsor_lookups_are_limited(client, monkeypatch):
    monkeypatch.setattr(security, "sponsor_check_limiter", security.RateLimiter(2, "Too many sponsor lookups"))
    assert client.get("/sponsor-check", params={"q": "Monzo"}).status_code == 200
    assert client.get("/sponsor-check", params={"q": "Monzo"}).status_code == 200
    third = client.get("/sponsor-check", params={"q": "Monzo"})
    assert third.status_code == 429
    assert third.json() == {"detail": "Too many sponsor lookups"}


def test_account_routes_are_limited_before_the_token_is_checked(client, monkeypatch):
    monkeypatch.setattr(security, "account_limiter", security.RateLimiter(2, "Too many requests"))
    assert client.get("/me/preferences").status_code == 401
    assert client.get("/me/saved-searches").status_code == 401
    assert client.get("/me/last-match").status_code == 429


# --- searches running at once ---------------------------------------------------------------------


def test_the_cap_turns_away_extra_searches_and_frees_its_slot():
    slots = security.ConcurrencyLimiter(2)
    with slots.claim(), slots.claim():
        assert slots.running == 2
        with pytest.raises(HTTPException) as caught, slots.claim():
            pass
        assert caught.value.status_code == 503
        assert caught.value.headers == {"Retry-After": "30"}
    assert slots.running == 0
    with slots.claim():
        assert slots.running == 1


def test_a_failed_search_frees_its_slot():
    slots = security.ConcurrencyLimiter(1)
    with pytest.raises(ValueError), slots.claim():
        raise ValueError("the search failed")
    assert slots.running == 0


def test_a_second_search_is_turned_away_while_the_first_runs(client, monkeypatch):
    monkeypatch.setattr(security, "analysis_slots", security.ConcurrencyLimiter(1))
    monkeypatch.setattr(routes, "analysis_slots", security.analysis_slots)
    started, finish = threading.Event(), threading.Event()

    def slow_search(**kwargs):
        started.set()
        finish.wait(10)
        return {"ok": True}

    monkeypatch.setattr(routes, "run_analysis", slow_search)
    first: dict = {}
    worker = threading.Thread(target=lambda: first.update(r=client.post("/analyze", data={"role": "Data Analyst"})))
    worker.start()
    assert started.wait(10)
    busy = client.post("/analyze", data={"role": "Data Analyst"})
    finish.set()
    worker.join(10)
    assert busy.status_code == 503
    assert busy.json() == {"detail": security.BUSY_MESSAGE}
    assert first["r"].status_code == 200
    assert client.post("/analyze", data={"role": "Data Analyst"}).status_code == 200


# --- request size (M1) ---------------------------------------------------------------------------


def test_a_request_over_six_megabytes_gets_413_before_it_is_read(client, monkeypatch):
    monkeypatch.setattr(routes, "run_analysis", lambda **kwargs: pytest.fail("the search must not start"))
    response = client.post(
        "/analyze",
        data={"role": "Data Analyst"},
        files={"cv_file": ("cv.pdf", b"\0" * (7 * 1024 * 1024), "application/pdf")},
        headers={"Origin": ALLOWED_ORIGIN},
    )
    assert response.status_code == 413
    assert response.json() == {"detail": security.TOO_LARGE_MESSAGE}
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN, "the browser must be able to read it"


def test_a_cv_just_over_five_megabytes_still_gets_the_clear_400(client):
    response = client.post(
        "/analyze",
        data={"role": "Data Analyst"},
        files={"cv_file": ("cv.txt", b"a" * (5 * 1024 * 1024 + 1), "text/plain")},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "CV file is too large (max 5 MB)."}


def test_small_requests_pass_the_size_check(client):
    assert client.get("/health").json() == {"status": "ok"}

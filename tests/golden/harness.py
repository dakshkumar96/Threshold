"""Characterization harness: run the real API with the network faked.

Every outbound call (Reed, Adzuna, ATS boards, the AI service) is answered
from `fixtures.py`, so a run is repeatable and offline. The sponsor matching,
skill counting, level detection, CV parsing, prompt building and response
shaping all run for real. `scenarios()` returns one JSON-friendly record per
request, and the committed `expected.json` is a recording of it. If a refactor
changes any response, the prompt sent to the AI, or any cache write, the
comparison in `test_golden_api.py` fails.
"""

from __future__ import annotations

import contextlib
import copy
import json
import os
import sys
import tempfile
import threading
from datetime import date
from pathlib import Path
from typing import Any
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]

# Set before the app is imported. `load_dotenv` never overrides variables that
# already exist, so a developer's real .env keys are never used by a test.
BASE_ENV = {
    "REED_API_KEY": "test-reed-key",
    "ADZUNA_APP_ID": "test-adzuna-id",
    "ADZUNA_APP_KEY": "test-adzuna-key",
    "LLM_API_KEY": "test-llm-key",
    "LLM_BASE_URL": "https://llm.invalid/v1",
    "LLM_MODEL": "openai/gpt-oss-120b",
    "ANALYZE_API_KEY": "",
    "APP_ENV": "local",
    "ENABLE_API_DOCS": "",
    "CLERK_DEV_BYPASS": "1",
    "CLERK_JWKS_URL": "",
    "CLERK_ISSUER": "",
    "CLERK_AUTHORIZED_PARTIES": "",
    # Off in tests, which make many calls from one address. tests/test_limits.py covers them.
    "SPONSOR_CHECK_RATE_LIMIT_PER_MIN": "0",
    "ACCOUNT_RATE_LIMIT_PER_MIN": "0",
    "ANALYZE_MAX_CONCURRENT": "2",
    "CORS_ALLOW_ORIGINS": "http://localhost:3000",
}

TODAY = date(2026, 10, 5)


def prepare_environment(rate_limit: int = 0) -> None:
    for path in (str(ROOT / "src"), str(ROOT)):
        if path not in sys.path:
            sys.path.insert(0, path)
    os.environ.update(BASE_ENV)
    os.environ["ANALYZE_RATE_LIMIT_PER_MIN"] = str(rate_limit)


@contextlib.contextmanager
def env_override(**values: str):
    old = {k: os.environ.get(k) for k in values}
    os.environ.update(values)
    try:
        yield
    finally:
        for key, value in old.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


# --- fakes -------------------------------------------------------------------


class FakeResponse:
    """Just enough of requests.Response for the code under test."""

    def __init__(self, status_code: int = 200, payload: Any = None) -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = json.dumps(payload) if payload is not None else ""

    @property
    def ok(self) -> bool:
        return self.status_code < 400

    def json(self) -> Any:
        if self._payload is None:
            raise ValueError("no JSON body")
        return copy.deepcopy(self._payload)

    def raise_for_status(self) -> None:
        if not self.ok:
            import requests

            raise requests.HTTPError(f"{self.status_code} error", response=self)  # type: ignore[arg-type]


def chat_reply(content: str, finish_reason: str = "stop") -> FakeResponse:
    return FakeResponse(
        200,
        {
            "choices": [{"message": {"content": content}, "finish_reason": finish_reason}],
            "usage": {"prompt_tokens": 1000, "completion_tokens": 2000},
        },
    )


class FakeNetwork:
    """Answers requests.get / requests.post from fixtures and records them."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self, *, reed_status: int = 200, adzuna_status: int = 200) -> None:
        self.reed_status = reed_status
        self.adzuna_status = adzuna_status
        self.get_calls: list[str] = []
        self.llm_requests: list[dict[str, Any]] = []
        self.llm_replies: list[Any] = []
        self.ats_writes: list[str] = []
        self.default_cv = "junior"

    # requests.get --------------------------------------------------------
    def get(self, url: str, params: dict | None = None, **_: Any) -> FakeResponse:
        from tests.golden import fixtures as fx

        params = params or {}
        shown = {k: v for k, v in sorted(params.items())}
        with self._lock:
            self.get_calls.append(f"{url} {shown}" if shown else url)

        if url.startswith("https://www.reed.co.uk/api/1.0/search"):
            if self.reed_status != 200:
                return FakeResponse(self.reed_status, {"message": "reed down"})
            return FakeResponse(
                200,
                fx.reed_search(params["keywords"], params["resultsToTake"], params["resultsToSkip"]),
            )
        if url.startswith("https://www.reed.co.uk/api/1.0/jobs/"):
            job_id = url.rsplit("/", 1)[1]
            full = fx.reed_full_description(job_id)
            if full is None:
                return FakeResponse(404, {"message": "no such job"})
            return FakeResponse(200, {"jobDescription": full})
        if url.startswith("https://api.adzuna.com/"):
            if self.adzuna_status != 200:
                return FakeResponse(self.adzuna_status, {"message": "adzuna down"})
            page = int(url.rstrip("/").rsplit("/", 1)[1])
            if page > 1:
                return FakeResponse(200, {"results": []})
            return FakeResponse(200, fx.adzuna_search(params["what"]))
        if url.startswith("https://boards-api.greenhouse.io/v1/boards/"):
            token = url.split("/boards/")[1].split("/")[0]
            board = fx.GREENHOUSE_BOARDS.get(token)
            return FakeResponse(200, board) if board else FakeResponse(404, {})
        if any(h in url for h in ("api.ashbyhq.com", "workable.com", "recruitee.com")):
            return FakeResponse(404, {})
        raise AssertionError(f"unexpected network call: {url}")

    # requests.post (the AI service) ----------------------------------------
    def post(self, url: str, headers: dict | None = None, json: Any = None, timeout: Any = None, **_: Any):
        from tests.golden import fixtures as fx

        with self._lock:
            self.llm_requests.append({"url": url, "timeout": list(timeout) if timeout else None, "payload": json})
        if self.llm_replies:
            reply = self.llm_replies.pop(0)
            if isinstance(reply, BaseException):
                raise reply
            return reply
        return chat_reply(fx.llm_content(self.default_cv))


class FakeAtsStore:
    """Replaces the SQLite ATS cache so a test never reads or writes real data."""

    def __init__(self, net: FakeNetwork) -> None:
        self.net = net

    def get(self, company_key: str, db_path: Any = None):
        from tests.golden import fixtures as fx

        return copy.deepcopy(fx.ATS_CACHE.get(company_key))

    def get_many(self, company_keys: list[str], db_path: Any = None):
        from tests.golden import fixtures as fx

        return {k: copy.deepcopy(fx.ATS_CACHE[k]) for k in company_keys if k in fx.ATS_CACHE}

    def upsert_hit(self, company_key, ats, token, published_name, match_score, has_uk, db_path=None):
        self.net.ats_writes.append(f"hit {company_key} {ats} {token} {published_name} {match_score} {has_uk}")

    def upsert_miss(self, company_key, db_path=None):
        self.net.ats_writes.append(f"miss {company_key}")

    def mark_stale(self, company_key, db_path=None):
        self.net.ats_writes.append(f"stale {company_key}")


class FixedDate(date):
    @classmethod
    def today(cls) -> date:
        return TODAY


@contextlib.contextmanager
def faked_world(net: FakeNetwork):
    """Patch everything that talks to the outside world."""
    import requests

    import api.ats_store as ats_store_module
    import experience_level

    ats = FakeAtsStore(net)
    patches = [
        mock.patch.object(requests, "get", net.get),
        mock.patch.object(requests, "post", net.post),
        mock.patch("time.sleep", lambda _s: None),
        mock.patch.object(experience_level, "date", FixedDate),
    ]
    for name in ("get", "get_many", "upsert_hit", "upsert_miss", "mark_stale"):
        patches.append(mock.patch.object(ats_store_module, name, getattr(ats, name)))
    with contextlib.ExitStack() as stack:
        for p in patches:
            stack.enter_context(p)
        yield


# --- recording -----------------------------------------------------------------


def _scrub(value: Any) -> Any:
    """Blank out timestamps the database stamps on rows."""
    if isinstance(value, dict):
        return {
            k: ("<timestamp>" if k in {"created_at", "updated_at"} and v else _scrub(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_scrub(v) for v in value]
    return value


def record(resp: Any, net: FakeNetwork) -> dict[str, Any]:
    try:
        body = resp.json()
    except ValueError:
        body = {"_non_json": resp.text[:200]}
    return {
        "status": resp.status_code,
        "body": _scrub(body),
        "network": sorted(net.get_calls),
        "llm_requests": net.llm_requests,
        "ats_writes": sorted(net.ats_writes),
    }


def _pdf_bytes(text: str) -> bytes:
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_textbox(pymupdf.Rect(40, 40, 555, 800), text, fontsize=10)
    data = doc.tobytes()
    doc.close()
    return data


def _blank_pdf() -> bytes:
    import pymupdf

    doc = pymupdf.open()
    doc.new_page()
    data = doc.tobytes()
    doc.close()
    return data


def scenarios(group: str = "main", shard: tuple[int, int] = (0, 1), only: tuple[str, ...] = ()) -> dict[str, Any]:
    """Run the scenarios in `group` and return the records.

    `shard=(i, n)` runs every n-th /analyze scenario starting at i, so several
    processes can split the work. The cheap small-route scenarios (which share
    one temporary database) always run in shard 0. `only` keeps scenarios
    whose name starts with one of the given prefixes.
    """
    prepare_environment(rate_limit=2 if group == "rate_limit" else 0)
    from fastapi.testclient import TestClient

    import api.user_store as user_store
    from api.main import app
    from tests.golden import fixtures as fx

    net = FakeNetwork()
    client = TestClient(app)
    out: dict[str, Any] = {}
    counter = {"analyze": 0}

    def wanted(name: str) -> bool:
        return not only or any(name.startswith(p) for p in only)

    def analyze(name: str, *, env: dict | None = None, reed: int = 200, adzuna: int = 200,
                llm: list | None = None, cv: str = "junior", **request: Any) -> None:
        index = counter["analyze"]
        counter["analyze"] += 1
        if index % shard[1] != shard[0] or not wanted(name):
            return
        net.reset(reed_status=reed, adzuna_status=adzuna)
        net.default_cv = cv
        net.llm_replies = list(llm or [])
        with env_override(**(env or {})):
            resp = client.post("/analyze", **request)
        out[name] = record(resp, net)

    with faked_world(net):
        if group == "rate_limit":
            for i in range(3):
                analyze(f"rate_limit/request_{i + 1}", data={"role": "zzzz nothing", "experience_level": "any"})
            return out

        # --- searches without a CV -------------------------------------------------
        analyze("analyze/no_cv_any_level", data={"role": "Software Engineer", "experience_level": "any"})
        analyze("analyze/no_cv_default_level", data={"role": "Software Engineer"})
        analyze("analyze/no_cv_graduate", data={"role": "Software Engineer", "experience_level": "graduate"})
        analyze("analyze/no_cv_senior_new_entrant",
                data={"role": "Software Engineer", "experience_level": "senior", "is_new_entrant": "true"})
        analyze("analyze/min_salary_pounds_commas",
                data={"role": "Software Engineer", "min_salary": "£45,000", "experience_level": "any"})
        analyze("analyze/role_names_a_level", data={"role": "Graduate Software Engineer", "experience_level": "graduate"})

        # --- searches with a CV (the AI reply is faked) ---------------------------
        analyze("analyze/cv_text_junior_auto", data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/cv_text_graduate_auto", cv="graduate",
                data={"role": "Software Engineer", "cv_text": fx.CV_GRADUATE})
        analyze("analyze/cv_text_senior_auto", cv="senior",
                data={"role": "Software Engineer", "cv_text": fx.CV_SENIOR})
        analyze("analyze/cv_text_picked_level_wins",
                data={"role": "Software Engineer", "cv_text": fx.CV_GRADUATE, "experience_level": "mid"})
        analyze("analyze/cv_pdf_graduate", cv="graduate",
                data={"role": "Software Engineer"},
                files={"cv_file": ("cv.pdf", _pdf_bytes(fx.CV_GRADUATE), "application/pdf")})
        analyze("analyze/cv_txt_file_junior",
                data={"role": "Software Engineer"},
                files={"cv_file": ("cv.txt", fx.CV_JUNIOR.encode(), "text/plain")})
        analyze("analyze/cv_with_min_salary_and_new_entrant",
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR, "min_salary": "35000", "is_new_entrant": "yes"})

        # --- the AI service misbehaves ---------------------------------------------
        analyze("analyze/llm_rate_limited", llm=[FakeResponse(429, {"error": {"message": "slow down"}})],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_server_error", llm=[FakeResponse(500, {"error": {"message": "boom"}})],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_unknown_model", llm=[FakeResponse(404, {"error": {"message": "model does not exist"}})],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_key_rejected", llm=[FakeResponse(401, {"error": {"message": "bad key"}})],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_too_large", llm=[FakeResponse(413, {"error": {"message": "too big"}})],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        import requests as _requests

        analyze("analyze/llm_connection_reset_then_ok", llm=[_requests.exceptions.ConnectionError("reset")],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_connection_reset_twice",
                llm=[_requests.exceptions.ConnectionError("reset"), _requests.exceptions.ConnectionError("reset")],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_timeout", llm=[_requests.Timeout("slow")],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_truncated_reply",
                llm=[chat_reply(fx.llm_content("junior")[:2600], finish_reason="length")],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_reply_without_json_blocks",
                llm=[chat_reply("SECTION: Strengths\n- Python\n\nSECTION: Gaps\n- Java — ~30% of ads\n\n"
                                "SECTION: Scores\n- Total: 61/100 — not competitive\n\nSECTION: Put forward\n- No — not yet.\n")],
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})
        analyze("analyze/llm_says_yes_to_a_low_score",
                llm=[chat_reply(fx.llm_content("senior").replace("88", "30").replace('"No"', '"Yes"'))],
                cv="senior", data={"role": "Software Engineer", "cv_text": fx.CV_SENIOR})

        # --- the job boards misbehave ----------------------------------------------
        analyze("analyze/reed_down_adzuna_ok", reed=500, data={"role": "Software Engineer", "experience_level": "any"})
        analyze("analyze/both_boards_down", reed=500, adzuna=500,
                data={"role": "Software Engineer", "experience_level": "any"})
        analyze("analyze/no_keys_configured", env={"REED_API_KEY": "", "ADZUNA_APP_ID": ""},
                data={"role": "Software Engineer", "experience_level": "any"})
        analyze("analyze/no_jobs_found", data={"role": "zzzz nothing"})
        analyze("analyze/min_salary_removes_everything",
                data={"role": "Software Engineer", "min_salary": "900000", "experience_level": "any"})

        # --- bad input ----------------------------------------------------------------
        analyze("input/role_too_short", data={"role": "a"})
        analyze("input/role_missing", data={})
        analyze("input/min_salary_not_a_number", data={"role": "Software Engineer", "min_salary": "lots"})
        analyze("input/min_salary_negative", data={"role": "Software Engineer", "min_salary": "-5"})
        analyze("input/cv_text_too_long", data={"role": "Software Engineer", "cv_text": "x" * 80_001})
        analyze("input/file_is_a_word_document",
                data={"role": "Software Engineer"},
                files={"cv_file": ("cv.docx", b"PK\x03\x04 not really", "application/octet-stream")})
        analyze("input/image_renamed_to_pdf",
                data={"role": "Software Engineer"},
                files={"cv_file": ("cv.pdf", b"\x89PNG\r\n\x1a\n" + b"0" * 200, "application/pdf")})
        analyze("input/pdf_without_text", data={"role": "Software Engineer"},
                files={"cv_file": ("cv.pdf", _blank_pdf(), "application/pdf")})
        analyze("input/pdf_with_scrambled_text", data={"role": "Software Engineer"},
                files={"cv_file": ("cv.pdf", _pdf_bytes("(cid:1)(cid:2)(cid:3) " * 60), "application/pdf")})
        analyze("input/empty_file_counts_as_no_cv", data={"role": "Software Engineer", "experience_level": "any"},
                files={"cv_file": ("cv.pdf", b"", "application/pdf")})
        analyze("input/file_over_5mb", data={"role": "Software Engineer"},
                files={"cv_file": ("cv.txt", b"a" * (5 * 1024 * 1024 + 1), "text/plain")})
        analyze("input/cv_but_no_ai_key", env={"LLM_API_KEY": ""},
                data={"role": "Software Engineer", "cv_text": fx.CV_JUNIOR})

        # --- access control ----------------------------------------------------------------
        analyze("auth/analyze_key_required_missing", env={"ANALYZE_API_KEY": "secret"},
                data={"role": "zzzz nothing"})
        analyze("auth/analyze_key_required_wrong", env={"ANALYZE_API_KEY": "secret"},
                data={"role": "zzzz nothing"}, headers={"X-Analyze-Key": "nope"})
        analyze("auth/analyze_key_required_right", env={"ANALYZE_API_KEY": "secret"},
                data={"role": "zzzz nothing"}, headers={"X-Analyze-Key": "secret"})
        analyze("auth/bad_bearer_token", data={"role": "zzzz nothing"}, headers={"Authorization": "Bearer abc"})
        analyze("auth/good_dev_bearer_token", data={"role": "zzzz nothing"}, headers={"Authorization": "Bearer user_1"})

        # --- the small routes ----------------------------------------------------------------
        def plain(name: str, method: str, url: str, **kw: Any) -> None:
            if shard[0] != 0 or not wanted(name):
                return
            net.reset()
            out[name] = record(getattr(client, method)(url, **kw), net)

        plain("health", "get", "/health")
        for q in ("Monzo", "Wise", "reed", "x", "zzzzqqqq unlikely name", "PwC"):
            plain(f"sponsor_check/{q}", "get", "/sponsor-check", params={"q": q})
        plain("sponsor_check/missing_q", "get", "/sponsor-check")

        # --- signed-in routes (temporary database, development bypass token) -------------------
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(
            user_store, "DB_PATH", Path(tmp) / "user.db"
        ):
            user_store.init_db()
            auth = {"Authorization": "Bearer user_test1"}
            plain("me/no_token", "get", "/me/saved-searches")
            plain("me/bad_token", "get", "/me/saved-searches", headers={"Authorization": "Bearer nope"})
            plain("me/saved_empty", "get", "/me/saved-searches", headers=auth)
            plain("me/saved_create", "post", "/me/saved-searches", headers=auth,
                  json={"role": " Data Analyst ", "experience": "junior", "min_salary": 35000})
            plain("me/saved_create_invalid", "post", "/me/saved-searches", headers=auth, json={"role": ""})
            plain("me/saved_list", "get", "/me/saved-searches", headers=auth)
            plain("me/saved_other_user", "get", "/me/saved-searches", headers={"Authorization": "Bearer user_test2"})
            plain("me/saved_delete", "delete", "/me/saved-searches/1", headers=auth)
            plain("me/saved_delete_again", "delete", "/me/saved-searches/1", headers=auth)
            plain("me/prefs_default", "get", "/me/preferences", headers=auth)
            plain("me/prefs_put", "put", "/me/preferences", headers=auth,
                  json={"default_experience": "graduate", "locations": "London", "email_alerts": True,
                        "cv_filename": "cv.pdf", "is_new_entrant": True})
            plain("me/prefs_partial_put", "put", "/me/preferences", headers=auth, json={"locations": "Leeds"})
            plain("me/last_match_empty", "get", "/me/last-match", headers=auth)
            plain("me/last_match_put", "put", "/me/last-match", headers=auth,
                  json={"role": "Data Analyst", "score": 61.5, "gaps": [{"skill": "SQL"}], "jobs_total": 12})
            plain("me/last_match_get", "get", "/me/last-match", headers=auth)
    return out

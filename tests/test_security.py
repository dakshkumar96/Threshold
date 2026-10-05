"""The shared analyze key, the API docs pages, and a guard against blocking the server."""

from __future__ import annotations

import ast
import inspect
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api import routes, security, user_routes
from api.main import create_app

API_DIR = Path(__file__).resolve().parents[1] / "api"


# --- the shared analyze key (M3) -----------------------------------------------------------


def test_the_key_is_compared_in_constant_time(monkeypatch):
    monkeypatch.setenv("ANALYZE_API_KEY", "right-key")
    seen = []
    real = security.secrets.compare_digest

    def spy(a, b):
        seen.append((a, b))
        return real(a, b)

    monkeypatch.setattr(security.secrets, "compare_digest", spy)
    security.require_analyze_user(None, "right-key")
    assert seen == [(b"right-key", b"right-key")]


@pytest.mark.parametrize("supplied", [None, "", "wrong", "right-ke", "right-key-and-more", "café"])
def test_a_wrong_or_missing_key_gets_401(monkeypatch, supplied):
    monkeypatch.setenv("ANALYZE_API_KEY", "right-key")
    with pytest.raises(HTTPException) as caught:
        security.require_analyze_user(None, supplied)
    assert caught.value.status_code == 401


def test_the_right_key_is_accepted_even_with_stray_spaces(monkeypatch):
    monkeypatch.setenv("ANALYZE_API_KEY", "right-key")
    security.require_analyze_user(None, "  right-key ")


def test_a_bearer_token_does_not_replace_the_key(monkeypatch):
    monkeypatch.setenv("ANALYZE_API_KEY", "right-key")
    with pytest.raises(HTTPException) as caught:
        security.require_analyze_user("Bearer user_1", None)
    assert caught.value.status_code == 401


def test_through_the_api_the_key_gate_answers_401_before_any_search(monkeypatch):
    monkeypatch.setenv("ANALYZE_API_KEY", "right-key")
    monkeypatch.setattr(routes, "run_analysis", lambda **kwargs: {"searched": True})
    client = TestClient(create_app())
    assert client.post("/analyze", data={"role": "Data Analyst"}).status_code == 401
    ok = client.post("/analyze", data={"role": "Data Analyst"}, headers={"X-Analyze-Key": "right-key"})
    assert ok.status_code == 200 and ok.json() == {"searched": True}


# --- the docs pages (M2) --------------------------------------------------------------------

DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")


def _statuses(monkeypatch, **env):
    for name, value in env.items():
        monkeypatch.setenv(name, value)
    client = TestClient(create_app())
    return [client.get(path).status_code for path in DOCS_PATHS]


def test_the_docs_pages_are_off_in_production(monkeypatch):
    assert _statuses(monkeypatch, APP_ENV="production", ENABLE_API_DOCS="") == [404, 404, 404]


def test_the_docs_pages_are_off_when_no_environment_is_named(monkeypatch):
    assert _statuses(monkeypatch, APP_ENV="", ENABLE_API_DOCS="") == [404, 404, 404]


def test_the_docs_pages_can_be_turned_on_in_production(monkeypatch):
    assert _statuses(monkeypatch, APP_ENV="production", ENABLE_API_DOCS="1") == [200, 200, 200]


def test_the_docs_pages_are_on_for_local_development(monkeypatch):
    assert _statuses(monkeypatch, APP_ENV="local", ENABLE_API_DOCS="") == [200, 200, 200]


def test_the_health_check_still_works_with_docs_off(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    assert TestClient(create_app()).get("/health").json() == {"status": "ok"}


# --- nothing may block the event loop (H4) ----------------------------------------------------


def test_no_route_handler_is_async():
    """A search takes tens of seconds. In an `async def` it would freeze the whole worker."""
    for module in (routes, user_routes):
        for name, function in inspect.getmembers(module, inspect.isfunction):
            assert not inspect.iscoroutinefunction(function), f"{module.__name__}.{name} is async"


def test_the_only_async_functions_in_the_api_are_the_startup_hook_and_the_size_check():
    """Both are async on purpose and do no blocking work: one opens the databases, one reads a header."""
    found = []
    for path in sorted(API_DIR.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        found += [f"{path.name}:{node.name}" for node in ast.walk(tree) if isinstance(node, ast.AsyncFunctionDef)]
    assert found == ["main.py:lifespan", "security.py:__call__"]

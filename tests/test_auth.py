"""Sign-in checks. A token is trusted only if the Clerk this server is set up with signed it."""

from __future__ import annotations

import logging
import time

import jwt
import pytest
from fastapi.testclient import TestClient

from api import auth, user_store
from api.main import create_app
from api.security import require_analyze_user
from tests.fake_clerk import FakeClerk

PLAIN_401 = "Invalid or expired sign-in token."


@pytest.fixture()
def clerk():
    fake = FakeClerk()
    yield fake
    fake.close()


@pytest.fixture()
def attacker():
    fake = FakeClerk(kid="attacker-key")
    yield fake
    fake.close()


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(user_store, "DB_PATH", tmp_path / "user.db")
    user_store.init_db()
    return TestClient(create_app())


def configure(monkeypatch, *, issuer="", env="production", bypass="", parties=""):
    monkeypatch.setenv("CLERK_ISSUER", issuer)
    monkeypatch.setenv("CLERK_JWKS_URL", "")
    monkeypatch.setenv("APP_ENV", env)
    monkeypatch.setenv("CLERK_DEV_BYPASS", bypass)
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", parties)


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


# --- the token has to come from the configured Clerk -------------------------------


def test_a_token_from_the_configured_clerk_is_accepted(client, clerk, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer)
    response = client.get("/me/preferences", headers=bearer(clerk.token()))
    assert response.status_code == 200
    assert response.json()["user_id"] == "user_real"


def test_a_token_cannot_choose_its_own_key_address(client, clerk, attacker, monkeypatch):
    """The attack from the audit (C1): the token names the attacker's server as its issuer."""
    configure(monkeypatch, issuer=clerk.issuer)
    forged = attacker.token(sub="user_victim")
    response = client.get("/me/preferences", headers=bearer(forged))
    assert response.status_code == 401
    assert attacker.requests == [], "the server must never fetch keys from an address a token names"


def test_with_no_issuer_set_no_token_is_trusted(client, attacker, monkeypatch):
    """Production had no CLERK_ISSUER, and then any token with a reachable issuer was accepted."""
    configure(monkeypatch, issuer="")
    response = client.get("/me/preferences", headers=bearer(attacker.token()))
    assert response.status_code == 503
    assert attacker.requests == []


def test_a_forged_token_cannot_write_to_another_users_data(client, clerk, attacker, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer)
    forged = attacker.token(sub="user_victim")
    response = client.put("/me/preferences", json={"cv_filename": "x.pdf"}, headers=bearer(forged))
    assert response.status_code == 401
    assert user_store.get_preferences("user_victim")["cv_filename"] is None


def _bad_tokens(clerk):
    now = int(time.time())
    base = {"iss": clerk.issuer, "sub": "user_real", "iat": now, "exp": now + 3600}
    other_key = FakeClerk(kid=clerk.kid)  # same key id, different key
    yield "expired", clerk.token(exp=now - 3600, iat=now - 7200)
    yield "wrong issuer", clerk.token(iss="https://other.example")
    yield "no expiry", clerk.token(exp=None)
    yield "no issued-at", clerk.token(iat=None)
    yield "no subject", clerk.token(sub=None)
    yield "signed with a different key", other_key.token(iss=clerk.issuer)
    other_key.close()
    yield "HS256 instead of RS256", jwt.encode(base, "a-long-shared-secret-for-the-test-1234", algorithm="HS256", headers={"kid": clerk.kid})
    yield "alg none", jwt.encode(base, None, algorithm="none", headers={"kid": clerk.kid})
    yield "no key id", jwt.encode(base, clerk.key, algorithm="RS256")
    yield "not a token", "abc"
    yield "empty segments", "..."


def test_every_bad_token_gets_the_same_plain_401(client, clerk, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer)
    for label, token in _bad_tokens(clerk):
        response = client.get("/me/preferences", headers=bearer(token))
        assert response.status_code == 401, label
        assert response.json() == {"detail": PLAIN_401}, label


def test_no_token_gets_401(client, clerk, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer)
    assert client.get("/me/preferences").status_code == 401


def test_when_clerk_cannot_be_reached_the_answer_is_503(client, clerk, monkeypatch):
    configure(monkeypatch, issuer="http://127.0.0.1:9")  # nothing listens on this port
    response = client.get("/me/preferences", headers=bearer(clerk.token(iss="http://127.0.0.1:9")))
    assert response.status_code == 503
    assert "127.0.0.1" not in response.text


def test_a_read_timeout_while_fetching_keys_is_also_a_503(client, clerk, monkeypatch):
    """A timeout is an OSError. PyJWT wraps it only on newer Pythons, so it has to be caught here."""

    class SlowClerk:
        def get_signing_key_from_jwt(self, token):
            raise TimeoutError("timed out")

    configure(monkeypatch, issuer=clerk.issuer)
    monkeypatch.setattr(auth, "_jwks_client", lambda url: SlowClerk())
    response = client.get("/me/preferences", headers=bearer(clerk.token()))
    assert response.status_code == 503


def test_authorized_parties_are_checked_when_set(client, clerk, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer, parties="https://site.example/")
    assert client.get("/me/preferences", headers=bearer(clerk.token(azp="https://site.example"))).status_code == 200
    assert client.get("/me/preferences", headers=bearer(clerk.token(azp="https://evil.example"))).status_code == 401
    assert client.get("/me/preferences", headers=bearer(clerk.token())).status_code == 401


# --- the developer shortcut ----------------------------------------------------------------


def test_the_dev_shortcut_works_only_in_a_local_environment(client, monkeypatch):
    configure(monkeypatch, env="local", bypass="1")
    assert client.get("/me/preferences", headers=bearer("user_x")).status_code == 200

    configure(monkeypatch, env="production", bypass="1")
    assert client.get("/me/preferences", headers=bearer("user_x")).status_code == 503

    configure(monkeypatch, env="production", bypass="1", issuer="https://clerk.example")
    assert client.get("/me/preferences", headers=bearer("user_x")).status_code in (401, 503)


def test_startup_refuses_the_dev_shortcut_outside_local(monkeypatch):
    configure(monkeypatch, env="production", bypass="1", issuer="https://clerk.example")
    with pytest.raises(RuntimeError, match="CLERK_DEV_BYPASS"):
        auth.check_settings_at_startup()


def test_startup_accepts_the_dev_shortcut_in_local(monkeypatch):
    configure(monkeypatch, env="local", bypass="1")
    auth.check_settings_at_startup()


def test_startup_warns_when_sign_in_is_not_set_up(monkeypatch, caplog):
    configure(monkeypatch, env="production")
    with caplog.at_level(logging.WARNING, logger="api.auth"):
        auth.check_settings_at_startup()
    assert "CLERK_ISSUER is not set" in caplog.text


def test_startup_is_quiet_when_sign_in_is_set_up(monkeypatch, caplog):
    configure(monkeypatch, env="production", issuer="https://clerk.example")
    with caplog.at_level(logging.WARNING, logger="api.auth"):
        auth.check_settings_at_startup()
    assert caplog.text == ""


# --- users stay apart ------------------------------------------------------------------------


def test_users_cannot_see_or_delete_each_others_data(client, monkeypatch):
    configure(monkeypatch, env="local", bypass="1")
    a, b = bearer("user_a"), bearer("user_b")
    created = client.post("/me/saved-searches", json={"role": "Analyst"}, headers=b).json()
    client.put("/me/last-match", json={"role": "B's role", "score": 61}, headers=b)
    client.put("/me/preferences", json={"locations": "Leeds"}, headers=b)

    assert client.get("/me/saved-searches", headers=a).json() == {"items": []}
    assert client.delete(f"/me/saved-searches/{created['id']}", headers=a).status_code == 404
    assert client.get("/me/last-match", headers=a).json() == {}
    assert client.get("/me/preferences", headers=a).json()["locations"] == ""
    assert len(client.get("/me/saved-searches", headers=b).json()["items"]) == 1


# --- /analyze --------------------------------------------------------------------------------


def test_analyze_rejects_a_bad_token_when_sign_in_is_set_up(client, clerk, attacker, monkeypatch):
    configure(monkeypatch, issuer=clerk.issuer)
    response = client.post("/analyze", data={"role": "Data Analyst"}, headers=bearer(attacker.token()))
    assert response.status_code == 401
    assert attacker.requests == []


def test_analyze_ignores_a_token_when_sign_in_is_not_set_up(monkeypatch):
    """A search does not depend on who asks, so a token that cannot be checked is not a reason to fail."""
    configure(monkeypatch, env="production")
    monkeypatch.setenv("ANALYZE_API_KEY", "")
    require_analyze_user("Bearer abc", None)

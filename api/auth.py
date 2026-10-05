"""Checking Clerk sign-in tokens.

A token is trusted only when it is signed with a key from the Clerk address this
server is set up with (CLERK_ISSUER, and CLERK_JWKS_URL if the keys live
elsewhere). Nothing inside a token decides where its key comes from. If a token
could pick its own key address, anyone could make a token that passes.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import jwt
from fastapi import HTTPException
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError, PyJWTError

import settings

logger = logging.getLogger(__name__)

_JWKS_TIMEOUT_SECONDS = 5
_CLOCK_SKEW_SECONDS = 10
_REQUIRED_CLAIMS = ["exp", "iat", "sub"]


def sign_in_configured() -> bool:
    return settings.clerk_issuer() is not None


def check_settings_at_startup() -> None:
    """Run once when the app starts. Refuses a dangerous setting, warns about a missing one."""
    if settings.clerk_dev_bypass_requested() and not settings.is_local():
        raise RuntimeError(
            "CLERK_DEV_BYPASS=1 is set but APP_ENV is not local. "
            "That switch lets anyone sign in as any user, so remove it from this environment."
        )
    if not sign_in_configured():
        logger.warning(
            "CLERK_ISSUER is not set, so saved searches and profile answer 503. "
            "Set it to your Clerk address, for example https://your-name.clerk.accounts.dev"
        )


def _jwks_url() -> str:
    return settings.clerk_jwks_url() or f"{settings.clerk_issuer()}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _jwks_client(url: str) -> PyJWKClient:
    """One client for the configured key address, so Clerk's keys are cached between requests."""
    return PyJWKClient(url, timeout=_JWKS_TIMEOUT_SECONDS)


def verify_clerk_jwt(token: str) -> dict[str, Any]:
    """The token's claims, or raise 401 (not a valid token) or 503 (sign-in cannot be checked)."""
    if settings.clerk_dev_bypass() and token.startswith("user_"):
        return {"sub": token}

    if not sign_in_configured():
        if settings.clerk_dev_bypass():
            raise HTTPException(status_code=401, detail="Dev bypass expects Bearer user_…")
        raise HTTPException(status_code=503, detail="Sign-in is not available on this server.")

    try:
        signing_key = _jwks_client(_jwks_url()).get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer(),
            leeway=_CLOCK_SKEW_SECONDS,
            options={"verify_aud": False, "require": _REQUIRED_CLAIMS},
        )
    except (PyJWKClientConnectionError, OSError) as exc:
        # OSError covers a read timeout, which PyJWT only wraps on newer Python versions.
        logger.warning("Could not fetch Clerk's signing keys (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="Sign-in cannot be checked right now. Try again shortly."
        ) from None
    except PyJWTError as exc:
        logger.info("Rejected a sign-in token (%s)", type(exc).__name__)
        raise HTTPException(status_code=401, detail="Invalid or expired sign-in token.") from None

    allowed = settings.clerk_authorized_parties()
    if allowed and str(claims.get("azp", "")).rstrip("/") not in allowed:
        logger.info("Rejected a sign-in token issued for another website")
        raise HTTPException(status_code=401, detail="Invalid or expired sign-in token.")
    return claims

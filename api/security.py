"""Limits that protect a small server: who may search, how often, how many at once, and how big a request may be.

Every count lives in one server process. With several workers each keeps its
own count, so a per-address limit is really that limit times the workers.
"""

from __future__ import annotations

import secrets
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

import settings

from . import config
from .auth import sign_in_configured, verify_clerk_jwt

WINDOW_SECONDS = 60
TOO_LARGE_MESSAGE = "That upload is too large. A CV can be up to 5 MB."
BUSY_MESSAGE = "The server is busy with other searches right now. Try again in a minute."


class RateLimiter:
    """At most `per_minute` calls per client address in any 60 seconds. Zero turns it off."""

    def __init__(self, per_minute: int, message: str) -> None:
        self.per_minute = per_minute
        self.message = message
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()
        self._next_sweep = 0.0

    def check(self, client: str) -> None:
        if self.per_minute <= 0:
            return
        now = time.monotonic()
        with self._lock:
            if now >= self._next_sweep:
                self._forget_idle_clients(now)
            recent = [t for t in self._hits.get(client, []) if now - t < WINDOW_SECONDS]
            blocked = len(recent) >= self.per_minute
            if not blocked:
                recent.append(now)
            self._hits[client] = recent
        if blocked:
            raise HTTPException(
                status_code=429, detail=self.message, headers={"Retry-After": str(WINDOW_SECONDS)}
            )

    def tracked_clients(self) -> int:
        return len(self._hits)

    def _forget_idle_clients(self, now: float) -> None:
        """Drop addresses with no call in the last minute, so the table cannot grow forever."""
        self._hits = {
            client: hits
            for client, hits in self._hits.items()
            if hits and now - hits[-1] < WINDOW_SECONDS
        }
        self._next_sweep = now + WINDOW_SECONDS


class ConcurrencyLimiter:
    """At most `limit` searches running at once. Zero turns it off.

    A search uses the CPU for many seconds, so on a small server extra searches
    are turned away with a clear message instead of making everyone wait longer.
    """

    def __init__(self, limit: int) -> None:
        self.limit = limit
        self._running = 0
        self._lock = threading.Lock()

    @contextmanager
    def claim(self) -> Iterator[None]:
        if self.limit <= 0:
            yield
            return
        with self._lock:
            if self._running >= self.limit:
                raise HTTPException(status_code=503, detail=BUSY_MESSAGE, headers={"Retry-After": "30"})
            self._running += 1
        try:
            yield
        finally:
            with self._lock:
                self._running -= 1

    @property
    def running(self) -> int:
        return self._running


analyze_limiter = RateLimiter(
    config.RATE_LIMIT_PER_MIN, "Too many analyses from this address. Wait a minute and try again."
)
sponsor_check_limiter = RateLimiter(
    config.SPONSOR_CHECK_RATE_LIMIT_PER_MIN,
    "Too many sponsor lookups from this address. Wait a minute and try again.",
)
account_limiter = RateLimiter(
    config.ACCOUNT_RATE_LIMIT_PER_MIN, "Too many requests from this address. Wait a minute and try again."
)
analysis_slots = ConcurrencyLimiter(config.MAX_CONCURRENT_ANALYSES)


def client_address(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request) -> None:
    analyze_limiter.check(client_address(request))


def check_sponsor_check_rate(request: Request) -> None:
    sponsor_check_limiter.check(client_address(request))


def check_account_rate(request: Request) -> None:
    account_limiter.check(client_address(request))


class BodySizeLimit:
    """Refuse a request whose declared size is over the limit, before any of it is read.

    Browsers always declare the size of an upload. Caddy applies the same limit
    in production, which also covers a body sent without a declared size.
    """

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and _declared_size(scope) > self.max_bytes:
            response = JSONResponse(status_code=413, content={"detail": TOO_LARGE_MESSAGE})
            await response(scope, receive, send)
            return
        await self.app(scope, receive, send)


def _declared_size(scope: Scope) -> int:
    for name, value in scope.get("headers") or []:
        if name == b"content-length":
            try:
                return int(value)
            except ValueError:
                return 0
    return 0


def require_analyze_user(authorization: str | None, x_analyze_key: str | None) -> None:
    """Enforce `X-Analyze-Key` when one is configured, otherwise let guests in.

    A Bearer token is still validated if one is sent, so a signed-in client
    with a bad token fails instead of silently searching as a guest. When this
    server has no sign-in set up, a token cannot be checked and is ignored,
    because a search does not depend on who is asking.
    """
    expected = settings.analyze_api_key()
    if expected:
        supplied = (x_analyze_key or "").strip()
        # Same time to answer however much of the key was right.
        if not secrets.compare_digest(supplied.encode("utf-8"), expected.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid or missing API key.")
        return
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token and (sign_in_configured() or settings.clerk_dev_bypass()):
            verify_clerk_jwt(token)

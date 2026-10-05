"""Web calls that fail without leaking what was in the request.

The `requests` library puts the full address, query string included, into its
error text. Adzuna wants its API key in the query string, so that text must
never reach a response or a log. Everything here says what went wrong in a few
plain words and nothing else.
"""

from __future__ import annotations

from typing import Any

import requests


class SourceError(RuntimeError):
    """A web service could not be used. The message is safe to show and to log."""


def describe(exc: BaseException) -> str:
    """What went wrong with a web call, with no address and no query string."""
    if isinstance(exc, requests.HTTPError):
        status = getattr(exc.response, "status_code", None)
        return f"answered HTTP {status}" if status else "answered with an error"
    if isinstance(exc, requests.Timeout):
        return "timed out"
    if isinstance(exc, requests.ConnectionError):
        return "could not be reached"
    if isinstance(exc, ValueError):
        return "sent a reply we could not read"
    if isinstance(exc, requests.RequestException):
        return "request failed"
    return "failed"


def get_json(url: str, **kwargs: Any) -> Any:
    """GET a JSON reply. Any failure becomes a SourceError that says nothing about the request."""
    try:
        response = requests.get(url, **kwargs)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        raise SourceError(describe(exc)) from None

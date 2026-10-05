"""Talking to the AI service (any OpenAI-compatible chat API, Groq by default)."""

from __future__ import annotations

import logging
import re
import time
from typing import Any

import requests

logger = logging.getLogger(__name__)

# (connect, read) in seconds. Writing a full review can take about two minutes.
CHAT_TIMEOUT = (15, 150)
_RETRY_DELAY_SECONDS = 1.5


def post_chat_completion(
    url: str, headers: dict[str, str], payload: dict[str, Any]
) -> requests.Response:
    """POST the request, and try once more if the connection was dropped.

    Long requests over flaky networks (Windows sockets especially) sometimes
    die with a bare connection reset. That is the network and not the AI
    service, and one retry on a fresh connection clears nearly all of them.
    """
    try:
        return requests.post(url, headers=headers, json=payload, timeout=CHAT_TIMEOUT)
    except requests.exceptions.ConnectionError:
        logger.warning("Connection to the AI service dropped, retrying once")
        time.sleep(_RETRY_DELAY_SECONDS)
        return requests.post(url, headers=headers, json=payload, timeout=CHAT_TIMEOUT)


def http_error_message(response: requests.Response) -> str:
    """A reader-friendly message for a failed AI service call. Never includes secrets."""
    status = response.status_code
    detail = ""
    try:
        body = response.json()
        error = body.get("error") if isinstance(body, dict) else None
        if isinstance(error, dict):
            detail = str(error.get("message") or error.get("code") or "")
        elif isinstance(error, str):
            detail = error
    except ValueError:
        detail = (response.text or "")[:240]
    detail = re.sub(r"\s+", " ", detail).strip()[:240]

    if status == 413:
        # Groq answers 413 when the tokens-per-minute limit is hit, not only
        # when the request body is too large.
        return (
            "Your CV and the job data were too big for the AI service's free "
            "limit. Try again in a minute, or use a shorter CV."
            + (f" ({detail})" if detail else "")
        )
    if status == 429:
        return "The AI review is busy right now. Wait a minute and try again."
    if status in (401, 403):
        return (
            "The AI service did not accept our login. "
            "This is a problem on our side, so please try again later."
        )
    if detail:
        return f"The AI service returned an error (code {status}). {detail}"
    return f"The AI service returned an error (code {status})."

"""Environment settings, read in one place.

The project's `.env` is loaded the first time anything here is read. Every
accessor reads the live environment, so a value changed in the environment
(for example by a test) applies to the next call without a restart.

Required keys are not checked at startup on purpose. Searching works without
an AI key, so a missing key is reported when the feature that needs it is
used, not by refusing to boot.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from job_schema import load_env


class MissingSettingError(RuntimeError):
    """A key the requested feature needs is not set."""


DEFAULT_LLM_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_LLM_MODEL = "openai/gpt-oss-120b"
DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:3001,http://127.0.0.1:3001"
)


@lru_cache(maxsize=1)
def _load_dotenv_once() -> None:
    load_env()


def get(name: str, default: str = "") -> str:
    """The raw value of an environment variable (after loading `.env`)."""
    _load_dotenv_once()
    return os.getenv(name, default)


def get_stripped(name: str) -> str:
    return get(name).strip()


def get_int(name: str, default: int) -> int:
    """An integer setting. A value that is not a number stops the app loudly."""
    return int(get(name, str(default)))


# --- job boards ----------------------------------------------------------------


def reed_api_key() -> str:
    return get_stripped("REED_API_KEY")


def adzuna_credentials() -> tuple[str, str]:
    return get_stripped("ADZUNA_APP_ID"), get_stripped("ADZUNA_APP_KEY")


# --- the AI service ------------------------------------------------------------


@dataclass(frozen=True)
class LlmConfig:
    api_key: str
    base_url: str
    model: str


def llm_api_key() -> str:
    return get_stripped("LLM_API_KEY")


def llm_config() -> LlmConfig:
    return LlmConfig(
        api_key=llm_api_key(),
        base_url=get("LLM_BASE_URL", DEFAULT_LLM_BASE_URL).rstrip("/"),
        model=get("LLM_MODEL", DEFAULT_LLM_MODEL),
    )


# --- where the app runs ----------------------------------------------------------


def app_env() -> str:
    """The environment name: "local" on a developer machine, anything else is production.

    The default is production on purpose, so a setting that was forgotten on a
    server leaves the safe behaviour on (no dev sign-in shortcut, no API docs).
    """
    return get_stripped("APP_ENV").lower() or "production"


def is_local() -> bool:
    return app_env() == "local"


def api_docs_enabled() -> bool:
    """The interactive API docs are for developers, so they are off in production."""
    return is_local() or get_stripped("ENABLE_API_DOCS") == "1"


# --- the API ---------------------------------------------------------------------


def analyze_api_key() -> str:
    """Optional shared key for /analyze, for scripts only.

    A browser app cannot keep it secret, so the website does not use it. Empty
    means the endpoint is open to guests.
    """
    return get_stripped("ANALYZE_API_KEY")


def cors_origins() -> list[str]:
    raw = get("CORS_ALLOW_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def log_level() -> str:
    return get_stripped("LOG_LEVEL").upper() or "INFO"


# --- Clerk (sign-in) --------------------------------------------------------------


def clerk_issuer() -> str | None:
    """The Clerk address that signs sign-in tokens, such as https://xxx.clerk.accounts.dev."""
    return get_stripped("CLERK_ISSUER").rstrip("/") or None


def clerk_jwks_url() -> str:
    """Where Clerk publishes its signing keys. Defaults to the issuer's standard address."""
    return get_stripped("CLERK_JWKS_URL")


def clerk_authorized_parties() -> list[str]:
    """Websites allowed to use a token (the token's `azp`). Empty means no check."""
    raw = get("CLERK_AUTHORIZED_PARTIES")
    return [party.strip().rstrip("/") for party in raw.split(",") if party.strip()]


def clerk_dev_bypass_requested() -> bool:
    """Whether CLERK_DEV_BYPASS=1 is set, whatever the environment."""
    return get_stripped("CLERK_DEV_BYPASS") == "1"


def clerk_dev_bypass() -> bool:
    """The developer sign-in shortcut ("Bearer user_..."). Works only when APP_ENV is local."""
    return is_local() and clerk_dev_bypass_requested()

"""Clerk-authenticated user profile routes and sponsor-check."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from rapidfuzz import fuzz, process

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from clean_names import clean_company_name  # noqa: E402
from match_sponsors import SOURCE_PLATFORM_NAMES, load_sponsor_keys  # noqa: E402
from name_verify import verify_identity  # noqa: E402

from . import user_store  # noqa: E402

router = APIRouter(tags=["user"])


def _clerk_issuer() -> str | None:
    explicit = (os.getenv("CLERK_ISSUER") or "").strip().rstrip("/")
    return explicit or None


def _jwks_url() -> str | None:
    url = (os.getenv("CLERK_JWKS_URL") or "").strip()
    if url:
        return url
    issuer = _clerk_issuer()
    if issuer:
        return f"{issuer}/.well-known/jwks.json"
    return None


def _issuer_from_token(token: str) -> str | None:
    try:
        import jwt
    except ImportError:
        return None
    try:
        claims = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": False,
            },
        )
    except Exception:
        return None
    iss = claims.get("iss")
    return iss.rstrip("/") if isinstance(iss, str) and iss else None


def _verify_clerk_jwt(token: str) -> dict[str, Any]:
    jwks_url = _jwks_url()
    issuer = _clerk_issuer()

    if not jwks_url:
        token_issuer = _issuer_from_token(token)
        if token_issuer:
            issuer = issuer or token_issuer
            jwks_url = f"{token_issuer}/.well-known/jwks.json"

    if jwks_url:
        try:
            import jwt
            from jwt import PyJWKClient
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="PyJWT is required for Clerk JWT verification. pip install PyJWT",
            ) from exc

        try:
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decode_kwargs: dict[str, Any] = {
                "algorithms": ["RS256"],
                "options": {"verify_aud": False},
            }
            if issuer:
                decode_kwargs["issuer"] = issuer
            return jwt.decode(token, signing_key.key, **decode_kwargs)
        except Exception as exc:
            raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc

    if (os.getenv("CLERK_DEV_BYPASS") or "").strip() == "1":
        if token.startswith("user_"):
            return {"sub": token}
        raise HTTPException(status_code=401, detail="Dev bypass expects Bearer user_…")

    raise HTTPException(
        status_code=503,
        detail="Clerk auth is not configured. Set CLERK_JWKS_URL and CLERK_ISSUER on the API.",
    )


async def require_user(
    authorization: str | None = Header(default=None),
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1].strip()
    claims = _verify_clerk_jwt(token)
    sub = claims.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Token missing subject")
    return sub


class SavedSearchIn(BaseModel):
    role: str = Field(min_length=1, max_length=200)
    experience: str | None = None
    min_salary: float | None = None


class PreferencesIn(BaseModel):
    default_experience: str | None = None
    locations: str | None = None
    email_alerts: bool | None = None
    cv_filename: str | None = None
    is_new_entrant: bool | None = None


class LastMatchIn(BaseModel):
    role: str
    score: float | None = None
    gaps: list[dict[str, Any]] = Field(default_factory=list)
    sponsors: list[dict[str, Any]] = Field(default_factory=list)
    top_companies: list[dict[str, Any]] = Field(default_factory=list)
    requirement_frequencies: list[dict[str, Any]] = Field(default_factory=list)
    where_you_are: str | None = None
    jobs_total: int | None = None
    sponsor_count: int | None = None


@router.get("/me/saved-searches")
def get_saved(user_id: str = Depends(require_user)) -> dict[str, Any]:
    return {"items": user_store.list_saved_searches(user_id)}


@router.post("/me/saved-searches")
def create_saved(
    body: SavedSearchIn, user_id: str = Depends(require_user)
) -> dict[str, Any]:
    return user_store.add_saved_search(
        user_id, body.role, body.experience, body.min_salary
    )


@router.delete("/me/saved-searches/{search_id}")
def remove_saved(search_id: int, user_id: str = Depends(require_user)) -> dict[str, str]:
    ok = user_store.delete_saved_search(user_id, search_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Saved search not found")
    return {"status": "deleted"}


@router.get("/me/preferences")
def preferences_get(user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.get_preferences(user_id)


@router.put("/me/preferences")
def preferences_put(
    body: PreferencesIn, user_id: str = Depends(require_user)
) -> dict[str, Any]:
    return user_store.upsert_preferences(user_id, body.model_dump(exclude_none=True))


@router.get("/me/last-match")
def last_match_get(user_id: str = Depends(require_user)) -> dict[str, Any]:
    data = user_store.get_last_match(user_id)
    return data or {}


@router.put("/me/last-match")
def last_match_put(
    body: LastMatchIn, user_id: str = Depends(require_user)
) -> dict[str, Any]:
    return user_store.put_last_match(user_id, body.model_dump())


@router.get("/sponsor-check")
def sponsor_check(q: str) -> dict[str, Any]:
    """Public register lookup for the Sponsorship Checker tool."""
    query = (q or "").strip()
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Enter at least 2 characters.")

    key = clean_company_name(query)
    if not key:
        return {"query": query, "match": None, "note": "Could not normalise that name."}
    if key in SOURCE_PLATFORM_NAMES:
        return {
            "query": query,
            "match": None,
            "note": "That looks like a job board name, not an employer.",
        }

    _summary, keys, key_to_display = load_sponsor_keys()
    hits = process.extract(key, keys, scorer=fuzz.token_set_ratio, limit=5)
    if not hits:
        return {"query": query, "match": None, "note": "No register candidates."}

    best: dict[str, Any] | None = None
    for cand_key, score, _idx in hits:
        register_name = key_to_display.get(cand_key, cand_key)
        verdict, vscore = verify_identity(register_name, query)
        if verdict == "pass":
            best = {
                "register_name": register_name,
                "company_key": cand_key,
                "fuzzy_score": float(score),
                "verify_score": float(vscore),
                "confidence": "likely",
                "verdict": verdict,
            }
            break
        if best is None and verdict == "review" and float(score) >= 85:
            best = {
                "register_name": register_name,
                "company_key": cand_key,
                "fuzzy_score": float(score),
                "verify_score": float(vscore),
                "confidence": "possible",
                "verdict": verdict,
            }

    if not best:
        return {
            "query": query,
            "match": None,
            "note": "No confident match on the Skilled Worker register.",
            "candidates": [
                {"company_key": k, "fuzzy_score": float(s)} for k, s, _ in hits[:3]
            ],
        }
    return {"query": query, "match": best, "note": None}

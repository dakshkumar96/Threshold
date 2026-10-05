"""Signed-in routes (saved searches, preferences, last result) and the public sponsor check."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from rapidfuzz import fuzz, process

from clean_names import clean_company_name
from match_sponsors import (
    SOURCE_PLATFORM_NAMES,
    last_seen_on_register,
    latest_register_date,
    load_sponsor_keys,
    on_latest_register,
)
from name_verify import verify_identity

from . import user_store
from .auth import verify_clerk_jwt
from .security import check_account_rate, check_sponsor_check_rate

router = APIRouter(tags=["user"])

# A "review" match is only shown, as "possible", when the name score is at least this.
_POSSIBLE_MIN_SCORE = 85


def require_user(request: Request, authorization: str | None = Header(default=None)) -> str:
    """The signed-in user's id, taken from the Bearer token."""
    check_account_rate(request)
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    claims = verify_clerk_jwt(authorization.split(" ", 1)[1].strip())
    subject = claims.get("sub")
    if not subject or not isinstance(subject, str):
        raise HTTPException(status_code=401, detail="Token missing subject")
    return subject


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
def create_saved(body: SavedSearchIn, user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.add_saved_search(user_id, body.role, body.experience, body.min_salary)


@router.delete("/me/saved-searches/{search_id}")
def remove_saved(search_id: int, user_id: str = Depends(require_user)) -> dict[str, str]:
    if not user_store.delete_saved_search(user_id, search_id):
        raise HTTPException(status_code=404, detail="Saved search not found")
    return {"status": "deleted"}


@router.get("/me/preferences")
def preferences_get(user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.get_preferences(user_id)


@router.put("/me/preferences")
def preferences_put(body: PreferencesIn, user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.upsert_preferences(user_id, body.model_dump(exclude_none=True))


@router.get("/me/last-match")
def last_match_get(user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.get_last_match(user_id) or {}


@router.put("/me/last-match")
def last_match_put(body: LastMatchIn, user_id: str = Depends(require_user)) -> dict[str, Any]:
    return user_store.put_last_match(user_id, body.model_dump())


def _register_candidate(
    register_name: str, company_key: str, fuzzy: float, verify: float, confidence: str, verdict: str
) -> dict[str, Any]:
    return {
        "register_name": register_name,
        "company_key": company_key,
        "fuzzy_score": float(fuzzy),
        "verify_score": float(verify),
        "confidence": confidence,
        "verdict": verdict,
    }


def _day(value: Any) -> str:
    return f"{value.day} {value:%B %Y}"


def _left_register_note(register_name: str, company_key: str) -> str:
    last_seen = last_seen_on_register(company_key)
    latest = latest_register_date()
    if last_seen is None or latest is None:
        return f"{register_name} is not on the latest sponsor register."
    return (
        f"{register_name} was on the sponsor register until {_day(last_seen)}, but it is not "
        f"on the latest one from {_day(latest)}. It may have lost or given up its licence, "
        "or it may be listed under a new name."
    )


@router.get("/sponsor-check")
def sponsor_check(q: str, request: Request) -> dict[str, Any]:
    """Public register lookup for the Sponsorship Checker tool."""
    check_sponsor_check_rate(request)
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

    # The first candidate that passes the identity check wins. Failing that,
    # the first "review" candidate with a strong enough name score is offered
    # as a possible match. Only companies on the latest register count. One
    # that only appears on an older snapshot is reported as such instead.
    best: dict[str, Any] | None = None
    former: tuple[str, str] | None = None  # (register name, key) of a match that left the register
    for candidate_key, score, _index in hits:
        register_name = key_to_display.get(candidate_key, candidate_key)
        verdict, verify_score = verify_identity(register_name, query)
        strong_enough = verdict == "pass" or (verdict == "review" and float(score) >= _POSSIBLE_MIN_SCORE)
        if not on_latest_register(candidate_key):
            if former is None and strong_enough:
                former = (register_name, candidate_key)
            continue
        if verdict == "pass":
            best = _register_candidate(
                register_name, candidate_key, score, verify_score, "likely", verdict
            )
            break
        if best is None and strong_enough:
            best = _register_candidate(
                register_name, candidate_key, score, verify_score, "possible", verdict
            )

    if not best and former:
        return {
            "query": query,
            "match": None,
            "note": _left_register_note(*former),
            "candidates": [
                {"company_key": k, "fuzzy_score": float(s)} for k, s, _ in hits[:3]
            ],
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

"""Probe public ATS job boards and normalise responses."""

from __future__ import annotations

import re
from html import unescape
from typing import Any

import requests

TIMEOUT = 8
UA = "Threshold/1.0 (+https://threshold.local)"
HEADERS = {"User-Agent": UA}

# Greenhouse/Ashby skew tech; Workable/Recruitee cover SMBs and non-tech.
PROVIDERS = ["greenhouse", "ashby", "workable", "recruitee"]

LEGAL_SUFFIXES = {
    "ltd",
    "limited",
    "plc",
    "llp",
    "lp",
    "inc",
    "incorporated",
    "group",
    "holdings",
    "uk",
    "gb",
    "company",
    "co",
    "services",
    "international",
    "global",
}


def slug_variants(company_name: str) -> list[str]:
    """Generate plausible board tokens, most likely first."""
    base = re.sub(r"[^\w\s-]", "", company_name.lower()).strip()
    tokens = [t for t in base.split() if t]
    core = [t for t in tokens if t not in LEGAL_SUFFIXES] or tokens

    variants: list[str] = []

    def add(s: str) -> None:
        s = s.strip("-")
        if s and s not in variants and len(s) >= 2:
            variants.append(s)

    add("".join(core))
    add("-".join(core))
    if core:
        add(core[0])
    add("".join(tokens))
    if core:
        add(core[0] + "uk")
        add(core[0] + "-uk")

    return variants[:5]


def _clean_html(s: str) -> str:
    if not s:
        return ""
    text = unescape(s)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_greenhouse(token: str) -> dict[str, Any] | None:
    url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    if r.status_code != 200:
        return None
    raw = r.json().get("jobs") or []
    if not raw:
        return None
    return {
        "published_name": raw[0].get("company_name") or token,
        "jobs": [
            {
                "external_id": str(j.get("id")),
                "title": j.get("title", ""),
                "location": (j.get("location") or {}).get("name", ""),
                "description": _clean_html(j.get("content", "")),
                "url": j.get("absolute_url", ""),
                "updated_at": j.get("updated_at"),
                "department": ", ".join(
                    d.get("name", "") for d in (j.get("departments") or [])
                ),
            }
            for j in raw
        ],
    }


def fetch_ashby(token: str) -> dict[str, Any] | None:
    # PUBLIC posting API. No key, plain GET.
    url = (
        f"https://api.ashbyhq.com/posting-api/job-board/{token}"
        "?includeCompensation=true"
    )
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    if r.status_code != 200:
        return None
    data = r.json()
    raw = data.get("jobs") if isinstance(data, dict) else data
    if not raw:
        return None

    def _loc(j: dict) -> str:
        loc = j.get("location")
        if isinstance(loc, dict):
            return str(loc.get("name") or "")
        return str(loc or "")

    return {
        "published_name": (
            (data.get("name") if isinstance(data, dict) else None) or token
        ),
        "jobs": [
            {
                "external_id": str(j.get("id", "")),
                "title": j.get("title", ""),
                "location": _loc(j),
                "description": _clean_html(
                    j.get("descriptionHtml") or j.get("descriptionPlain") or ""
                ),
                "url": j.get("jobUrl", ""),
                "updated_at": j.get("publishedAt"),
                "department": j.get("department", "") or "",
            }
            for j in raw
        ],
    }


def fetch_workable(token: str) -> dict[str, Any] | None:
    url = f"https://www.workable.com/api/accounts/{token}?details=true"
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
    if r.status_code != 200:
        return None
    data = r.json()
    raw = data.get("jobs") or []
    if not raw:
        return None

    def _loc(j: dict) -> str:
        loc = j.get("location")
        if isinstance(loc, dict):
            parts = [loc.get("city"), loc.get("region"), loc.get("country")]
            return ", ".join(p for p in parts if p) or str(loc.get("city") or "")
        if loc:
            return str(loc)
        return str(j.get("city") or "")

    return {
        "published_name": data.get("name") or token,
        "jobs": [
            {
                "external_id": str(j.get("shortcode", "")),
                "title": j.get("title", ""),
                "location": _loc(j),
                "description": _clean_html(j.get("description", "")),
                "url": j.get("url", ""),
                "updated_at": j.get("published_on"),
                "department": j.get("department", "") or "",
            }
            for j in raw
        ],
    }


def fetch_recruitee(token: str) -> dict[str, Any] | None:
    url = f"https://{token}.recruitee.com/api/offers/"
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    if r.status_code != 200:
        return None
    raw = r.json().get("offers") or []
    if not raw:
        return None
    return {
        "published_name": token,
        "jobs": [
            {
                "external_id": str(j.get("id")),
                "title": j.get("title", ""),
                "location": j.get("location", "") or "",
                "description": _clean_html(j.get("description", "")),
                "url": j.get("careers_url", ""),
                "updated_at": j.get("published_at"),
                "department": j.get("department", "") or "",
            }
            for j in raw
        ],
    }


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "ashby": fetch_ashby,
    "workable": fetch_workable,
    "recruitee": fetch_recruitee,
}


def fetch_board(ats: str, token: str) -> dict[str, Any] | None:
    """Fetch a known board. Returns normalised dict or None if dead."""
    fn = FETCHERS.get(ats)
    if not fn:
        return None
    try:
        return fn(token)
    except Exception:
        return None


def probe(company_name: str) -> tuple[str, str, str, list[dict]] | None:
    """
    Try to find an ATS board for this company.
    Returns (ats, token, published_name, jobs) or None.
    Exits on first hit.
    """
    for token in slug_variants(company_name):
        for ats in PROVIDERS:
            result = fetch_board(ats, token)
            if result:
                return ats, token, result["published_name"], result["jobs"]
    return None

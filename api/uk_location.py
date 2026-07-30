"""UK location heuristics for ATS / aggregator job locations."""

from __future__ import annotations

import re

UK_CITIES = {
    "london",
    "manchester",
    "birmingham",
    "leeds",
    "glasgow",
    "edinburgh",
    "liverpool",
    "bristol",
    "sheffield",
    "cardiff",
    "belfast",
    "newcastle",
    "nottingham",
    "leicester",
    "coventry",
    "brighton",
    "cambridge",
    "oxford",
    "reading",
    "southampton",
    "portsmouth",
    "york",
    "bath",
    "aberdeen",
    "dundee",
    "swansea",
    "milton keynes",
    "slough",
    "watford",
    "croydon",
    "staines",
    "egham",
    "windsor",
    "guildford",
    "basingstoke",
    "swindon",
    "norwich",
    "exeter",
    "plymouth",
    "derby",
    "stoke",
    "wolverhampton",
    "sunderland",
    "hull",
    "preston",
    "luton",
    "northampton",
    "bournemouth",
}

UK_COUNTRIES = {
    "united kingdom",
    "uk",
    "u.k.",
    "great britain",
    "gb",
    "england",
    "scotland",
    "wales",
    "northern ireland",
}

# Explicitly NOT UK — checked before UK allowlist (blocks "york" inside "new york")
NON_UK = {
    "united states",
    "usa",
    "u.s.a.",
    "u.s.",
    "us",
    "canada",
    "australia",
    "new zealand",
    "india",
    "germany",
    "france",
    "spain",
    "netherlands",
    "ireland",
    "dublin",
    "singapore",
    "new york",
    "san francisco",
    "los angeles",
    "seattle",
    "chicago",
    "boston",
    "austin",
    "denver",
    "berlin",
    "paris",
    "amsterdam",
    "toronto",
    "vancouver",
    "montreal",
    "sydney",
    "melbourne",
    "brisbane",
    "perth",
    "auckland",
    "wellington",
    "christchurch",
    "bangalore",
    "bengaluru",
    "mumbai",
    "hyderabad",
    "remote - us",
    "remote - usa",
    "remote - united states",
    "remote - emea",
    "remote - europe",
    "remote - apac",
    "remote - anz",
    "apac",
    "latam",
    "anz",
}


def _word_match(needle: str, haystack: str) -> bool:
    return bool(re.search(rf"\b{re.escape(needle)}\b", haystack))


def is_uk(location_text: str) -> bool:
    """
    True if the location plausibly includes the UK.
    Conservative: bare 'Remote' returns False.
    """
    if not location_text:
        return False
    s = location_text.lower().strip()

    # Reject non-UK first (longest tokens first so "new york" wins over fragments)
    for token in sorted(NON_UK, key=len, reverse=True):
        if _word_match(token, s):
            return False

    for c in sorted(UK_COUNTRIES, key=len, reverse=True):
        if _word_match(c, s):
            return True

    for city in sorted(UK_CITIES, key=len, reverse=True):
        if city == "york":
            # Do not treat "New York" as York, UK (also covered by NON_UK)
            if re.search(r"(?<!\bnew )\byork\b", s):
                return True
        elif _word_match(city, s):
            return True

    if "remote" in s and any(
        k in s for k in ("uk", "united kingdom", "gb", "england", "scotland", "wales")
    ):
        return True

    return False


def board_has_uk_jobs(jobs: list[dict], threshold: int = 1) -> bool:
    """Does this board have at least N UK-located roles?"""
    return sum(1 for j in jobs if is_uk(j.get("location", ""))) >= threshold


def filter_uk(jobs: list[dict]) -> list[dict]:
    return [j for j in jobs if is_uk(j.get("location", ""))]

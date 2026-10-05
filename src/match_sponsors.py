"""Fuzzy-match job employers to Skilled Worker sponsors."""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Sequence
from functools import lru_cache
from pathlib import Path
from typing import NamedTuple

import pandas as pd
from rapidfuzz import fuzz, process

from name_verify import verify_identity

ROOT = Path(__file__).resolve().parent.parent

DEFAULT_SUMMARY = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"
DEFAULT_THRESHOLD = 80
LIKELY_THRESHOLD = 90
# process.extract's candidate pool. A short/generic query (e.g. "Wise") can tie at the
# max token_set_ratio score with 40+ unrelated register entries (e.g. "Brew Wise Ltd",
# "FF Wise Limited", "Wise Payments Limited" all score 100 against bare "wise") — too
# small a limit here silently drops the correct entry before _pick_best ever sees it.
CANDIDATE_LIMIT = 30
# When this many DISTINCT candidates all clear verify_identity's non-fail bar for the
# same query, no string-based re-ranking (this file's or verify_identity's) can reliably
# tell them apart — see the "Wise" case above, where the genuinely correct "Wise Payments
# Limited" scores WORSE on every string signal than several wrong candidates. Real
# disambiguation needs a second, independent signal (Companies House SIC/location) or
# embeddings — both out of scope without Companies House access (ACCURACY.md #1A/#1C).
# Until then, treat high ambiguity as a confidence signal, not a coin flip: cap at
# "review" (-> possible tier) instead of confidently asserting one arbitrary winner.
AMBIGUITY_MIN_CANDIDATES = 4

AGENCY_KEYWORDS = (
    "recruitment", "resourcing", "talent", "staffing", "recruiting",
    "recruiter", "recruiters", "headhunt", "search partners", "search & selection",
    "hr solutions", "personnel", "employment agency",
)

# Job board / aggregator names — never match these as employers
SOURCE_PLATFORM_NAMES = {
    "reed", "adzuna", "indeed", "totaljobs", "cv library", "glassdoor",
    "linkedin", "monster", "jobsite", "fish4jobs", "cwjobs",
}

COMPANY_STOPWORDS = {
    "the", "and", "of", "for", "group", "holdings", "international", "global",
    "uk", "services", "service", "solutions", "company", "co", "ltd", "limited",
    "plc", "llp", "inc", "partners", "consulting", "consultants", "management",
    "enterprises", "corporate",
}

# Whole-key abbreviation expansions (starter list, extend as collisions surface).
# Keyed by the *cleaned* company_key (post clean_company_name), so "PwC" -> "pwc".
# Applied to the full company_key, never as a substring match, to keep the blast
# radius small: this only fires when a job's employer key is exactly one of these
# abbreviations, expanding it to the register's likely full name before matching.
KNOWN_ALIASES: dict[str, str] = {
    "pwc": "pricewaterhousecoopers",
    "ey": "ernst young",
    "hsbc": "hsbc bank",
    "gsk": "glaxosmithkline",
    "m s": "marks spencer",  # "M&S" cleaned (punctuation -> space)
    "rbs": "royal bank scotland",
    "jlr": "jaguar land rover",
    "bbc": "british broadcasting corporation",
    "nhs": "national health service",
    "bt": "british telecommunications",
}

# Generic words that don't help identify a place (kept out of location matching).
_LOCATION_STOPWORDS = {
    "remote", "uk", "united", "kingdom", "england", "scotland", "wales",
    "northern", "ireland", "hybrid", "office", "based", "area", "and", "the",
    "greater", "city", "county", "region", "site", "sites", "various",
}


def _is_agency(name: str) -> bool:
    low = (name or "").lower()
    return any(kw in low for kw in AGENCY_KEYWORDS)


def _resolve_alias(key: str) -> str:
    """Expand a whole-key abbreviation (e.g. 'pwc' -> 'pricewaterhousecoopers')."""
    return KNOWN_ALIASES.get(key, key)


def _location_tokens(text: str | None) -> set[str]:
    if not text:
        return set()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", str(text).lower())
    return {t for t in cleaned.split() if len(t) >= 3 and t not in _LOCATION_STOPWORDS}


def _location_plausible(job_location: str | None, sponsor_town: str | None) -> bool:
    """
    Conservative geography check — a demotion signal for already-risky candidates,
    never a blanket filter. Missing/generic text on either side stays neutral (True):
    most employers post jobs from many sites, and the register's `town` is just a
    registered address, so a mismatch alone must never reject a strong name match.
    Only used for review-tier / rarest-token-fallback candidates (see `_pick_best`),
    where the name evidence is already weak enough that a second signal is worth
    the recall cost.
    """
    job_tokens = _location_tokens(job_location)
    town_tokens = _location_tokens(sponsor_town)
    if not job_tokens or not town_tokens:
        return True
    if job_tokens & town_tokens:
        return True
    return any(jt in tt or tt in jt for jt in job_tokens for tt in town_tokens)


def _is_platform(key: str) -> bool:
    """True when the cleaned company key is a job board, not an employer."""
    return key.strip() in SOURCE_PLATFORM_NAMES


def _build_token_freq(keys: list[str]) -> Counter[str]:
    freq: Counter[str] = Counter()
    for key in keys:
        for token in key.split():
            if token not in COMPANY_STOPWORDS and len(token) > 1:
                freq[token] += 1
    return freq


def _stripped_key(key: str) -> str:
    tokens = [t for t in key.split() if t not in COMPANY_STOPWORDS and len(t) > 1]
    return " ".join(tokens) if tokens else key


def _rarest_token(key: str, freq: Counter[str]) -> str:
    tokens = [t for t in key.split() if t not in COMPANY_STOPWORDS and len(t) > 2]
    if not tokens:
        return ""
    return min(tokens, key=lambda t: freq.get(t, 999_999))


def _match_candidates(
    key: str,
    keys: list[str],
    token_freq: Counter[str],
    threshold: int,
    limit: int = CANDIDATE_LIMIT,
) -> list[tuple[str, float, bool]]:
    """Return up to `limit` (candidate_key, score, is_fallback) triples, best-first."""
    if not key:
        return []

    stripped = _stripped_key(key)
    hits = process.extract(
        stripped,
        keys,
        scorer=fuzz.token_set_ratio,
        score_cutoff=threshold,
        limit=limit,
    )
    if hits:
        return [(h[0], float(h[1]), False) for h in hits]

    # Rarest-token fallback: filter to keys containing the rarest token, then re-rank.
    # Weaker evidence than the primary path (single rare-token collision risk) — tagged
    # so _pick_best can require a second signal before promoting these to "possible".
    rare = _rarest_token(stripped, token_freq)
    if not rare:
        return []

    candidates = [k for k in keys if rare in k.split()]
    if not candidates:
        return []

    fallback = process.extract(
        stripped,
        candidates,
        scorer=fuzz.token_set_ratio,
        score_cutoff=max(threshold - 5, 80),
        limit=limit,
    )
    return [(h[0], float(h[1]), True) for h in fallback] if fallback else []


def _pick_best(
    candidates: Sequence[tuple[str, float, bool]],
    company_raw: str,
    key_to_display: dict[str, str],
    job_location: str | None = None,
    town_by_key: dict[str, str] | None = None,
) -> tuple[str | None, float | None, str]:
    """
    Re-rank candidates by verify_identity and return (best_key, best_score, verdict).
    Preference order: pass > review > fail, then by fuzzy score.

    Rarest-token-fallback candidates get a second, independent signal — register-town
    vs job-location plausibility — before they're allowed to survive at all, since a
    single shared rare token is much weaker evidence than the primary name-match path.
    This is deliberately scoped to fallback candidates only: a general "review" verdict
    from verify_identity already means "shown as possible, not confident", and testing
    against real data showed gating on location there mostly punished legitimate
    multi-site employers (a job's posted location routinely differs from the sponsor
    register's single registered-office town) rather than catching bad matches — those
    are already caught by the full-name corroboration in verify_identity itself.
    """
    if not candidates:
        return None, None, "fail"

    town_by_key = town_by_key or {}
    ranked: list[tuple[int, str, float, str]] = []  # (tier, key, score, verdict)
    for ck, score, is_fallback in candidates:
        display = key_to_display.get(ck, ck)
        verdict, _ = verify_identity(display, company_raw)

        if is_fallback and verdict != "pass" and not _location_plausible(
            job_location, town_by_key.get(ck)
        ):
            verdict = "fail"

        tier = {"pass": 0, "review": 1, "fail": 2}[verdict]
        ranked.append((tier, ck, score, verdict))

    ranked.sort(key=lambda x: (x[0], -x[2]))
    _, best_key, best_score, best_verdict = ranked[0]

    if best_verdict == "fail":
        return None, None, "fail"

    # Name-ambiguity guard (see AMBIGUITY_MIN_CANDIDATES): several distinct, equally
    # plausible register entries survived verify_identity for this one query. Picking
    # the "best" one is arbitrary at that point, so don't let it read as confident.
    plausible_keys = {ck for _, ck, _, verdict in ranked if verdict != "fail"}
    if best_verdict == "pass" and len(plausible_keys) >= AMBIGUITY_MIN_CANDIDATES:
        best_verdict = "review"

    return best_key, best_score, best_verdict


def _classify_match(
    score: float | None,
    agency: bool,
    verify_verdict: str = "pass",
) -> tuple[bool, bool, str | None]:
    """Return (is_sponsor, is_possible_sponsor, sponsor_confidence)."""
    if score is None or score < DEFAULT_THRESHOLD:
        return False, False, None
    if agency:
        return False, True, "possible"
    # Downgrade to possible when identity check is only 'review'
    if verify_verdict == "review":
        return False, True, "possible"
    if score >= LIKELY_THRESHOLD:
        return True, False, "likely"
    return False, True, "possible"


@lru_cache(maxsize=2)
def load_sponsor_keys(
    summary_path: Path = DEFAULT_SUMMARY,
) -> tuple[pd.DataFrame, list[str], dict[str, str]]:
    """The register summary, its company keys and a readable name for each.

    Loaded once per file. The result is shared, so treat it as read-only.
    """
    summary = pd.read_parquet(summary_path)
    keys = (
        summary["company_key"]
        .dropna()
        .astype(str)
        .loc[lambda s: s.str.len() > 0]
        .unique()
        .tolist()
    )
    key_to_display = {}
    if "example_name" in summary.columns:
        key_to_display = {
            str(r.company_key): str(r.example_name or r.company_key)
            for r in summary.drop_duplicates("company_key").itertuples()
            if str(getattr(r, "company_key", "")).strip()
        }
    else:
        key_to_display = {k: k for k in keys}
    return summary, keys, key_to_display


class _SponsorIndex(NamedTuple):
    summary_by_key: pd.DataFrame
    keys: list[str]
    key_to_display: dict[str, str]
    token_freq: Counter[str]
    town_by_key: dict[str, str]
    # Companies on the latest register. The others were on an older snapshot only.
    active_keys: frozenset[str]


@lru_cache(maxsize=2)
def _sponsor_index(summary_path: Path) -> _SponsorIndex:
    """Everything matching needs from the register, built once per file."""
    summary, keys, key_to_display = load_sponsor_keys(summary_path)
    summary_by_key = summary.drop_duplicates("company_key").set_index("company_key")
    town_by_key: dict[str, str] = (
        summary_by_key["town"].astype(str).to_dict() if "town" in summary_by_key.columns else {}
    )
    if "still_active" in summary_by_key.columns:
        active_keys = frozenset(summary_by_key.index[summary_by_key["still_active"].fillna(False).astype(bool)])
    else:
        active_keys = frozenset(summary_by_key.index)
    return _SponsorIndex(
        summary_by_key, keys, key_to_display, _build_token_freq(keys), town_by_key, active_keys
    )


def on_latest_register(key: str, summary_path: Path = DEFAULT_SUMMARY) -> bool:
    """Whether a company is on the latest register, so it can sponsor a visa today.

    The summary keeps every company seen in any snapshot since 2023. A company
    missing from the latest one may have lost or given up its licence.
    """
    return key in _sponsor_index(summary_path).active_keys


def last_seen_on_register(key: str, summary_path: Path = DEFAULT_SUMMARY) -> pd.Timestamp | None:
    summary_by_key = _sponsor_index(summary_path).summary_by_key
    if key not in summary_by_key.index or "last_seen" not in summary_by_key.columns:
        return None
    return pd.Timestamp(summary_by_key.at[key, "last_seen"])


@lru_cache(maxsize=2)
def latest_register_date(summary_path: Path = DEFAULT_SUMMARY) -> pd.Timestamp | None:
    """The date of the newest register snapshot the summary was built from."""
    summary_by_key = _sponsor_index(summary_path).summary_by_key
    if "last_seen" not in summary_by_key.columns or summary_by_key.empty:
        return None
    return pd.Timestamp(summary_by_key["last_seen"].max())


@lru_cache(maxsize=4096)
def _register_candidates(summary_path: Path, key: str, threshold: int) -> tuple[tuple[str, float, bool], ...]:
    """The register names close to one employer key.

    Scanning all 133,979 register names is the slow part of a search, and the
    answer depends only on the key, so it is worked out once per key. Many ads
    in one search share an employer, and popular employers come up again in
    later searches. Everything that depends on the ad itself (its location and
    the exact employer name) is still checked for every ad in `_pick_best`.
    """
    index = _sponsor_index(summary_path)
    return tuple(_match_candidates(key, index.keys, index.token_freq, threshold))


def match_jobs_to_sponsors(
    jobs: pd.DataFrame,
    summary_path: Path = DEFAULT_SUMMARY,
    threshold: int = DEFAULT_THRESHOLD,
) -> pd.DataFrame:
    """
    Add sponsor match columns to a jobs dataframe.

    Changes vs previous version:
    - Platform self-match excluded (Gap 3): 'reed', 'adzuna', etc. never match.
    - Top-5 re-ranked by verify_identity (Gap 5): picks the best semantic match,
      not the one whose tokens are a superset.
    - verify_verdict='review' forces sponsor_confidence='possible' max.
    - Agency classification unchanged: checked on company_raw and company_key.
    - Known abbreviations (KNOWN_ALIASES) expanded before matching.
    - Rarest-token-fallback and review-tier candidates get a second, independent
      signal (register town vs job location) before being accepted; a mismatch on
      an already-weak match demotes it to 'fail' (see _pick_best).
    """
    extra_cols = (
        "match_score", "matched_company_key", "is_sponsor",
        "is_possible_sponsor", "sponsor_confidence",
        "still_active", "first_seen", "last_seen",
    )
    if jobs.empty:
        out = jobs.copy()
        for col in extra_cols:
            if col not in out.columns:
                out[col] = pd.Series(dtype="object")
        return out

    index = _sponsor_index(summary_path)
    summary_by_key, key_to_display, town_by_key = index.summary_by_key, index.key_to_display, index.town_by_key

    scores: list[float | None] = []
    matched_keys: list[str | None] = []
    is_sponsor: list[bool] = []
    is_possible: list[bool] = []
    confidences: list[str | None] = []

    existing_conf = (
        jobs["sponsor_confidence"] if "sponsor_confidence" in jobs.columns else None
    )

    for i, (_, row) in enumerate(jobs.iterrows()):
        key = str(row.get("company_key") or "").strip()
        raw = str(row.get("company_raw") or row.get("company") or "")
        agency = _is_agency(raw) or _is_agency(key)
        # Expand whole-key abbreviations (PwC, EY, HSBC, ...) before matching so both
        # retrieval and verify_identity compare against the register's full legal name.
        resolved_key = _resolve_alias(key)
        resolved_raw = KNOWN_ALIASES.get(key, raw)
        job_location = row.get("location")

        prior = None
        if existing_conf is not None:
            raw_conf = existing_conf.iloc[i]
            if raw_conf is not None and not (isinstance(raw_conf, float) and pd.isna(raw_conf)):
                prior = str(raw_conf)

        # A job from an employer's own careers board proves who the employer is,
        # but only the register says whether it may sponsor. So "verified" needs
        # the employer to be on the latest register. Any other careers-board job
        # goes through the same name match as an ad from a job board.
        if prior == "verified" and key in index.active_keys:
            scores.append(None)
            matched_keys.append(key)
            is_sponsor.append(True)
            is_possible.append(False)
            confidences.append("verified")
            continue

        # Skip platform names to prevent self-match (Gap 3)
        if _is_platform(key):
            scores.append(None)
            matched_keys.append(None)
            is_sponsor.append(False)
            is_possible.append(False)
            confidences.append(None)
            continue

        candidates = _register_candidates(summary_path, resolved_key, threshold)
        mk, sc, verify_verdict = _pick_best(
            candidates, resolved_raw, key_to_display, job_location, town_by_key
        )

        scores.append(sc)
        matched_keys.append(mk)

        # No match, or the match is only on an older snapshot of the register:
        # a company that left it cannot sponsor a new visa, so no sponsor claim.
        if mk is None or mk not in index.active_keys:
            is_sponsor.append(False)
            is_possible.append(False)
            confidences.append(None)
        else:
            sp, poss, conf = _classify_match(sc, agency, verify_verdict)
            is_sponsor.append(sp)
            is_possible.append(poss)
            confidences.append(conf)

    out = jobs.copy()
    out["match_score"] = scores
    out["matched_company_key"] = matched_keys
    out["is_sponsor"] = is_sponsor
    out["is_possible_sponsor"] = is_possible
    out["sponsor_confidence"] = confidences

    out["still_active"] = out["matched_company_key"].map(
        lambda k: summary_by_key.at[k, "still_active"] if k in summary_by_key.index else None
    )
    out["first_seen"] = out["matched_company_key"].map(
        lambda k: summary_by_key.at[k, "first_seen"] if k in summary_by_key.index else None
    )
    out["last_seen"] = out["matched_company_key"].map(
        lambda k: summary_by_key.at[k, "last_seen"] if k in summary_by_key.index else None
    )
    return out


if __name__ == "__main__":
    _, keys, _ = load_sponsor_keys()
    print("Sponsor keys:", len(keys))

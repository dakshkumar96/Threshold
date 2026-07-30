"""Fuzzy-match job employers to Skilled Worker sponsors."""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

import pandas as pd
from rapidfuzz import fuzz, process

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from name_verify import verify_identity  # noqa: E402

DEFAULT_SUMMARY = ROOT / "data" / "processed" / "sponsor_company_summary.parquet"
DEFAULT_THRESHOLD = 80
LIKELY_THRESHOLD = 90

AGENCY_KEYWORDS = ("recruitment", "resourcing", "talent", "staffing", "recruiting")

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


def _is_agency(name: str) -> bool:
    low = (name or "").lower()
    return any(kw in low for kw in AGENCY_KEYWORDS)


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
    limit: int = 5,
) -> list[tuple[str, float]]:
    """Return up to `limit` (candidate_key, score) pairs, best-first."""
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
        return [(h[0], float(h[1])) for h in hits]

    # Rarest-token fallback: filter to keys containing the rarest token, then re-rank
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
    return [(h[0], float(h[1])) for h in fallback] if fallback else []


def _pick_best(
    candidates: list[tuple[str, float]],
    company_raw: str,
    key_to_display: dict[str, str],
) -> tuple[str | None, float | None, str]:
    """
    Re-rank candidates by verify_identity and return (best_key, best_score, verdict).
    Preference order: pass > review > fail, then by fuzzy score.
    """
    if not candidates:
        return None, None, "fail"

    ranked: list[tuple[int, str, float, str]] = []  # (tier, key, score, verdict)
    for ck, score in candidates:
        display = key_to_display.get(ck, ck)
        verdict, _ = verify_identity(display, company_raw)
        tier = {"pass": 0, "review": 1, "fail": 2}[verdict]
        ranked.append((tier, ck, score, verdict))

    ranked.sort(key=lambda x: (x[0], -x[2]))
    _, best_key, best_score, best_verdict = ranked[0]

    if best_verdict == "fail":
        return None, None, "fail"
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


def load_sponsor_keys(
    summary_path: Path = DEFAULT_SUMMARY,
) -> tuple[pd.DataFrame, list[str], dict[str, str]]:
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

    summary, keys, key_to_display = load_sponsor_keys(summary_path)
    summary_by_key = summary.drop_duplicates("company_key").set_index("company_key")
    token_freq = _build_token_freq(keys)

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

        prior = None
        if existing_conf is not None:
            raw_conf = existing_conf.iloc[i]
            if raw_conf is not None and not (isinstance(raw_conf, float) and pd.isna(raw_conf)):
                prior = str(raw_conf)

        if prior == "verified":
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

        candidates = _match_candidates(key, keys, token_freq, threshold)
        mk, sc, verify_verdict = _pick_best(candidates, raw, key_to_display)

        scores.append(sc)
        matched_keys.append(mk)

        if mk is None:
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

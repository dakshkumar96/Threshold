"""Symmetric identity check for ATS board names vs register display names.

token_sort_ratio (symmetric) rather than token_set_ratio catches subset matches
that scored 100 before (e.g. 'blue' vs 'Blue Nile', 'care' vs 'array-behavioral-care').
Bidirectional token coverage is a second guard: if the board has many extra tokens
not in the register name, or vice versa, it signals a wrong match.
"""

from __future__ import annotations

import sys
from pathlib import Path

from rapidfuzz import fuzz

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from clean_names import clean_company_name  # noqa: E402

_STOPWORDS = {
    "the", "and", "of", "for", "group", "holdings", "international", "global",
    "uk", "services", "service", "solutions", "company", "co", "ltd", "limited",
    "plc", "llp", "inc", "partners", "consulting", "consultants", "management",
    "enterprises", "corporate",
}


def _core_tokens(name: str) -> set[str]:
    """Clean + drop stopwords → set of meaningful tokens (min 2 chars)."""
    cleaned = clean_company_name(name)
    return {t for t in cleaned.split() if len(t) >= 2 and t not in _STOPWORDS}


# Stopword stripping (in _core_tokens) can collapse two genuinely different companies
# to identical core-token sets — e.g. "Wise" (the fintech) and "Wise Consulting Group Ltd"
# both reduce to {"wise"} once "consulting"/"group" are stripped as stopwords. Below this
# ratio on the FULL cleaned name (stopwords retained), a core-token match doesn't get to
# stand alone — it needs corroboration. Calibrated against name_verify.py's own __main__
# cases: legitimate brand-vs-legal-name matches (Monzo Bank Limited vs Monzo, 66.7) clear
# it; short-token collisions (Array Care Services Ltd vs array-behavioral-care, 55.0; Wise
# Consulting Group Ltd vs Wise, 32.0) don't.
FULL_RATIO_FLOOR = 60.0


def verify_identity(register_name: str, published_name: str) -> tuple[str, float]:
    """
    Compare a register display name against a published ATS board name.

    Returns (verdict, score):
      'pass'   – strong match; safe to mark verified
      'review' – ambiguous; demote to unverified for human review
      'fail'   – clear mismatch; block from cache

    Rules (applied in order):
      pass   if token_sort_ratio >= 90 on rich (2+ token) core sets, or on thin core sets
             / coverage-based matches when the FULL cleaned name also corroborates
             (>= FULL_RATIO_FLOOR)
      fail   if either token coverage < 0.4
      review otherwise

    Both 'fail' and 'review' are treated as non-live (fail-closed).
    """
    a = _core_tokens(register_name)
    b = _core_tokens(published_name)

    a_str = " ".join(sorted(a)) if a else clean_company_name(register_name)
    b_str = " ".join(sorted(b)) if b else clean_company_name(published_name)

    ratio = float(fuzz.token_sort_ratio(a_str, b_str))

    if not a or not b:
        if ratio >= 90:
            return "pass", ratio
        if ratio >= 70:
            return "review", ratio
        return "fail", ratio

    full_a = clean_company_name(register_name)
    full_b = clean_company_name(published_name)
    full_ratio = float(fuzz.token_sort_ratio(full_a, full_b)) if full_a and full_b else ratio
    corroborated = full_ratio >= FULL_RATIO_FLOOR

    common = a & b
    cov_a = len(common) / len(a)  # fraction of register tokens found in board
    cov_b = len(common) / len(b)  # fraction of board tokens found in register
    rich = len(a) >= 2 and len(b) >= 2  # 2+ distinguishing tokens each side — low collision risk

    # Near-identical ratio on richer token sets is very unlikely to be coincidental and
    # stands on its own. Thin core-token sets (<=1 token per side) need the full-name
    # corroboration since that's exactly where stopword collapse creates false positives.
    if ratio >= 90 and (rich or corroborated):
        return "pass", ratio

    # Coverage-based branches are inherently weaker (partial-overlap) signals, so always
    # corroborate against the full name — this is what stops "Array Care Services Ltd"
    # matching "array-behavioral-care" (cov_a=1.0, but the extra token "behavioral" is
    # invisible once stopwords collapse both names to {"array", "care"}).
    if corroborated:
        # most board tokens found in register (brand shorter than legal name)...
        if cov_b >= 0.75:
            return "pass", ratio
        # ...or solid bidirectional coverage (60 %+ each way).
        if cov_a >= 0.6 and cov_b >= 0.6:
            return "pass", ratio

    # fail: meaningful tokens in one name simply don't appear in the other.
    if cov_a < 0.4 or cov_b < 0.4:
        return "fail", ratio
    return "review", ratio


if __name__ == "__main__":
    # Quick sanity check on known cases
    cases = [
        ("MAN GROUP PLC", "Man Group", "pass"),
        ("LUSH HANDMADE COSMETICS LTD", "Lush Handmade Cosmetics", "pass"),
        ("BLUE RIDGE ANALYTICS LTD", "Blue Nile", "fail"),
        # Array Care vs array-behavioral-care: coverage alone still looks strong
        # (cov_a=1.0), so this lands on "review" rather than a hard "fail" — both are
        # non-live/fail-closed, which is what matters in the product.
        ("ARRAY CARE SERVICES LTD", "array-behavioral-care", "review"),
        ("NTT UK SERVICES LTD", "NTT DATA USA Inc", "fail"),
        ("MONZO BANK LIMITED", "Monzo", "pass"),
        # Adversarial short-token collisions named in ACCURACY.md: stopword stripping
        # collapses both sides to a single shared word, but the full names diverge.
        ("WISE CONSULTING GROUP LTD", "Wise", "review"),
        ("CARE UK HEALTHCARE LTD", "Care", "review"),
        # Legitimate thin-core match (exact abbreviation, not a collision) must still pass.
        ("QA LIMITED", "QA", "pass"),
    ]
    for reg, board, expected in cases:
        verdict, score = verify_identity(reg, board)
        status = "OK" if verdict == expected else f"UNEXPECTED (want {expected})"
        print(f"  {status}: ({verdict}, {score:.0f})  {reg!r} vs {board!r}")

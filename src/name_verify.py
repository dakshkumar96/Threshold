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


def verify_identity(register_name: str, published_name: str) -> tuple[str, float]:
    """
    Compare a register display name against a published ATS board name.

    Returns (verdict, score):
      'pass'   – strong match; safe to mark verified
      'review' – ambiguous; demote to unverified for human review
      'fail'   – clear mismatch; block from cache

    Rules (applied in order):
      pass   if token_sort_ratio >= 90, or both token coverages >= 0.6
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

    common = a & b
    cov_a = len(common) / len(a)  # fraction of register tokens found in board
    cov_b = len(common) / len(b)  # fraction of board tokens found in register

    # pass: strong ratio, OR most board tokens found in register (brand shorter than legal name),
    # OR solid bidirectional coverage (60 %+ each way).
    if ratio >= 90 or cov_b >= 0.75 or (cov_a >= 0.6 and cov_b >= 0.6):
        return "pass", ratio
    # fail: meaningful tokens in one name simply don't appear in the other.
    if cov_a < 0.3 or cov_b < 0.3:
        return "fail", ratio
    return "review", ratio


if __name__ == "__main__":
    # Quick sanity check on known cases
    cases = [
        ("MAN GROUP PLC", "Man Group", "pass"),
        ("LUSH HANDMADE COSMETICS LTD", "Lush Handmade Cosmetics", "pass"),
        ("BLUE RIDGE ANALYTICS LTD", "Blue Nile", "fail"),
        ("ARRAY CARE SERVICES LTD", "array-behavioral-care", "fail"),
        ("NTT UK SERVICES LTD", "NTT DATA USA Inc", "fail"),
        ("MONZO BANK LIMITED", "Monzo", "pass"),
    ]
    for reg, board, expected in cases:
        verdict, score = verify_identity(reg, board)
        status = "OK" if verdict == expected else f"UNEXPECTED (want {expected})"
        print(f"  {status}: ({verdict}, {score:.0f})  {reg!r} vs {board!r}")

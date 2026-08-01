"""Smoke checks for UK location heuristics."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from api.uk_location import is_uk  # noqa: E402

CASES = [
    ("New York", False),
    ("Auckland", False),
    ("London", True),
    ("York, UK", True),
    ("York", True),
    ("Remote - UK", True),
    ("Remote", False),
    ("Wellington, New Zealand", False),
]


def main() -> int:
    failed = 0
    for text, expected in CASES:
        got = is_uk(text)
        status = "OK" if got == expected else "FAIL"
        if got != expected:
            failed += 1
        print(f"{status}: is_uk({text!r}) -> {got} (expected {expected})")
    if failed:
        print(f"\n{failed} failure(s)")
        return 1
    print(f"\nAll {len(CASES)} checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

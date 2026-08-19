"""Offline, LLM-assisted skill-alias expansion — proposals only, human spot-check required.

`SKILL_ALIASES` in `src/dynamic_skills.py` is a closed alias list: any skill phrased
differently than what's already in the list is invisible to skill extraction, which
under-counts recall by construction (ACCURACY.md problem #3A). This script asks the
configured LLM for plausible alternative phrasings of each *existing* canonical skill
(abbreviations, spacing/punctuation variants, British/American spelling, common
shorthand) as they might appear in a real UK job ad — it does not invent new skills.

This writes a CSV for a human to review; it never edits `SKILL_ALIASES` directly.
Approved rows should be copied into `src/dynamic_skills.py` by hand.

Usage (from repo root):
  .\\.venv\\Scripts\\python.exe scripts\\expand_skill_aliases.py [--n-per-skill 5] [--batch-size 12]

Requires LLM_API_KEY (see README). Does not print secrets.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from dynamic_skills import SKILL_ALIASES  # noqa: E402
from job_schema import load_env  # noqa: E402

OUT_PATH = ROOT / "data" / "processed" / "skill_alias_candidates.csv"

SYSTEM_PROMPT = (
    "You expand a UK job-ad skill-matching alias list. For each canonical skill name "
    "given, propose short alternative phrasings that a real UK job advert might use for "
    "that exact same skill — abbreviations, spacing/punctuation variants, British vs "
    "American spelling, common shorthand. Do NOT propose a different or broader skill, "
    "a related tool, or a skill category. Do NOT propose anything already listed as an "
    "existing alias for that skill. Reply as compact JSON only: "
    '{"Skill Name": ["variant1", "variant2"], ...} — lowercase variants, no commentary.'
)


def _canonical_skills() -> list[str]:
    return sorted(set(SKILL_ALIASES.values()))


def _existing_aliases_by_canonical() -> dict[str, set[str]]:
    """Keyed by lowercased canonical name — the LLM doesn't reliably echo back the
    exact casing/formatting of the canonical skill names it was given."""
    out: dict[str, set[str]] = {}
    for alias, canonical in SKILL_ALIASES.items():
        out.setdefault(canonical.lower(), set()).add(alias.lower())
    return out


def _chunk(items: list[str], size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _call_llm(skills: list[str], n_per_skill: int, api_key: str, base: str, model: str) -> dict:
    user_prompt = (
        f"Propose up to {n_per_skill} alternative phrasings per skill for these canonical "
        f"skills:\n" + "\n".join(f"- {s}" for s in skills)
    )
    r = requests.post(
        f"{base}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 1200,
        },
        timeout=(15, 90),
    )
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"].strip()
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)
    return json.loads(content)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--n-per-skill", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=12)
    parser.add_argument("--delay", type=float, default=1.0, help="seconds between batches")
    args = parser.parse_args()

    load_env()
    api_key = os.getenv("LLM_API_KEY", "").strip()
    if not api_key:
        print("FAIL: LLM_API_KEY not set — see README for setup.")
        return 1
    base = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

    canonical = _canonical_skills()
    existing = _existing_aliases_by_canonical()
    print(f"{len(canonical)} canonical skills, batching {args.batch_size} per call, model={model}")

    rows: list[dict[str, str]] = []
    for batch_i, batch in enumerate(_chunk(canonical, args.batch_size)):
        try:
            result = _call_llm(batch, args.n_per_skill, api_key, base, model)
        except Exception as exc:  # noqa: BLE001 — best-effort offline tool, keep going
            print(f"  batch {batch_i}: FAILED ({exc}) — skipping")
            continue

        for skill, variants in result.items():
            canon = skill.strip()
            known = existing.get(canon.lower(), set())
            if not isinstance(variants, list):
                continue
            for variant in variants:
                v = str(variant).strip().lower()
                if not v or v == canon.lower():
                    continue
                rows.append(
                    {
                        "canonical_skill": canon,
                        "proposed_alias": v,
                        "already_in_list": "yes" if v in known else "no",
                        "approved": "",  # human fills in: y/n
                    }
                )
        print(f"  batch {batch_i}: {', '.join(batch)}")
        time.sleep(args.delay)

    new_only = [r for r in rows if r["already_in_list"] == "no"]
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["canonical_skill", "proposed_alias", "already_in_list", "approved"]
        )
        writer.writeheader()
        writer.writerows(rows)

    print(
        f"\nWrote {len(rows)} proposals ({len(new_only)} not already in SKILL_ALIASES) "
        f"to {OUT_PATH}"
    )
    print(
        "Review each row, fill 'approved' with y/n, then hand-copy approved "
        "canonical_skill/proposed_alias pairs into SKILL_ALIASES in src/dynamic_skills.py. "
        "This script never edits that file automatically."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

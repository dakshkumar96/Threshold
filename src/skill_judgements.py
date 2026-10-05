"""Fold an AI model's skill-by-skill judgement into the keyword match.

The keyword scan only sees literal words. It misses skills the CV shows in
other terms and cannot tell a mention in a skills list from real use. So the
model judges each top market skill from the work the CV describes, and its
calls are applied only where they can be checked against the CV text:

  - A keyword gap the model says the CV shows moves to matched, but only if
    the quote it gave as evidence is found in the CV. The score can rise on
    grounded evidence and never on an unsupported claim.
  - Remaining gaps get the model's blocking or nice-to-have call and its
    reason, with blocking gaps first.
  - Matched skills get a depth label (demonstrated, or only listed). This is
    shown to the reader and never lowers the score.
"""

from __future__ import annotations

import re
from typing import Any

from dynamic_skills import gap_suggestion
from llm_prompt_builder import JUDGED_SKILLS
from review_text import plain_punct

_STATUSES = ("demonstrated", "listed", "missing")
# The model is asked about JUDGED_SKILLS skills. A few extra entries are read in case it adds some.
_EXTRA_ENTRIES = 5


def _words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9+#]+", (text or "").lower())


def _squash(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def _evidence_in_cv(evidence: str, cv_joined: str) -> bool:
    """True when a quote the model gave as evidence really comes from the CV.

    The prompt asks for evidence copied exactly from the CV, which makes a
    "the CV shows this skill" claim checkable. The whole quote must appear,
    or at least a run of 4 words from it (models trim or re-join quotes a
    little). A single word is a keyword and not evidence of use, so it is refused.
    """
    words = _words(evidence)
    if len(words) < 2:
        return False
    if f" {' '.join(words)} " in cv_joined:
        return True
    return any(f" {' '.join(words[i : i + 4])} " in cv_joined for i in range(len(words) - 3))


def _label_matched_skill(
    skill: dict[str, Any], status: str, grounded: bool, evidence: str, why: str | None
) -> None:
    """Give a skill the keyword scan found a depth label."""
    if status == "demonstrated":
        # Same rule as promotion: "shown in real work" needs a quote that
        # checks out, otherwise no depth claim is made.
        if grounded:
            skill["depth"] = "demonstrated"
            skill["evidence"] = evidence
            skill["why"] = why
    else:
        # "missing" for a skill the scan found usually means a passing mention
        # ("keen to learn Kafka"), which counts the same as listed.
        skill["depth"] = "listed"
        skill["why"] = why


def _score_with_promoted(match_summary: dict[str, Any], promoted: list[dict[str, Any]]) -> float | None:
    """The keyword score plus the market weight of the gaps the CV turned out to cover."""
    everything = (match_summary.get("matched") or []) + (match_summary.get("gaps") or [])
    total = sum(float(s.get("frequency_pct") or 0) for s in everything)
    if total > 0:
        gained = sum(float(g.get("frequency_pct") or 0) for g in promoted)
        base = float(match_summary.get("score") or 0)
        return round(min(100.0, base + 100 * gained / total), 1)
    return None


def apply_skill_judgements(
    match_summary: dict[str, Any], raw: Any, cv_text: str
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """The match summary adjusted by the model's judgements, and the cleaned judgements.

    With no usable judgements the match summary comes back unchanged.
    """
    if not isinstance(raw, list) or not raw:
        return match_summary, []

    cv_joined = f" {' '.join(_words(cv_text))} "
    gaps = [dict(g) for g in match_summary.get("gaps") or []]
    matched = [dict(m) for m in match_summary.get("matched") or []]
    gap_by_key = {str(g.get("skill")).lower(): g for g in gaps}
    matched_by_key = {str(m.get("skill")).lower(): m for m in matched}

    judgements: list[dict[str, Any]] = []
    promoted: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in raw[: JUDGED_SKILLS + _EXTRA_ENTRIES]:
        if not isinstance(item, dict):
            continue
        key = str(item.get("skill") or "").strip().lower()
        status = str(item.get("status") or "").strip().lower()
        if status not in _STATUSES or key in seen:
            continue
        if key not in gap_by_key and key not in matched_by_key:
            continue
        seen.add(key)
        evidence = _squash(item.get("evidence"))[:200]
        why = plain_punct(_squash(item.get("why")))[:300] or None
        grounded = bool(evidence) and _evidence_in_cv(evidence, cv_joined)
        blocking = item.get("blocking") is True
        judgements.append(
            {
                "skill": (gap_by_key.get(key) or matched_by_key[key])["skill"],
                "status": status,
                "evidence": evidence or None,
                "evidence_found": grounded,
                "blocking": blocking and status == "missing",
                "why": why,
            }
        )

        if key not in gap_by_key:
            _label_matched_skill(matched_by_key[key], status, grounded, evidence, why)
            continue
        gap = gap_by_key[key]
        if status != "missing" and grounded:
            promoted.append(gap)
            matched.append(
                {
                    "skill": gap["skill"],
                    "frequency_pct": gap.get("frequency_pct"),
                    "depth": status,
                    "evidence": evidence,
                    "why": why,
                    "found_by": "review",
                }
            )
        elif status == "missing":
            gap["blocking"] = blocking
            gap["why"] = why

    if not judgements:
        return match_summary, []

    promoted_ids = {id(g) for g in promoted}
    gaps = [g for g in gaps if id(g) not in promoted_ids]
    matched.sort(key=lambda m: float(m.get("frequency_pct") or 0), reverse=True)
    # A stable sort: blocking gaps first, the keyword priority order kept within each group.
    gaps.sort(key=lambda g: g.get("blocking") is not True)

    adjusted = dict(match_summary)
    adjusted["gaps"] = gaps
    adjusted["matched"] = matched
    adjusted["matched_count"] = len(matched)
    adjusted["keyword_score"] = match_summary.get("score")
    if promoted:
        score = _score_with_promoted(match_summary, promoted)
        if score is not None:
            adjusted["score"] = score
            adjusted["readiness_pct"] = score
    adjusted["gap_suggestion"] = gap_suggestion(gaps[0]) if gaps else None
    return adjusted, judgements

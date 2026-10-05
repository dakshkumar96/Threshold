"""Read and tidy the text an AI model sends back for a CV review.

The prompt asks for a plain-text report (SECTION headers and "- " bullets)
followed by two machine-readable blocks. Models drift from that format, so
nothing here assumes it is exact. Each reader returns what it can find and the
tidy-up step repairs the rest.

In the patterns below, \\u2014 is the em dash and \\u2013 the en dash, which
models use as separators.
"""

from __future__ import annotations

import json
import re
from typing import Any

# "Blocking:" or "Nice to have -" at the start of a gap line.
_GAP_LABEL = r"(blocking|nice[ -]to[ -]have)\s*[:—\-–]\s*"
_GAP_PREFIX_RE = re.compile("^" + _GAP_LABEL, re.I)
_GAP_SECTIONS = ("gaps", "skills to learn for sponsored roles")

# The sections the prompt asks for. The model does not reliably keep the
# "SECTION: X" prefix. Runs have used a bare "RED FLAGS", "**Scores**" or
# "## Put forward", and markdown is stripped before headers are fixed, which
# leaves a bare line. A header that is not "SECTION: X" breaks both the
# frontend's section parser and the readers below that look for "SECTION:".
_KNOWN_SECTIONS = {
    "where you are now": "Where you are now",
    "strengths": "Strengths",
    "gaps": "Gaps",
    "skills to learn for sponsored roles": "Skills to learn for sponsored roles",
    "scores": "Scores",
    "red flags": "Red flags",
    "what works": "What works",
    "experience bullets": "Experience bullets",
    "fix first": "Fix first",
    "rewritten summary": "Rewritten summary",
    "put forward": "Put forward",
}


# --- tidying ---------------------------------------------------------------------


def plain_punct(text: str) -> str:
    """Site style: no em dashes, en dashes or semicolons in anything shown.

    The prompt asks the model to avoid them but models drift back, so this is
    enforced in code. A dash between numbers becomes "to", any other dash
    becomes a spaced hyphen (which the report readers accept as a separator),
    and a semicolon becomes a comma.
    """
    text = re.sub(r"(?<=\d)\s*[–—]\s*(?=\d)", " to ", text)
    text = re.sub(r"\s*[—–]\s*", " - ", text)
    return text.replace(";", ",")


def clean_value(value: Any) -> Any:
    """plain_punct over a string, or over every string in a list."""
    if isinstance(value, str):
        return plain_punct(value)
    if isinstance(value, list):
        return [clean_value(v) for v in value]
    return value


def _normalize_section_headers(text: str) -> str:
    out = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            out.append(line)
            continue
        key = re.sub(r"^section:\s*", "", stripped, flags=re.I)
        key = re.sub(r"\s+", " ", key.strip("*_ ").rstrip(":").strip()).lower()
        canonical = _KNOWN_SECTIONS.get(key)
        out.append(f"SECTION: {canonical}" if canonical else line)
    return "\n".join(out)


def to_plain_text(report: str) -> str:
    """The model's report as plain text, keeping SECTION headers and "- " bullets."""
    text = plain_punct(report or "")
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Markdown tables have no place in the report. SECTION and bullet lines stay.
    text = re.sub(r"^\|.*\|$", "", text, flags=re.M)
    text = re.sub(r"^---+\s*$", "", text, flags=re.M)
    text = re.sub(r"^[\*•]\s+", "- ", text, flags=re.M)
    text = _normalize_section_headers(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# --- the machine-readable blocks ---------------------------------------------------


def parse_summary_json(content: str) -> dict[str, Any] | None:
    """The JSON summary block, or a bare JSON object that has a score in it."""
    block = re.search(
        r"<<<SUMMARY_JSON>>>\s*(\{.*?\})\s*<<<END_SUMMARY_JSON>>>",
        content,
        flags=re.S,
    )
    if block:
        try:
            return json.loads(block.group(1))
        except json.JSONDecodeError:
            pass
    bare = list(re.finditer(r"\{[^{}]*\"score_out_of_100\"[^{}]*\}", content, flags=re.S))
    if bare:
        try:
            return json.loads(bare[-1].group(0))
        except json.JSONDecodeError:
            return None
    return None


def parse_skill_judgements(content: str) -> list[Any] | None:
    block = re.search(
        r"<<<SKILL_JUDGEMENTS>>>\s*(\[.*?\])\s*<<<END_SKILL_JUDGEMENTS>>>",
        content,
        flags=re.S,
    )
    if not block:
        return None
    try:
        parsed = json.loads(block.group(1))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, list) else None


def strip_summary_block(content: str) -> str:
    """The reply without its two machine-readable blocks."""
    content = re.sub(
        r"\n*<<<SKILL_JUDGEMENTS>>>.*?<<<END_SKILL_JUDGEMENTS>>>\s*"
        r"(?:One entry for each[^\n]*\n)?",
        "\n",
        content,
        flags=re.S,
    )
    return re.sub(
        r"\n*<<<SUMMARY_JSON>>>.*?<<<END_SUMMARY_JSON>>>\s*",
        "\n",
        content,
        flags=re.S,
    ).strip()


# --- reading the prose report ----------------------------------------------------------


def _section_body(report: str, title: str) -> str | None:
    found = re.search(
        rf"SECTION:\s*{re.escape(title)}\s*\n(.*?)(?=\nSECTION:|\Z)",
        report,
        flags=re.S | re.I,
    )
    return found.group(1) if found else None


def section_bullets(report: str, title: str, limit: int = 3) -> list[str]:
    """The "- " lines of the `title` section, for when the JSON summary lacks them."""
    body = _section_body(report, title)
    if body is None:
        return []
    out = []
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("- "):
            out.append(line[2:].strip())
        if len(out) >= limit:
            break
    return out


def put_forward_from_report(report: str) -> str | None:
    body = _section_body(report, "Put forward")
    if body is None:
        return None
    verdict = re.search(r"\b(Not yet|Yes|No)\b", body, flags=re.I)
    if not verdict:
        return None
    return {"yes": "Yes", "no": "No", "not yet": "Not yet"}[verdict.group(1).lower()]


def first_impression_fallback(report: str) -> str | None:
    found = re.search(
        r"(?:WHERE YOU ARE NOW|Instant impression):\s*(.+?)(?:\n\n|\n[A-Z][A-Z ])",
        report,
        flags=re.S | re.I,
    )
    if found:
        return re.sub(r"\s+", " ", found.group(1)).strip()[:500]
    return None


# --- matching strengths and gaps to skills -------------------------------------------------


def skill_key(text: str) -> str:
    """A short lowercase key for a strength or gap line.

    Drops a leading "Blocking:" style label and anything after the first dash
    or colon, so "SQL - in ~62% of ads" becomes "sql".
    """
    text = re.sub(r"^\s*" + _GAP_LABEL, "", text, flags=re.I)
    head = re.split(r"[—\-–:]", text, maxsplit=1)[0]
    return re.sub(r"[^a-z0-9 ]", "", head.lower()).strip()


def _leads_with(key: str, skill: str) -> bool:
    return key == skill or key.startswith(skill + " ")


def is_about(text: str, skill_keys: set[str]) -> bool:
    """Whether a gap line leads with one of the skills.

    "REST API design - ..." is about "rest api". "Google Cloud" is not about "go".
    """
    key = skill_key(text)
    return bool(key) and any(_leads_with(key, k) for k in skill_keys)


def align_gap_bullets(
    report: str, confirmed: set[str], blocking_by_key: dict[str, bool]
) -> str:
    """Make the Gaps and Skills-to-learn bullets agree with the skill judgements.

    The judgements drive the skill list shown beside the report. The prose is
    told to agree with them but does not always, so:
      - a bullet about a skill the review confirmed the CV shows (its evidence
        was found in the CV text) is dropped
      - a "Blocking:" or "Nice to have:" label is set from the judgement
    """
    if not confirmed and not blocking_by_key:
        return report

    def flag_for(text: str) -> bool | None:
        key = skill_key(text)
        for skill, flag in blocking_by_key.items():
            if key and _leads_with(key, skill):
                return flag
        return None

    out: list[str] = []
    section = ""
    for line in report.splitlines():
        stripped = line.strip()
        if stripped.startswith("SECTION:"):
            section = stripped[len("SECTION:") :].strip().lower()
        elif stripped.startswith("- ") and section in _GAP_SECTIONS:
            body = stripped[2:]
            if is_about(body, confirmed):
                continue
            label = _GAP_PREFIX_RE.match(body) if section == "gaps" else None
            flag = flag_for(body) if label else None
            if label and flag is not None:
                line = f"- {'Blocking' if flag else 'Nice to have'}: {body[label.end():]}"
        out.append(line)
    return "\n".join(out)

"""Free LLM CV feedback via OpenAI-compatible chat API (Groq, etc.).

Uses modular recruiter prompts from prompts/:
  compact core + one trimmed role rubric + short patterns + band cue.
Feeds market skill aggregates (from all ads) + compact skill-section
excerpts into the user prompt — not a handful of full JD blobs.
Sized for Groq free-tier TPM (~8k tokens/min for openai/gpt-oss-120b,
confirmed via the x-ratelimit-limit-tokens response header — a single
review call already uses ~7.1-7.2k of that, so back-to-back calls within
the same ~60s window will 429; this is a provider limit, not a bug).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from typing import Any

import requests

from job_schema import load_env
from llm_prompt_builder import (
    build_system_prompt,
    build_user_prompt,
    pack_jobs_for_llm,
)

LABEL = (
    "structured recruiter feedback — subjective narrative, not a hiring prediction"
)

# Keep prompt + max_tokens under Groq's free-tier TPM limit for the model in
# use (~8k measured). Completion budget raised from 3200 -> 3800 since the
# trailing "Experience bullets"/"Rewritten summary" sections were observed
# cutting off mid-sentence; prompt soft-limit tightened 18000 -> 16000 to
# make room for that within the same ~8k ceiling (est. ~4000 prompt tokens
# + 3800 completion tokens stays under it with some margin).
_MAX_COMPLETION_TOKENS = 3800
_PROMPT_CHAR_SOFT_LIMIT = 16000


def skills_to_learn_from_gaps(
    gaps: list[dict[str, Any]] | None, *, limit: int = 12
) -> list[dict[str, Any]]:
    """Deterministic prioritised learn-list from Python gap scores."""
    out: list[dict[str, Any]] = []
    for g in (gaps or [])[:limit]:
        skill = g.get("skill")
        if not skill:
            continue
        freq = g.get("frequency_pct")
        weeks = g.get("ease_weeks")
        note_parts = []
        if freq is not None:
            note_parts.append(f"In ~{freq}% of ads")
        if weeks is not None:
            note_parts.append(f"~{weeks} weeks to learn")
        out.append(
            {
                "skill": skill,
                "frequency_pct": freq,
                "ease_weeks": weeks,
                "priority_score": g.get("priority_score"),
                "note": "; ".join(note_parts) if note_parts else None,
            }
        )
    return out


def where_you_are_from_match(match_summary: dict[str, Any]) -> str:
    """Short deterministic 'where you are' when LLM narrative is unavailable."""
    matched = match_summary.get("matched") or []
    score = match_summary.get("score")
    matched_count = match_summary.get("matched_count")
    top_n = match_summary.get("top_n")
    strengths = ", ".join(
        f"{m.get('skill')} (~{m.get('frequency_pct')}%)" for m in matched[:5]
    )
    base = (
        f"You match {matched_count} of {top_n} top market skills "
        f"(weighted score {score})."
    )
    if strengths:
        return f"{base} Detected strengths: {strengths}."
    return f"{base} No top-list skills detected in the CV yet."


def _jobs_len(jobs) -> int:
    if jobs is None:
        return 0
    try:
        return int(len(jobs))
    except TypeError:
        return 0


def _http_error_message(response: requests.Response) -> str:
    """Human-readable Groq/OpenAI-compat HTTP errors (no secrets)."""
    status = response.status_code
    detail = ""
    try:
        body = response.json()
        err = body.get("error") if isinstance(body, dict) else None
        if isinstance(err, dict):
            detail = str(err.get("message") or err.get("code") or "")
        elif isinstance(err, str):
            detail = err
    except Exception:
        detail = (response.text or "")[:240]
    detail = re.sub(r"\s+", " ", detail).strip()[:240]

    if status == 413:
        # Groq often returns 413 for TPM (tokens/min), not only raw payload bytes.
        return (
            "LLM request too large for the provider free-tier token budget "
            "(prompt + completion). Context was already packed; try again "
            "in a minute or shorten the CV."
            + (f" ({detail})" if detail else "")
        )
    if status == 429:
        return "LLM rate limited. Wait a minute and try again."
    if status in (401, 403):
        return "LLM API key rejected. Check LLM_API_KEY in .env."
    if detail:
        return f"LLM HTTP {status}: {detail}"
    return f"LLM HTTP {status}"


def _post_chat_completion(
    url: str, headers: dict[str, str], payload: dict[str, Any]
) -> requests.Response:
    """POST with one retry on a reset/dropped connection.

    Long LLM requests over flaky networks (and Windows sockets especially)
    occasionally get killed mid-flight with a bare ConnectionResetError —
    not a provider error, just the TCP connection dying. A single retry
    on a fresh connection clears the vast majority of these.
    """
    last_exc: requests.exceptions.ConnectionError | None = None
    for attempt in range(2):
        try:
            return requests.post(url, headers=headers, json=payload, timeout=(15, 150))
        except requests.exceptions.ConnectionError as exc:
            last_exc = exc
            if attempt == 0:
                time.sleep(1.5)
                continue
    assert last_exc is not None
    raise last_exc


def _parse_summary_json(content: str) -> dict[str, Any] | None:
    m = re.search(
        r"<<<SUMMARY_JSON>>>\s*(\{.*?\})\s*<<<END_SUMMARY_JSON>>>",
        content,
        flags=re.S,
    )
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    matches = list(
        re.finditer(r"\{[^{}]*\"score_out_of_100\"[^{}]*\}", content, flags=re.S)
    )
    if matches:
        try:
            return json.loads(matches[-1].group(0))
        except json.JSONDecodeError:
            return None
    return None


# A score this low is "not competitive / rebuild" territory per the prompt's
# own band definitions — "would_put_forward: Yes" alongside it is a direct
# self-contradiction, so it's enforced in code rather than trusted to the
# model having followed the instruction.
_PUT_FORWARD_SCORE_FLOOR = 50


def _skill_key(text: str) -> str:
    """Normalise a strength/gap phrase to a comparable keyword token.

    Strips leading punctuation and trailing "— ..." commentary so
    "SQL — in ~62% of ads" and "Strong SQL skills" both key on "sql".
    """
    head = re.split(r"[—\-–:]", text, maxsplit=1)[0]
    return re.sub(r"[^a-z0-9 ]", "", head.lower()).strip()


def _section_bullets(report: str, title: str, limit: int = 3) -> list[str]:
    """Pull "- " bullet lines out of a "SECTION: <title>" block in the plain
    text report — used as a fallback when the JSON summary is missing a
    field the prose clearly has (e.g. the completion got cut off before
    reaching the JSON block, or the model emitted malformed JSON).
    """
    m = re.search(
        rf"SECTION:\s*{re.escape(title)}\s*\n(.*?)(?=\nSECTION:|\Z)",
        report,
        flags=re.S | re.I,
    )
    if not m:
        return []
    out = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if line.startswith("- "):
            out.append(line[2:].strip())
        if len(out) >= limit:
            break
    return out


def _put_forward_from_report(report: str) -> str | None:
    m = re.search(
        r"SECTION:\s*Put forward\s*\n(.*?)(?=\nSECTION:|\Z)",
        report,
        flags=re.S | re.I,
    )
    if not m:
        return None
    pf = re.search(r"\b(Not yet|Yes|No)\b", m.group(1), flags=re.I)
    if not pf:
        return None
    return {"yes": "Yes", "no": "No", "not yet": "Not yet"}[pf.group(1).lower()]


def _reconcile_summary(
    summary: dict[str, Any], *, deterministic_score: float | None = None
) -> dict[str, Any]:
    """Catch-after-the-fact fixes for contradictions a single LLM pass can
    produce even when instructed not to — code enforcement is more reliable
    than a prompt instruction for anything checkable mechanically.
    """
    llm_score = summary.get("score_out_of_100")
    candidate_scores = [
        s for s in (llm_score, deterministic_score) if isinstance(s, (int, float))
    ]
    # The UI shows whichever score is available, preferring the deterministic
    # keyword-match score over the LLM's own score_out_of_100 (CvFullReview.tsx:
    # `data.score ?? fb.score_out_of_100`) — so "low score + Put forward: Yes"
    # must be judged against whichever one the user actually sees, not just
    # the LLM's own number, or the two displayed values can still visibly
    # contradict even after this check runs.
    if candidate_scores and min(candidate_scores) < _PUT_FORWARD_SCORE_FLOOR:
        if str(summary.get("would_put_forward", "")).strip().lower() == "yes":
            summary["would_put_forward"] = "No"

    strengths = summary.get("top_3_strengths") or []
    gaps = summary.get("top_3_gaps") or []
    if strengths and gaps:
        strength_keys = {_skill_key(s) for s in strengths if isinstance(s, str)}
        strength_keys.discard("")
        kept_gaps = []
        for g in gaps:
            if not isinstance(g, str):
                kept_gaps.append(g)
                continue
            key = _skill_key(g)
            # A listed strength directly contradicts the same thing being a
            # gap; the strength claim is kept (narrative asks it to quote
            # real CV evidence), the gap claim is dropped as unreliable.
            if key and key in strength_keys:
                continue
            kept_gaps.append(g)
        summary["top_3_gaps"] = kept_gaps

    return summary


def _strip_summary_block(content: str) -> str:
    return re.sub(
        r"\n*<<<SUMMARY_JSON>>>.*?<<<END_SUMMARY_JSON>>>\s*",
        "\n",
        content,
        flags=re.S,
    ).strip()


# Canonical titles for the sections the prompt asks for. The model doesn't
# reliably keep the "SECTION: X" prefix — observed runs used bare "RED FLAGS",
# "**Scores**" or "## Put forward" (the markdown is stripped below, leaving a
# bare line). Anything that isn't "SECTION: X" breaks both the frontend's
# section parser and the fallbacks here that look for "SECTION:".
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


def _to_plain_text(report: str) -> str:
    """Normalise LLM output while keeping SECTION headers and '- ' bullets."""
    text = report or ""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Drop markdown tables; keep SECTION / bullet structure for the UI parser.
    text = re.sub(r"^\|.*\|$", "", text, flags=re.M)
    text = re.sub(r"^---+\s*$", "", text, flags=re.M)
    # Normalise bullet markers to "- "
    text = re.sub(r"^[\*•]\s+", "- ", text, flags=re.M)
    text = _normalize_section_headers(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def generate_cv_feedback(
    role: str,
    cv_text: str,
    skill_frequencies: list[dict[str, Any]],
    match_summary: dict[str, Any],
    jobs=None,
    jobs_analyzed_for_skills: int | None = None,
) -> dict[str, Any] | None:
    """
    Returns recruiter-style feedback grounded in market skills + excerpts,
    or None if no key.

    Env:
      LLM_API_KEY
      LLM_BASE_URL (default Groq OpenAI-compat)
      LLM_MODEL
    """
    load_env()
    api_key = os.getenv("LLM_API_KEY", "").strip()
    if not api_key:
        return None

    base = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")

    jobs_analyzed = (
        int(jobs_analyzed_for_skills)
        if jobs_analyzed_for_skills is not None
        else _jobs_len(jobs)
    )
    skills_to_learn = skills_to_learn_from_gaps(match_summary.get("gaps"))
    where_py = where_you_are_from_match(match_summary)

    jobs_blob, excerpts_count, jobs_truncated = pack_jobs_for_llm(
        jobs, max_chars=4500, max_jobs=20
    )
    built = build_system_prompt(role, cv_text, match_summary)
    user_prompt = build_user_prompt(
        role,
        cv_text,
        skill_frequencies,
        match_summary,
        jobs_blob=jobs_blob,
        jobs_count=excerpts_count,
        jobs_truncated=jobs_truncated,
        jobs_analyzed_for_skills=jobs_analyzed,
    )
    system_content = (
        built["system_prompt"]
        + "\n\nIMPORTANT: Your visible report must be PLAIN TEXT only "
        "(SECTION: Title headers and '- ' bullets). No markdown. "
        "Lead with WHERE YOU ARE NOW and SKILLS TO LEARN FOR SPONSORED ROLES. "
        "SECTION: Scores must list all five rubric categories as "
        "'Label: NN/20 — reason' with a concrete CV-based explanation "
        "on every line, then Total: NN/100. Be detailed — quote CV lines."
    )
    # Last-resort shrink if somehow still over soft budget.
    if len(system_content) + len(user_prompt) > _PROMPT_CHAR_SOFT_LIMIT:
        jobs_blob, excerpts_count, jobs_truncated = pack_jobs_for_llm(
            jobs, max_chars=2800, max_jobs=12
        )
        user_prompt = build_user_prompt(
            role,
            (cv_text or "")[:2800],
            skill_frequencies,
            match_summary,
            jobs_blob=jobs_blob,
            jobs_count=excerpts_count,
            jobs_truncated=True,
            jobs_analyzed_for_skills=jobs_analyzed,
        )

    sys_chars = len(system_content)
    user_chars = len(user_prompt)
    total_chars = sys_chars + user_chars
    print(
        f"[llm] prompt sizes system={sys_chars} user={user_chars} "
        f"total={total_chars} ads={jobs_analyzed} excerpts={excerpts_count} "
        f"tok_est={total_chars // 4}+max={_MAX_COMPLETION_TOKENS} "
        f"model={model}",
        flush=True,
    )

    def _base_payload(**extra: Any) -> dict[str, Any]:
        payload = {
            "label": LABEL,
            "first_impression": None,
            "score_out_of_100": None,
            "top_3_strengths": [],
            "top_3_gaps": [],
            "one_thing_to_fix_first": None,
            "full_report": None,
            "where_you_are": where_py,
            "skills_to_learn": skills_to_learn,
            "jobs_reviewed": excerpts_count,
            "jobs_in_skill_analysis": jobs_analyzed,
            "jd_excerpts_used": excerpts_count,
            "jobs_context_truncated": jobs_truncated,
            "prompt_chars": total_chars,
            "model": model,
            "truncated": False,
        }
        payload.update(extra)
        return payload

    def _fail(msg: str) -> dict[str, Any]:
        return _base_payload(error=msg)

    # Deterministic per (role, CV) seed so re-running the same CV gives a
    # stable score/report instead of drifting between calls (best-effort —
    # not every provider/model honours `seed`, but Groq's does for most).
    seed = int.from_bytes(
        hashlib.sha256(f"{role}|{cv_text}".encode("utf-8")).digest()[:4], "big"
    )

    try:
        r = _post_chat_completion(
            f"{base}/chat/completions",
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.35,
                "seed": seed,
                "max_tokens": _MAX_COMPLETION_TOKENS,
            },
        )
        if not r.ok:
            return _fail(_http_error_message(r))
        payload = r.json()
        finish_reason = payload["choices"][0].get("finish_reason")
        truncated = finish_reason == "length"
        if truncated:
            print(
                f"[llm] WARNING: completion truncated (finish_reason=length) "
                f"max_tokens={_MAX_COMPLETION_TOKENS}",
                flush=True,
            )
        content = payload["choices"][0]["message"]["content"]
        content = (content or "").strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:markdown|md|json|text)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

        summary = _parse_summary_json(content) or {}
        report = _to_plain_text(_strip_summary_block(content))

        score = summary.get("score_out_of_100")
        if score is None:
            m = re.search(r"TOTAL[^\d]*(\d+)\s*/\s*100", report, flags=re.I)
            if m:
                score = int(m.group(1))
        summary["score_out_of_100"] = score

        # Belt-and-suspenders for a truncated or malformed SUMMARY_JSON block:
        # the prose sections above it (Strengths/Gaps/Put forward) are now
        # emitted BEFORE the JSON (see llm_prompt_builder.py), so they should
        # already be intact even when the trailing narrative gets cut off —
        # but if the JSON itself is still missing a field the prose clearly
        # has, read it from there rather than showing "none returned" next
        # to a report that visibly contains it.
        if not summary.get("top_3_strengths"):
            fallback = _section_bullets(report, "Strengths")
            if fallback:
                summary["top_3_strengths"] = fallback
        if not summary.get("top_3_gaps"):
            fallback = _section_bullets(report, "Gaps")
            if fallback:
                summary["top_3_gaps"] = fallback
        if not summary.get("would_put_forward"):
            fallback = _put_forward_from_report(report)
            if fallback:
                summary["would_put_forward"] = fallback

        summary = _reconcile_summary(
            summary, deterministic_score=match_summary.get("score")
        )

        where_llm = summary.get("where_you_are") or summary.get("first_impression")
        return _base_payload(
            first_impression=summary.get("first_impression")
            or _first_impression_fallback(report),
            score_out_of_100=score,
            bucket=summary.get("bucket"),
            top_3_strengths=summary.get("top_3_strengths") or [],
            top_3_gaps=summary.get("top_3_gaps") or [],
            one_thing_to_fix_first=summary.get("one_thing_to_fix_first"),
            would_put_forward=summary.get("would_put_forward"),
            full_report=report,
            where_you_are=where_llm or where_py,
            # Keep Python gap list deterministic; LLM narrates in full_report.
            skills_to_learn=skills_to_learn,
            role_family=built["role_family"],
            role_family_name=built["role_family_name"],
            calibration_band=built["calibration_band"],
            truncated=truncated,
        )
    except requests.Timeout:
        return _fail("LLM timed out after 150s. Try again shortly.")
    except requests.exceptions.ConnectionError:
        return _fail(
            "Connection to the LLM provider was reset after a retry. "
            "This is usually a transient network issue — try again."
        )
    except requests.RequestException as exc:
        return _fail(f"LLM request failed: {exc}")
    except Exception as exc:
        return _fail(f"LLM review failed: {exc}")


def _first_impression_fallback(report: str) -> str | None:
    m = re.search(
        r"(?:WHERE YOU ARE NOW|Instant impression):\s*(.+?)(?:\n\n|\n[A-Z][A-Z ])",
        report,
        flags=re.S | re.I,
    )
    if m:
        return re.sub(r"\s+", " ", m.group(1)).strip()[:500]
    return None

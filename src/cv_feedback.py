"""Free LLM CV feedback via OpenAI-compatible chat API (Groq, etc.).

Uses modular recruiter prompts from prompts/:
  compact core + one trimmed role rubric + short patterns + band cue.
Feeds market skill aggregates (from all ads) + compact skill-section
excerpts into the user prompt — not a handful of full JD blobs.
Sized for Groq free-tier TPM (~12k tokens/min including max_tokens).
"""

from __future__ import annotations

import json
import os
import re
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

# Keep prompt + max_tokens well under Groq free TPM (~12k for llama-3.3-70b).
_MAX_COMPLETION_TOKENS = 2200
_PROMPT_CHAR_SOFT_LIMIT = 18000


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


def _strip_summary_block(content: str) -> str:
    return re.sub(
        r"\n*<<<SUMMARY_JSON>>>.*?<<<END_SUMMARY_JSON>>>\s*",
        "\n",
        content,
        flags=re.S,
    ).strip()


def _to_plain_text(report: str) -> str:
    """Strip markdown so the UI shows readable plain text."""
    text = report or ""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.M)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^\|.*\|$", "", text, flags=re.M)
    text = re.sub(r"^[-*•]\s+", "", text, flags=re.M)
    text = re.sub(r"^---+\s*$", "", text, flags=re.M)
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
    model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

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
        + "\n\nIMPORTANT: Your visible report must be PLAIN TEXT only. "
        "No markdown formatting. Lead with WHERE YOU ARE NOW and "
        "SKILLS TO LEARN FOR SPONSORED ROLES."
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
        }
        payload.update(extra)
        return payload

    def _fail(msg: str) -> dict[str, Any]:
        return _base_payload(error=msg)

    try:
        r = requests.post(
            f"{base}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.35,
                "max_tokens": _MAX_COMPLETION_TOKENS,
            },
            timeout=(15, 150),
        )
        if not r.ok:
            return _fail(_http_error_message(r))
        content = r.json()["choices"][0]["message"]["content"]
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
        )
    except requests.Timeout:
        return _fail("LLM timed out after 150s. Try again shortly.")
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

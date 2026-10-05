"""A long CV is cut honestly: at a line break, with a note to the model and a count for the reader (M8)."""

from __future__ import annotations

import pytest

import cv_feedback
from llm_prompt_builder import CV_PROMPT_CHARS, build_user_prompt, clip_cv
from tests.golden.harness import FakeResponse

MATCH = {"score": 40.0, "matched": [], "gaps": [], "matched_count": 0, "top_n": 0}


def long_cv(lines: int = 120) -> str:
    return "\n".join(f"- Line {n} built dashboards in Python and SQL for the finance team" for n in range(lines))


def user_prompt_for(cv: str) -> str:
    return build_user_prompt("Data Analyst", cv, [], MATCH)


def test_a_short_cv_is_sent_whole_with_no_note():
    cv = "Jane Doe\nData analyst\n- Built dashboards in Python"
    assert clip_cv(cv) == cv
    prompt = user_prompt_for(cv)
    assert cv in prompt
    assert "characters of the CV" not in prompt


def test_a_cv_exactly_at_the_limit_is_not_cut():
    cv = "a" * CV_PROMPT_CHARS
    assert clip_cv(cv) == cv


def test_a_long_cv_is_cut_at_a_line_break():
    cv = long_cv()
    clipped = clip_cv(cv)
    assert len(clipped) <= CV_PROMPT_CHARS
    assert len(clipped) > CV_PROMPT_CHARS * 0.8
    assert cv.startswith(clipped)
    assert cv[len(clipped)] == "\n", "the cut should land on a line break, not inside a line"


def test_a_long_cv_without_line_breaks_is_cut_at_the_limit():
    cv = "word " * 2000
    assert clip_cv(cv) == cv[:CV_PROMPT_CHARS].rstrip()


def test_the_model_is_told_when_the_cv_was_cut():
    cv = long_cv()
    prompt = user_prompt_for(cv)
    clipped = clip_cv(cv)
    assert f"This is the first {len(clipped):,} of {len(cv):,} characters of the CV" in prompt
    assert "do not mention the cut as a red flag" in prompt
    assert cv[len(clipped):].strip() not in prompt


def test_the_note_sits_right_after_the_cv_block():
    prompt = user_prompt_for(long_cv())
    after_cv = prompt.split('"""', 2)[2]
    assert after_cv.lstrip("\n").startswith("(This is the first")


@pytest.fixture()
def captured(monkeypatch):
    """Stands in for the AI service. Records the request and answers as if busy."""
    calls: list[dict] = []

    def fake_post(url, headers, payload):
        calls.append(payload)
        return FakeResponse(429, {"error": {"message": "busy"}})

    monkeypatch.setattr(cv_feedback, "post_chat_completion", fake_post)
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    return calls


def test_the_result_says_how_much_of_the_cv_was_read(captured):
    cv = long_cv()
    result = cv_feedback.generate_cv_feedback("Data Analyst", cv, [], MATCH)
    assert result["cv_chars_total"] == len(cv)
    assert result["cv_chars_reviewed"] == len(clip_cv(cv))
    assert result["cv_chars_reviewed"] < result["cv_chars_total"]
    sent = captured[0]["messages"][1]["content"]
    assert "characters of the CV" in sent


def test_a_short_cv_is_reported_as_read_in_full(captured):
    result = cv_feedback.generate_cv_feedback("Data Analyst", "Short CV\n- Python", [], MATCH)
    assert result["cv_chars_total"] == result["cv_chars_reviewed"] == len("Short CV\n- Python")

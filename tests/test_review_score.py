"""The AI review's score leads, so a thin keyword list cannot show 100% beside "Put forward: No"."""

from api.analysis import _use_review_score
from cv_feedback import _reconcile_summary


def base():
    return {"score": 100.0, "keyword_score": 100.0, "readiness_pct": 100.0, "score_label": "keyword"}


def test_the_review_score_replaces_the_keyword_score_and_keeps_it_separately():
    result = base()
    _use_review_score(result, {"score_out_of_100": 38})
    assert result["score"] == 38.0 and result["readiness_pct"] == 38.0
    assert result["keyword_score"] == 100.0
    assert "CV review score" in result["score_label"]


def test_without_a_review_score_the_keyword_score_stays():
    for feedback in (None, {}, {"score_out_of_100": None}, {"score_out_of_100": "high"}, {"score_out_of_100": True}):
        result = base()
        _use_review_score(result, feedback)
        assert result == base()


def test_the_score_is_kept_between_0_and_100():
    result = base()
    _use_review_score(result, {"score_out_of_100": 140})
    assert result["score"] == 100.0


def test_a_yes_is_overruled_by_the_shown_low_score_even_if_the_keyword_score_is_high():
    summary = {"score_out_of_100": 30, "would_put_forward": "Yes"}
    assert _reconcile_summary(summary, deterministic_score=100.0)["would_put_forward"] == "No"


def test_a_high_review_score_is_not_overruled_by_a_low_keyword_score():
    summary = {"score_out_of_100": 80, "would_put_forward": "Yes"}
    assert _reconcile_summary(summary, deterministic_score=20.0)["would_put_forward"] == "Yes"

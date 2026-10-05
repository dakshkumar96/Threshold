"""Only companies on the latest register count as sponsors (found while fixing the audit items).

The register summary keeps every company seen since 2023. About one in eleven
is not on the latest snapshot, so it may have lost its licence and cannot
sponsor a new visa. These tests use the real register data shipped with the repo.
"""

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import match_sponsors as m
from api.job_search import sponsor_register_keys
from api.main import create_app

SUMMARY = pd.read_parquet(m.DEFAULT_SUMMARY)
CURRENT = SUMMARY[SUMMARY["still_active"]].sort_values("company_key")
FORMER = SUMMARY[~SUMMARY["still_active"]].sort_values("company_key")


def _distinctive(frame: pd.DataFrame, n: int) -> list[str]:
    """Register names long enough to match only themselves."""
    names = [str(x) for x in frame["example_name"] if len(str(x).split()) >= 3]
    return names[:: max(1, len(names) // n)][:n]


def ads(names: list[str], **extra) -> pd.DataFrame:
    from clean_names import clean_company_name

    return pd.DataFrame(
        {"company_raw": names, "company_key": [clean_company_name(n) for n in names], "location": "London", **extra}
    )


def test_an_ad_matched_to_a_former_sponsor_is_not_shown_as_a_sponsor():
    out = m.match_jobs_to_sponsors(ads(_distinctive(FORMER, 15)))
    former = out[out["still_active"] == False]  # noqa: E712 (pandas needs ==)
    assert len(former) >= 10, "the names should still be recognised"
    assert not former["is_sponsor"].any()
    assert not former["is_possible_sponsor"].any()
    assert former["sponsor_confidence"].isna().all()


def test_a_current_sponsor_is_still_shown():
    out = m.match_jobs_to_sponsors(ads(_distinctive(CURRENT, 15)))
    shown = out[out["is_sponsor"] | out["is_possible_sponsor"]]
    assert len(shown) >= 10
    assert (shown["still_active"] == True).all()  # noqa: E712


def test_a_careers_board_job_is_verified_only_for_a_current_sponsor():
    current_key = str(CURRENT["company_key"].iloc[100])
    former_key = str(FORMER["company_key"].iloc[100])
    jobs = pd.DataFrame(
        {
            "company_raw": ["Board name A", "Board name B", "Board name C"],
            "company_key": [current_key, former_key, "a company that is not on any register"],
            "location": "London",
            "sponsor_confidence": ["verified", "verified", "verified"],
        }
    )
    out = m.match_jobs_to_sponsors(jobs)
    assert out.loc[0, "sponsor_confidence"] == "verified" and bool(out.loc[0, "is_sponsor"])
    for row in (1, 2):
        assert out.loc[row, "sponsor_confidence"] != "verified"
        assert not bool(out.loc[row, "is_sponsor"])


def test_only_current_sponsors_are_probed_for_a_careers_board():
    names = _distinctive(CURRENT, 3) + _distinctive(FORMER, 3) + ["Hays Recruitment"]
    probe = sponsor_register_keys(m.match_jobs_to_sponsors(ads(names)))
    assert probe, "current sponsors should be probed"
    assert all(m.on_latest_register(key) for key, _ in probe)


def test_the_latest_register_date_is_the_newest_snapshot():
    assert m.latest_register_date() == pd.Timestamp(SUMMARY["last_seen"].max())


@pytest.fixture()
def client():
    return TestClient(create_app())


def test_the_checker_says_when_a_company_left_the_register(client):
    name = _distinctive(FORMER, 1)[0]
    body = client.get("/sponsor-check", params={"q": name}).json()
    assert body["match"] is None
    assert "was on the sponsor register until" in body["note"]
    assert "not on the latest one" in body["note"]
    assert ":" not in body["note"] and ";" not in body["note"], "site copy style"


def test_the_checker_still_finds_a_current_sponsor(client):
    name = _distinctive(CURRENT, 1)[0]
    body = client.get("/sponsor-check", params={"q": name}).json()
    assert body["match"] is not None
    assert m.on_latest_register(body["match"]["company_key"])

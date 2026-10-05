"""The search endpoint and the health check."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks, File, Form, Header, Request, UploadFile

from .analysis import run_analysis
from .security import analysis_slots, check_rate_limit, require_analyze_user

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# A plain `def`, not `async def`: a search does a lot of blocking work (job
# board calls, fuzzy matching, parsing a PDF, the AI call), and FastAPI runs
# plain functions in a thread pool so the server stays responsive meanwhile.
@router.post("/analyze")
def analyze(
    request: Request,
    background_tasks: BackgroundTasks,
    role: str = Form(...),
    cv_file: UploadFile | None = File(None),
    cv_text: str = Form(""),
    min_salary: str = Form(""),
    experience_level: str = Form(""),
    is_new_entrant: str = Form(""),
    x_analyze_key: str | None = Header(default=None, alias="X-Analyze-Key"),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    require_analyze_user(authorization, x_analyze_key)
    check_rate_limit(request)
    with analysis_slots.claim():
        return run_analysis(
            role=role,
            cv_text=cv_text,
            cv_file=cv_file,
            min_salary=min_salary,
            experience_level=experience_level,
            is_new_entrant=is_new_entrant,
            background_tasks=background_tasks,
        )

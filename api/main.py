"""The Threshold API. This file only wires things together.

    /analyze         search ads, match sponsors, count skills, review a CV  (routes.py)
    /sponsor-check   look a company up on the register                       (user_routes.py)
    /me/*            saved searches, preferences, last result (signed in)    (user_routes.py)
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import settings

from . import ats_store, auth, config, routes, user_routes, user_store
from .security import BodySizeLimit

logging.basicConfig(
    level=settings.log_level(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
# These libraries log whole request URLs at DEBUG and INFO. Some of our job-board
# calls carry an API key in the URL, so keep them quiet whatever LOG_LEVEL says.
for _noisy in ("urllib3", "httpx", "httpcore"):
    logging.getLogger(_noisy).setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(_: FastAPI):
    auth.check_settings_at_startup()
    ats_store.init_db()
    ats_store.load_seed()
    user_store.init_db()
    yield


def create_app() -> FastAPI:
    """The app. The docs pages are on only for developers (see settings.api_docs_enabled)."""
    docs = settings.api_docs_enabled()
    app = FastAPI(
        title="UK Sponsor Analysis API",
        version="0.6.0",
        lifespan=lifespan,
        docs_url="/docs" if docs else None,
        redoc_url="/redoc" if docs else None,
        openapi_url="/openapi.json" if docs else None,
    )
    # Added first so it runs inside CORS, which lets the browser read the 413.
    app.add_middleware(BodySizeLimit, max_bytes=config.MAX_REQUEST_BYTES)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(routes.router)
    app.include_router(user_routes.router)
    return app


app = create_app()

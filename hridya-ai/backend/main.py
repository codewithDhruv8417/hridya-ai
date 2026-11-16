"""HRIDYA AI - FastAPI application entry point.

Start it with:

    cd backend
    uvicorn main:app --reload

`lifespan` is where heavy, one-time work happens: loading the XGBoost model into
memory and making sure the database schema exists. Doing it here (instead of at
import time or per request) means:

* the first request is as fast as the thousandth,
* a broken model or database shows up as a clear startup log line,
* the process can close the connection pool cleanly on shutdown.

Interactive docs: http://127.0.0.1:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  - registers all 12 tables on Base.metadata
from config import settings
from database.session import check_database_connection, engine
from routers import auth, chat, screening, therapists
from services.ml_service import get_ml_service

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s | %(message)s",
)
logger = logging.getLogger("hridya")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once before the server accepts requests, then once on shutdown."""

    # 1. Model -> memory. Failure is logged, not fatal: /health reports it and
    #    the rest of the API (auth, therapists) keeps working.
    service = get_ml_service()
    try:
        service.load()
        logger.info("Screening model ready (%s encoding)", service.encoding_source)
    except Exception:  # noqa: BLE001
        logger.exception("Could not load the screening model; /prediction will return 503")

    # 2. Schema + seed data.
    if settings.auto_init_db:
        try:
            from database.init_db import init_database

            init_database()
        except Exception:  # noqa: BLE001
            logger.exception(
                "Database initialisation failed. Check DB_HOST/DB_USER/DB_PASSWORD in backend/.env"
            )

    yield  # ---- the application is now serving requests ----

    engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Mental wellness screening API: JWT auth, 12-table MySQL schema, "
        "XGBoost risk prediction, MedGemma explanations and Gemini chat."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: the Vite dev server runs on a different port, so the browser treats it
# as a separate origin. Only the origins listed in CORS_ORIGINS are allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(screening.router)
app.include_router(therapists.router)
app.include_router(chat.router)


@app.get("/", tags=["System"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "docs": "/docs",
        "endpoints": [
            "POST /auth/register",
            "POST /auth/login",
            "GET  /auth/me",
            "GET  /questionnaires",
            "POST /assessments",
            "POST /assessments/{id}/submit",
            "POST /prediction",
            "POST /screening/submit",
            "GET  /therapists",
            "POST /chat/sessions",
            "POST /chat/sessions/{id}/messages",
        ],
    }


@app.get("/health", tags=["System"])
def health() -> dict:
    """Cheap readiness probe: is the model in memory and is the DB reachable?"""
    service = get_ml_service()
    database_ok = check_database_connection()
    healthy = database_ok and service.is_loaded
    return {
        "status": "ok" if healthy else "degraded",
        "database": "connected" if database_ok else "unreachable",
        "model_loaded": service.is_loaded,
        "encoding_source": service.encoding_source if service.is_loaded else None,
        "version": settings.app_version,
    }

"""
Central configuration for the HRIDYA AI backend.

Why this file exists
--------------------
Every hard-coded value (database password, JWT secret, Gemini key, model path)
lives here instead of being scattered through the routers. Values are read from
environment variables or a local `.env` file, so the same code runs on your
laptop and on a server without edits.

Pydantic Settings does three things for us:
  1. Reads `.env` (see `.env.example`).
  2. Casts strings to the declared Python type (e.g. "3306" -> int 3306).
  3. Fails loudly at startup if a required value is malformed.

Import it as a singleton:  `from config import settings`
"""

from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute paths so the app works no matter which directory you start it from.
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    """All tunable application settings."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",       # ignore unrelated variables in .env
        case_sensitive=False, # DATABASE_URL and database_url are the same setting
    )

    # ------------------------------------------------------------------ app
    app_name: str = "HRIDYA AI Backend"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True

    # Frontend origins allowed to call this API (CORS).
    # Comma separated; the browser blocks any origin that is not listed here.
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )

    # --------------------------------------------------------------- database
    # Option A: give full SQLAlchemy URLs (wins over the individual fields).
    #   MySQL : mysql+pymysql://root:secret@127.0.0.1:3306/mental_health_db
    #   SQLite: sqlite:///./hridya_dev.sqlite3   (local experiments / tests only)
    # Option B: leave DATABASE_URL empty and fill the pieces below.
    database_url: str = ""

    db_host: str = "127.0.0.1"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "mental_health_db"

    # Create tables + seed demo rows automatically on startup when they are
    # missing. Turn off in production where migrations should own the schema.
    auto_init_db: bool = True

    # ------------------------------------------------------------------- auth
    # CHANGE THIS before deploying. `openssl rand -hex 32` gives a good value.
    jwt_secret_key: str = "dev-only-change-me-1f4b8c2a9d7e6f3b5a1c8e0d2b4f6a9c"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # ---------------------------------------------------------------- ml model
    model_path: str = str(BACKEND_DIR / "ml_models" / "hridya_screening_model.joblib")
    feature_schema_path: str = str(BACKEND_DIR / "ml_models" / "feature_schema.json")
    # Optional joblib bundle produced by ml/src/train.py containing the exact
    # LabelEncoders used at training time. When present, it takes priority over
    # the JSON schema and gives numerically exact feature encoding.
    encoder_bundle_path: str = str(BACKEND_DIR / "ml_models" / "hridya_encoders.joblib")

    model_name: str = "Hridya-Screening"
    model_version: str = "v1.2.0"
    model_accuracy: float = 91.95

    # Safety rule: if the user reports suicidal thoughts, never return a "low"
    # risk label, regardless of what the classifier predicts. This is a product
    # safeguard, not a model output.
    escalate_on_suicidal_ideation: bool = True

    # ------------------------------------------------------------------ gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_timeout_seconds: float = 30.0

    # ---------------------------------------------------------------- medgemma
    # MedGemma is served by an inference server you run yourself (HF TGI,
    # vLLM, Ollama...). Point this at its generation endpoint. When empty, the
    # backend falls back to a deterministic, rule-based explanation so the
    # product still works end to end.
    medgemma_endpoint: str = ""
    medgemma_model: str = "google/medgemma-4b-it"
    medgemma_timeout_seconds: float = 45.0
    medgemma_max_new_tokens: int = 320

    # --------------------------------------------------------------- helpers
    @property
    def cors_origin_list(self) -> list[str]:
        """CORS wants a list, not a comma separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """The SQLAlchemy connection string actually used by the engine."""
        if self.database_url:
            return self.database_url
        password = quote_plus(self.db_password)  # '@' or '/' in a password would break the URL
        credentials = f"{self.db_user}:{password}" if password else self.db_user
        return f"mysql+pymysql://{credentials}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def is_sqlite(self) -> bool:
        return self.sqlalchemy_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Build the settings once and reuse them (lru_cache = memoisation)."""
    return Settings()


settings = get_settings()

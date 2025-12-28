from functools import lru_cache

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AliasChoices, Field, field_validator


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "TaleSpinner Exp"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    # API prefix (support alias API_V1_PREFIX for convenience)
    API_V1_STR: str = Field(
        default="/api/v1",
        validation_alias=AliasChoices("API_V1_PREFIX", "API_V1_STR"),
    )

    # CORS
    # Supported formats:
    # - Comma-separated: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
    # - JSON list: ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./talespinner.db"

    # Encryption key for API tokens (required)
    # Generate with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
    ENCRYPTION_KEY: str = ""

    # Provider URLs
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # ===== Env-managed model selection (current mode) =====
    # When true, `/providers/*/models` will prefer lists from env.
    MODELS_FROM_ENV_ONLY: bool = True

    # OpenRouter (LLM)
    # Token is stored ONLY in env and must never be returned by API responses.
    OPENROUTER_API_KEY: str = ""
    # Supported formats:
    # - Comma-separated: OPENROUTER_MODELS=anthropic/claude-3.5-sonnet,openai/gpt-4o-mini
    # - JSON list: OPENROUTER_MODELS=["anthropic/claude-3.5-sonnet","openai/gpt-4o-mini"]
    OPENROUTER_MODELS: list[str] = []
    # If empty/null -> will fallback to first item in OPENROUTER_MODELS (if present)
    OPENROUTER_DEFAULT_MODEL: str | None = None

    # Preset model selection (4 LLM blocks)
    # If not set -> falls back to OPENROUTER_DEFAULT_MODEL / first OPENROUTER_MODELS item.
    OPENROUTER_MAIN_MODEL: str | None = None
    RAG_ENABLED: bool = False
    OPENROUTER_RAG_MODEL: str | None = None
    GUARD_ENABLED: bool = False
    OPENROUTER_GUARD_MODEL: str | None = None
    STORYTELLING_ENABLED: bool = False
    OPENROUTER_STORYTELLING_MODEL: str | None = None

    # Ollama (Embedding)
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    OLLAMA_EMBEDDING_DIMENSIONS: int | None = None

    # Model cache TTL in seconds
    MODEL_CACHE_TTL: int = 300

    # LLM & Vector DB (placeholders for keys)
    OPENAI_API_KEY: str | None = None
    CHROMA_DB_PATH: str = "./chroma_db"

    @field_validator("OPENROUTER_MODELS", mode="before")
    @classmethod
    def _parse_openrouter_models(cls, v):  # type: ignore[no-untyped-def]
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            # If user passes JSON list, pydantic may already parse it, but we keep a fallback:
            if s.startswith("[") and s.endswith("]"):
                # Let pydantic/json parsing handle it if possible; otherwise do a naive split.
                # (We avoid importing json here to keep config minimal.)
                s = s.strip("[]")
                parts = [p.strip().strip('"').strip("'") for p in s.split(",")]
                return [p for p in parts if p]
            parts = [p.strip() for p in s.split(",")]
            return [p for p in parts if p]
        return []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_allowed_origins(cls, v):  # type: ignore[no-untyped-def]
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            if s.startswith("[") and s.endswith("]"):
                s = s.strip("[]")
                parts = [p.strip().strip('"').strip("'") for p in s.split(",")]
                return [p for p in parts if p]
            parts = [p.strip() for p in s.split(",")]
            return [p for p in parts if p]
        return []

    @property
    def openrouter_default_model(self) -> str | None:
        if self.OPENROUTER_DEFAULT_MODEL and self.OPENROUTER_DEFAULT_MODEL.strip():
            return self.OPENROUTER_DEFAULT_MODEL.strip()
        return self.OPENROUTER_MODELS[0] if self.OPENROUTER_MODELS else None

    @property
    def openrouter_main_model(self) -> str | None:
        if self.OPENROUTER_MAIN_MODEL and self.OPENROUTER_MAIN_MODEL.strip():
            return self.OPENROUTER_MAIN_MODEL.strip()
        return self.openrouter_default_model

    # Load `.env` from repo root (one level above `backend/`)
    _REPO_ROOT = Path(__file__).resolve().parents[3]
    model_config = SettingsConfigDict(
        env_file=str(_REPO_ROOT / ".env"),
        env_ignore_empty=True,
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()


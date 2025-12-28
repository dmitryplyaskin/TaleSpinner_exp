from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TaleSpinner Exp"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./talespinner.db"

    # Encryption key for API tokens (required)
    # Generate with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
    ENCRYPTION_KEY: str = ""

    # Provider URLs
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Model cache TTL in seconds
    MODEL_CACHE_TTL: int = 300

    # LLM & Vector DB (placeholders for keys)
    OPENAI_API_KEY: str | None = None
    CHROMA_DB_PATH: str = "./chroma_db"

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()


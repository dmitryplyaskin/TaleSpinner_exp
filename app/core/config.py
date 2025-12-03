from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "TaleSpinner Exp"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./talespinner.db"
    
    # LLM & Vector DB (placeholders for keys)
    OPENAI_API_KEY: str | None = None
    CHROMA_DB_PATH: str = "./chroma_db"

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()


import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Datara Agentic Engine"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # Metadata & State Database (SQLite default for local, or PostgreSQL/Supabase)
    DATABASE_URL: str = "sqlite:///./datara_metadata.db"

    # Default Demo Database
    DEMO_DATABASE_URL: str = "sqlite:///./datara_demo.db"

    # Security & Sandbox Limits
    QUERY_TIMEOUT_SECONDS: int = 10
    QUERY_MAX_ROWS: int = 1000

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Gemini LLM (Phase 2)
    GEMINI_API_KEY: str = ""

    # Supabase Build APIs (REST / Client SDK)
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_JWKS_URL: str = ""

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and (self.SUPABASE_SECRET_KEY or self.SUPABASE_PUBLISHABLE_KEY))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v


settings = Settings()

"""
Configuration preset schemas for API.
"""

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlmodel import SQLModel


class FallbackStrategy(SQLModel):
    """Fallback strategy configuration."""

    use_main_for_unset: bool = True
    model_fallback_order: list[str] = Field(default_factory=list)
    timeout_seconds: int = Field(default=30, ge=1, le=300)
    max_retries: int = Field(default=3, ge=0, le=10)


class ConfigPresetBase(SQLModel):
    """Base config preset schema."""

    name: str = Field(min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)


class ConfigPresetCreate(ConfigPresetBase):
    """Schema for creating a config preset."""

    is_default: bool = False

    # Model configs
    main_model_config_id: str
    rag_model_config_id: str | None = None
    rag_enabled: bool = False
    guard_model_config_id: str | None = None
    guard_enabled: bool = False
    storytelling_model_config_id: str | None = None
    storytelling_enabled: bool = False

    # Embedding config
    embedding_config_id: str

    fallback_strategy: FallbackStrategy = Field(default_factory=FallbackStrategy)


class ConfigPresetUpdate(SQLModel):
    """Schema for updating a config preset."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)
    is_default: bool | None = None

    main_model_config_id: str | None = None
    rag_model_config_id: str | None = None
    rag_enabled: bool | None = None
    guard_model_config_id: str | None = None
    guard_enabled: bool | None = None
    storytelling_model_config_id: str | None = None
    storytelling_enabled: bool | None = None

    embedding_config_id: str | None = None

    fallback_strategy: FallbackStrategy | None = None


class ConfigPresetRead(ConfigPresetBase):
    """Schema for reading a config preset."""

    id: str
    user_id: str
    is_default: bool

    main_model_config_id: str
    rag_model_config_id: str | None
    rag_enabled: bool
    guard_model_config_id: str | None
    guard_enabled: bool
    storytelling_model_config_id: str | None
    storytelling_enabled: bool

    embedding_config_id: str

    fallback_strategy: dict[str, Any]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


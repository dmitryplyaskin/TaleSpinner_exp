"""
Embedding configuration schemas for API.
"""

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlmodel import SQLModel

from app.models.provider import ProviderType


class EmbeddingConfigBase(SQLModel):
    """Base embedding config schema."""

    name: str = Field(min_length=1, max_length=128)
    provider: ProviderType
    model_id: str = Field(min_length=1, max_length=256)


class EmbeddingConfigCreate(EmbeddingConfigBase):
    """Schema for creating an embedding config."""

    token_ids: list[str] = Field(default_factory=list)
    dimensions: int | None = Field(default=None, ge=1)
    batch_size: int = Field(default=100, ge=1, le=1000)
    provider_settings: dict[str, Any] = Field(default_factory=dict)


class EmbeddingConfigUpdate(SQLModel):
    """Schema for updating an embedding config."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    provider: ProviderType | None = None
    model_id: str | None = Field(default=None, min_length=1, max_length=256)

    token_ids: list[str] | None = None
    dimensions: int | None = Field(default=None, ge=1)
    batch_size: int | None = Field(default=None, ge=1, le=1000)
    provider_settings: dict[str, Any] | None = None


class EmbeddingConfigRead(EmbeddingConfigBase):
    """Schema for reading an embedding config."""

    id: str
    user_id: str

    token_ids: list[str]
    dimensions: int | None
    batch_size: int
    provider_settings: dict[str, Any]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

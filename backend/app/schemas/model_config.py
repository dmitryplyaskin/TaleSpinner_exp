"""
Model configuration schemas for API.
"""

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlmodel import SQLModel

from app.models.provider import ProviderType, TokenSelectionStrategy


class SamplerSettings(SQLModel):
    """Sampler settings for LLM inference."""

    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)
    max_tokens: int = Field(default=4096, ge=1, le=200000)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    stop_sequences: list[str] = Field(default_factory=list)


class ModelConfigBase(SQLModel):
    """Base model config schema."""

    name: str = Field(min_length=1, max_length=128)
    provider: ProviderType
    model_id: str = Field(min_length=1, max_length=256)


class ModelConfigCreate(ModelConfigBase):
    """Schema for creating a model config."""

    token_ids: list[str] = Field(default_factory=list)
    token_selection_strategy: TokenSelectionStrategy = TokenSelectionStrategy.FAILOVER

    # Sampler settings
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)
    max_tokens: int = Field(default=4096, ge=1, le=200000)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    stop_sequences: list[str] = Field(default_factory=list)

    provider_settings: dict[str, Any] = Field(default_factory=dict)

    base_url: str | None = None
    http_headers: dict[str, Any] = Field(default_factory=dict)


class ModelConfigUpdate(SQLModel):
    """Schema for updating a model config."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    provider: ProviderType | None = None
    model_id: str | None = Field(default=None, min_length=1, max_length=256)

    token_ids: list[str] | None = None
    token_selection_strategy: TokenSelectionStrategy | None = None

    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    top_p: float | None = Field(default=None, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)
    max_tokens: int | None = Field(default=None, ge=1, le=200000)
    frequency_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    presence_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    stop_sequences: list[str] | None = None

    provider_settings: dict[str, Any] | None = None

    base_url: str | None = None
    http_headers: dict[str, Any] | None = None


class ModelConfigRead(ModelConfigBase):
    """Schema for reading a model config."""

    id: str
    user_id: str

    token_ids: list[str]
    token_selection_strategy: TokenSelectionStrategy

    temperature: float
    top_p: float
    top_k: int | None
    max_tokens: int
    frequency_penalty: float
    presence_penalty: float
    stop_sequences: list[str]

    provider_settings: dict[str, Any]

    base_url: str | None
    http_headers: dict[str, Any]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


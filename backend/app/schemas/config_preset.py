"""
Configuration preset schemas for API.
"""

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlmodel import SQLModel

from app.models.provider import ProviderType, TokenSelectionStrategy


class FallbackStrategy(SQLModel):
    """Fallback strategy configuration."""

    use_main_for_unset: bool = True
    model_fallback_order: list[str] = Field(default_factory=list)
    timeout_seconds: int = Field(default=30, ge=1, le=300)
    max_retries: int = Field(default=3, ge=0, le=10)


class SamplerSettings(SQLModel):
    """Sampler settings for LLM inference."""

    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)
    max_tokens: int = Field(default=4096, ge=1, le=200000)
    frequency_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: float = Field(default=0.0, ge=-2.0, le=2.0)
    stop_sequences: list[str] = Field(default_factory=list)


class LLMConfig(SQLModel):
    """LLM model configuration."""

    provider: ProviderType
    model_id: str = Field(min_length=1, max_length=256)
    token_ids: list[str] = Field(default_factory=list)
    token_selection_strategy: TokenSelectionStrategy = TokenSelectionStrategy.FAILOVER
    sampler_settings: SamplerSettings = Field(default_factory=SamplerSettings)
    provider_settings: dict[str, Any] = Field(default_factory=dict)
    base_url: str | None = None
    http_headers: dict[str, Any] = Field(default_factory=dict)


class RAGConfig(SQLModel):
    """RAG configuration."""

    enabled: bool = False
    config: LLMConfig | None = None


class GuardConfig(SQLModel):
    """Guard model configuration."""

    enabled: bool = False
    config: LLMConfig | None = None


class StorytellingConfig(SQLModel):
    """Storytelling model configuration."""

    enabled: bool = False
    config: LLMConfig | None = None


class EmbeddingConfigData(SQLModel):
    """Embedding configuration data."""

    provider: ProviderType
    model_id: str = Field(min_length=1, max_length=256)
    token_ids: list[str] = Field(default_factory=list)
    dimensions: int | None = Field(default=None, ge=1)
    batch_size: int = Field(default=100, ge=1, le=1000)
    provider_settings: dict[str, Any] = Field(default_factory=dict)
    base_url: str | None = None
    http_headers: dict[str, Any] = Field(default_factory=dict)


class GlobalConfigSchema(SQLModel):
    """Global configuration schema combining all model configs."""

    main_model: LLMConfig
    rag: RAGConfig = Field(default_factory=lambda: RAGConfig(enabled=False))
    guard: GuardConfig = Field(default_factory=lambda: GuardConfig(enabled=False))
    storytelling: StorytellingConfig = Field(
        default_factory=lambda: StorytellingConfig(enabled=False)
    )
    embedding: EmbeddingConfigData


class ConfigPresetBase(SQLModel):
    """Base config preset schema."""

    name: str = Field(min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)


class ConfigPresetCreate(ConfigPresetBase):
    """Schema for creating a config preset."""

    is_default: bool = False
    config_data: GlobalConfigSchema
    fallback_strategy: FallbackStrategy = Field(default_factory=FallbackStrategy)


class ConfigPresetUpdate(SQLModel):
    """Schema for updating a config preset."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)
    is_default: bool | None = None
    config_data: GlobalConfigSchema | None = None
    fallback_strategy: FallbackStrategy | None = None


class ConfigPresetRead(ConfigPresetBase):
    """Schema for reading a config preset."""

    id: str
    user_id: str
    is_default: bool
    config_data: dict[str, Any]
    fallback_strategy: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


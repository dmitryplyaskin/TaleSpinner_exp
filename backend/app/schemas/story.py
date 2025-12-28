"""
Story and StoryConfig schemas for API.
"""

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlmodel import SQLModel


class StoryBase(SQLModel):
    """Base story schema."""

    title: str = Field(min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=1024)


class StoryCreate(StoryBase):
    """Schema for creating a story."""

    preset_id: str


class StoryUpdate(SQLModel):
    """Schema for updating a story."""

    title: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = Field(default=None, max_length=1024)
    is_active: bool | None = None


class StoryRead(StoryBase):
    """Schema for reading a story."""

    id: str
    user_id: str
    preset_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Story Config schemas


class StoryConfigOverrides(SQLModel):
    """Schema for model config overrides."""

    # Sampler overrides
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    top_p: float | None = Field(default=None, ge=0.0, le=1.0)
    top_k: int | None = Field(default=None, ge=1)
    max_tokens: int | None = Field(default=None, ge=1, le=200000)
    frequency_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    presence_penalty: float | None = Field(default=None, ge=-2.0, le=2.0)
    stop_sequences: list[str] | None = None

    # Can also override model_id if needed
    model_id: str | None = None


class StoryConfigUpdate(SQLModel):
    """Schema for updating story config overrides."""

    main_model_override: StoryConfigOverrides | None = None
    rag_model_override: StoryConfigOverrides | None = None
    guard_model_override: StoryConfigOverrides | None = None
    storytelling_model_override: StoryConfigOverrides | None = None
    embedding_override: dict[str, Any] | None = None

    rag_enabled_override: bool | None = None
    guard_enabled_override: bool | None = None
    storytelling_enabled_override: bool | None = None


class StoryConfigRead(SQLModel):
    """Schema for reading story config."""

    id: str
    story_id: str

    main_model_override: dict[str, Any] | None
    rag_model_override: dict[str, Any] | None
    guard_model_override: dict[str, Any] | None
    storytelling_model_override: dict[str, Any] | None
    embedding_override: dict[str, Any] | None

    rag_enabled_override: bool | None
    guard_enabled_override: bool | None
    storytelling_enabled_override: bool | None

    updated_at: datetime

    model_config = {"from_attributes": True}


class StoryWithConfig(StoryRead):
    """Story with its config."""

    config: StoryConfigRead | None = None


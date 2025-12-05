"""
Story and StoryConfig models.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.config_preset import ConfigPreset
    from app.models.user import User


class Story(SQLModel, table=True):
    """A story/session created by a user."""

    __tablename__ = "stories"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    title: str = Field(max_length=256, nullable=False)
    description: str | None = Field(default=None, max_length=1024, nullable=True)

    # Base preset for this story
    preset_id: str = Field(foreign_key="config_presets.id", nullable=False)

    # Story state
    is_active: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="stories")
    preset: "ConfigPreset" = Relationship(back_populates="stories")
    config: "StoryConfig" = Relationship(
        back_populates="story",
        sa_relationship_kwargs={"uselist": False},
    )


class StoryConfig(SQLModel, table=True):
    """
    Configuration overrides for a specific story.
    Inherits from preset but allows per-story customization.
    """

    __tablename__ = "story_configs"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    story_id: str = Field(
        foreign_key="stories.id", unique=True, index=True, nullable=False
    )

    # Override flags and values
    # These are JSON objects that contain only the overridden fields
    main_model_override: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )
    rag_model_override: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )
    guard_model_override: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )
    storytelling_model_override: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )
    embedding_override: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )

    # Can also override enabled states
    rag_enabled_override: bool | None = Field(default=None, nullable=True)
    guard_enabled_override: bool | None = Field(default=None, nullable=True)
    storytelling_enabled_override: bool | None = Field(default=None, nullable=True)

    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    story: "Story" = Relationship(back_populates="config")

"""
Configuration preset model.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.story import Story
    from app.models.user import User


class ConfigPreset(SQLModel, table=True):
    """User's configuration preset combining model configs."""

    __tablename__ = "config_presets"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    name: str = Field(max_length=128, nullable=False)
    description: str | None = Field(default=None, max_length=512, nullable=True)
    is_default: bool = Field(default=False, nullable=False)

    # Configuration data stored as JSON
    config_data: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )

    # Fallback strategy
    fallback_strategy: dict[str, Any] = Field(
        default_factory=lambda: {
            "use_main_for_unset": True,
            "model_fallback_order": [],
            "timeout_seconds": 30,
            "max_retries": 3,
        },
        sa_column=Column(JSON),
    )

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="config_presets")
    stories: list["Story"] = Relationship(back_populates="preset")


"""
Configuration preset model.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.embedding_config import EmbeddingConfig
    from app.models.model_config import ModelConfig
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

    # Main model (required)
    main_model_config_id: str = Field(
        foreign_key="model_configs.id", nullable=False
    )

    # RAG model (optional)
    rag_model_config_id: str | None = Field(
        default=None, foreign_key="model_configs.id", nullable=True
    )
    rag_enabled: bool = Field(default=False, nullable=False)

    # Guard model (optional) - for validation/checking
    guard_model_config_id: str | None = Field(
        default=None, foreign_key="model_configs.id", nullable=True
    )
    guard_enabled: bool = Field(default=False, nullable=False)

    # Storytelling model (optional) - for final output
    storytelling_model_config_id: str | None = Field(
        default=None, foreign_key="model_configs.id", nullable=True
    )
    storytelling_enabled: bool = Field(default=False, nullable=False)

    # Embedding config (required)
    embedding_config_id: str = Field(
        foreign_key="embedding_configs.id", nullable=False
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

    # Note: SQLModel doesn't support multiple FKs to same table well in relationships
    # We'll handle model config lookups in the service layer

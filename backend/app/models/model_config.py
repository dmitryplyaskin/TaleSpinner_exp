"""
Model configuration for LLM settings.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from app.models.provider import ProviderType, TokenSelectionStrategy

if TYPE_CHECKING:
    from app.models.user import User


class ModelConfig(SQLModel, table=True):
    """Reusable LLM model configuration."""

    __tablename__ = "model_configs"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    name: str = Field(max_length=128, nullable=False)  # e.g., "Fast GPT-4"
    provider: ProviderType = Field(nullable=False)
    model_id: str = Field(
        max_length=256, nullable=False
    )  # e.g., "anthropic/claude-3.5-sonnet"

    # Token configuration
    token_ids: list[str] = Field(
        default_factory=list, sa_column=Column(JSON)
    )  # Array of token IDs for fallback/rotation
    token_selection_strategy: TokenSelectionStrategy = Field(
        default=TokenSelectionStrategy.FAILOVER, nullable=False
    )

    # Sampler settings
    temperature: float = Field(default=0.7, nullable=False)
    top_p: float = Field(default=1.0, nullable=False)
    top_k: int | None = Field(default=None, nullable=True)
    max_tokens: int = Field(default=4096, nullable=False)
    frequency_penalty: float = Field(default=0.0, nullable=False)
    presence_penalty: float = Field(default=0.0, nullable=False)
    stop_sequences: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Provider-specific settings (JSON)
    provider_settings: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="model_configs")

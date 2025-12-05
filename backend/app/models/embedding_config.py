"""
Embedding configuration model.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from app.models.provider import ProviderType

if TYPE_CHECKING:
    from app.models.user import User


class EmbeddingConfig(SQLModel, table=True):
    """Configuration for embedding models."""

    __tablename__ = "embedding_configs"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    name: str = Field(max_length=128, nullable=False)
    provider: ProviderType = Field(nullable=False)
    model_id: str = Field(max_length=256, nullable=False)

    # Token configuration (for providers that require API keys)
    token_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Embedding-specific settings
    dimensions: int | None = Field(default=None, nullable=True)
    batch_size: int = Field(default=100, nullable=False)

    # Provider-specific settings
    provider_settings: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="embedding_configs")

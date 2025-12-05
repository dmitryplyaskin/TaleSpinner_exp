"""
API Token model for storing encrypted provider tokens.
"""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel

from app.models.provider import ProviderType

if TYPE_CHECKING:
    from app.models.user import User


class Token(SQLModel, table=True):
    """Encrypted API token for a provider."""

    __tablename__ = "tokens"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    provider: ProviderType = Field(nullable=False)
    name: str = Field(max_length=128, nullable=False)  # User-friendly name
    encrypted_token: str = Field(nullable=False)  # Fernet encrypted
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="tokens")

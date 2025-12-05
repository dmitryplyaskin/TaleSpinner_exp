"""
Token schemas for API.
"""

from datetime import datetime

from pydantic import Field
from sqlmodel import SQLModel

from app.models.provider import ProviderType


class TokenBase(SQLModel):
    """Base token schema."""

    provider: ProviderType
    name: str = Field(min_length=1, max_length=128)


class TokenCreate(TokenBase):
    """Schema for creating a token."""

    token: str = Field(min_length=1, description="Plain text API token")


class TokenUpdate(SQLModel):
    """Schema for updating a token."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    token: str | None = Field(default=None, min_length=1, description="New plain text API token")
    is_active: bool | None = None


class TokenRead(TokenBase):
    """Schema for reading a token (without the actual token value)."""

    id: str
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Token value is never exposed
    model_config = {"from_attributes": True}

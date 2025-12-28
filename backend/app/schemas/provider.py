"""
Provider-related schemas.
"""

from pydantic import BaseModel

from app.models.provider import ModelType, ProviderType


class ProviderInfo(BaseModel):
    """Provider information."""

    id: ProviderType
    name: str
    supports_llm: bool
    supports_embedding: bool
    requires_api_key: bool


class ProviderModelInfo(BaseModel):
    """Model information from a provider."""

    id: str  # Model identifier (e.g., "anthropic/claude-3.5-sonnet")
    name: str  # Display name
    provider: ProviderType
    model_type: ModelType
    context_length: int | None = None
    description: str | None = None


class ProviderModelsResponse(BaseModel):
    """Response containing list of models from a provider."""

    provider: ProviderType
    models: list[ProviderModelInfo]
    cached: bool = False


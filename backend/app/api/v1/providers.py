"""
Provider API endpoints.
"""

from typing import List

from fastapi import APIRouter, Query

from app.models.provider import ModelType, ProviderType
from app.schemas.provider import ProviderInfo, ProviderModelsResponse
from app.services import providers as provider_service

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/", response_model=List[ProviderInfo])
def list_providers():
    """List all supported LLM/embedding providers."""
    return provider_service.get_providers()


@router.get("/{provider_id}", response_model=ProviderInfo)
def get_provider(provider_id: ProviderType):
    """Get information about a specific provider."""
    provider = provider_service.get_provider(provider_id)
    if not provider:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )
    return provider


@router.get("/{provider_id}/models", response_model=ProviderModelsResponse)
async def get_provider_models(
    provider_id: ProviderType,
    model_type: ModelType | None = Query(default=None, description="Filter by model type"),
    force_refresh: bool = Query(default=False, description="Force refresh the cache"),
    api_key: str | None = Query(default=None, description="API key for authenticated requests"),
):
    """
    Get available models from a provider.

    Models are cached in memory with a 5-minute TTL.
    Use force_refresh=true to bypass the cache.
    """
    response = await provider_service.get_provider_models(
        provider=provider_id,
        api_key=api_key,
        force_refresh=force_refresh,
    )

    # Filter by type if requested
    if model_type:
        response.models = provider_service.filter_models_by_type(
            response.models, model_type
        )

    return response


@router.post("/{provider_id}/models/refresh", response_model=ProviderModelsResponse)
async def refresh_provider_models(
    provider_id: ProviderType,
    api_key: str | None = Query(default=None, description="API key for authenticated requests"),
):
    """Force refresh the models cache for a provider."""
    return await provider_service.get_provider_models(
        provider=provider_id,
        api_key=api_key,
        force_refresh=True,
    )

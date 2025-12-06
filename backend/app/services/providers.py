"""
Provider service for fetching and caching model lists from LLM providers.
"""

import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import settings
from app.models.provider import ModelType, ProviderType, PROVIDER_CAPABILITIES
from app.schemas.provider import ProviderInfo, ProviderModelInfo, ProviderModelsResponse


@dataclass
class CacheEntry:
    """Cache entry with TTL."""

    data: list[ProviderModelInfo]
    timestamp: float
    ttl: int = field(default_factory=lambda: settings.MODEL_CACHE_TTL)

    def is_expired(self) -> bool:
        return time.time() - self.timestamp > self.ttl


# In-memory cache for provider models
# Key is (ProviderType, base_url)
_models_cache: dict[tuple[ProviderType, str | None], CacheEntry] = {}


def get_providers() -> list[ProviderInfo]:
    """Get list of all supported providers."""
    return [
        ProviderInfo(
            id=provider,
            name=provider.value.title(),
            supports_llm=caps["supports_llm"],
            supports_embedding=caps["supports_embedding"],
            requires_api_key=caps["requires_api_key"],
        )
        for provider, caps in PROVIDER_CAPABILITIES.items()
    ]


def get_provider(provider_id: ProviderType) -> ProviderInfo | None:
    """Get a specific provider by ID."""
    caps = PROVIDER_CAPABILITIES.get(provider_id)
    if not caps:
        return None
    return ProviderInfo(
        id=provider_id,
        name=provider_id.value.title(),
        supports_llm=caps["supports_llm"],
        supports_embedding=caps["supports_embedding"],
        requires_api_key=caps["requires_api_key"],
    )


async def fetch_openrouter_models(api_key: str | None = None) -> list[ProviderModelInfo]:
    """Fetch models from OpenRouter API."""
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.OPENROUTER_BASE_URL}/models",
            headers=headers,
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

    models: list[ProviderModelInfo] = []
    for model in data.get("data", []):
        model_id = model.get("id", "")
        # Skip if no ID
        if not model_id:
            continue

        # Determine model type based on architecture or capabilities
        architecture = model.get("architecture", {})
        model_type = ModelType.LLM

        # Check if it's an embedding model
        if "embed" in model_id.lower() or architecture.get("modality") == "text->vector":
            model_type = ModelType.EMBEDDING

        models.append(
            ProviderModelInfo(
                id=model_id,
                name=model.get("name", model_id),
                provider=ProviderType.OPENROUTER,
                model_type=model_type,
                context_length=model.get("context_length"),
                description=model.get("description"),
            )
        )

    return models


async def fetch_ollama_models() -> list[ProviderModelInfo]:
    """Fetch models from local Ollama instance."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_BASE_URL}/api/tags",
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.ConnectError:
        # Ollama not running locally
        return []
    except httpx.HTTPError:
        return []

    models: list[ProviderModelInfo] = []
    for model in data.get("models", []):
        model_name = model.get("name", "")
        if not model_name:
            continue

        # Determine model type
        model_type = ModelType.LLM
        name_lower = model_name.lower()
        if "embed" in name_lower or "nomic" in name_lower or "bge" in name_lower:
            model_type = ModelType.EMBEDDING

        # Get details
        details = model.get("details", {})

        models.append(
            ProviderModelInfo(
                id=model_name,
                name=model_name,
                provider=ProviderType.OLLAMA,
                model_type=model_type,
                context_length=details.get("parameter_size"),
                description=None,
            )
        )

    return models


async def fetch_openai_compatible_models(base_url: str, api_key: str | None = None) -> list[ProviderModelInfo]:
    """Fetch models from OpenAI Compatible API."""
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = base_url.rstrip("/") + "/models"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError:
        return []

    models: list[ProviderModelInfo] = []
    for model in data.get("data", []):
        model_id = model.get("id", "")
        if not model_id:
            continue

        # Determine model type
        # OpenAI models list doesn't explicitly distinguish embeddings vs LLM usually in the same way,
        # but often embeddings have "embedding" in name.
        model_type = ModelType.LLM
        if "embedding" in model_id.lower() or "ada-002" in model_id.lower():
            model_type = ModelType.EMBEDDING

        models.append(
            ProviderModelInfo(
                id=model_id,
                name=model_id,
                provider=ProviderType.OPENAI_COMPATIBLE,
                model_type=model_type,
                context_length=None,
                description=None,
            )
        )
    return models


async def get_provider_models(
    provider: ProviderType,
    api_key: str | None = None,
    base_url: str | None = None,
    force_refresh: bool = False,
) -> ProviderModelsResponse:
    """
    Get models for a provider with caching.

    Args:
        provider: The provider to get models for
        api_key: Optional API key for authenticated requests
        base_url: Optional base URL for custom providers
        force_refresh: Force refresh the cache

    Returns:
        ProviderModelsResponse with list of models
    """
    # Check cache
    cache_key = (provider, base_url)
    cached = _models_cache.get(cache_key)
    if cached and not cached.is_expired() and not force_refresh:
        return ProviderModelsResponse(
            provider=provider,
            models=cached.data,
            cached=True,
        )

    # Fetch fresh data
    models: list[ProviderModelInfo] = []

    if provider == ProviderType.OPENROUTER:
        models = await fetch_openrouter_models(api_key)
    elif provider == ProviderType.OLLAMA:
        models = await fetch_ollama_models()
    elif provider == ProviderType.OPENAI_COMPATIBLE:
        if base_url:
            models = await fetch_openai_compatible_models(base_url, api_key)
        else:
            # If no base_url provided for OpenAI Compatible, we can't fetch models
            models = []

    # Update cache
    _models_cache[cache_key] = CacheEntry(
        data=models,
        timestamp=time.time(),
    )

    return ProviderModelsResponse(
        provider=provider,
        models=models,
        cached=False,
    )


def clear_models_cache(provider: ProviderType | None = None) -> None:
    """Clear the models cache for a provider or all providers."""
    if provider:
        # Clear all entries for this provider (ignoring base_url)
        keys_to_remove = [k for k in _models_cache.keys() if k[0] == provider]
        for k in keys_to_remove:
            _models_cache.pop(k, None)
    else:
        _models_cache.clear()


def filter_models_by_type(
    models: list[ProviderModelInfo],
    model_type: ModelType,
) -> list[ProviderModelInfo]:
    """Filter models by type (LLM or Embedding)."""
    return [m for m in models if m.model_type == model_type]


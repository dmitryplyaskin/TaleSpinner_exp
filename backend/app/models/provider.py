"""
Provider enum and related types.
"""

from enum import Enum
from typing import Literal


class ProviderType(str, Enum):
    """Supported LLM/Embedding providers."""

    OPENROUTER = "openrouter"
    OLLAMA = "ollama"


class ModelType(str, Enum):
    """Type of model."""

    LLM = "llm"
    EMBEDDING = "embedding"


class TokenSelectionStrategy(str, Enum):
    """Strategy for selecting tokens when multiple are available."""

    RANDOM = "random"
    SEQUENTIAL = "sequential"
    FAILOVER = "failover"


# Provider capabilities
PROVIDER_CAPABILITIES: dict[ProviderType, dict] = {
    ProviderType.OPENROUTER: {
        "supports_llm": True,
        "supports_embedding": True,
        "requires_api_key": True,
        "base_url": "https://openrouter.ai/api/v1",
        "models_endpoint": "/models",
    },
    ProviderType.OLLAMA: {
        "supports_llm": True,
        "supports_embedding": True,
        "requires_api_key": False,
        "base_url": "http://localhost:11434",
        "models_endpoint": "/api/tags",
    },
}

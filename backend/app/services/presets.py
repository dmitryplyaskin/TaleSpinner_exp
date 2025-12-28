"""
Configuration preset service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.models.config_preset import ConfigPreset
from app.models.provider import ProviderType, TokenSelectionStrategy
from app.schemas.config_preset import (
    ConfigPresetCreate,
    ConfigPresetUpdate,
    EmbeddingConfigData,
    GlobalConfigSchema,
    LLMConfig,
    RAGConfig,
    GuardConfig,
    StorytellingConfig,
    SamplerSettings,
)


def create_preset(
    session: Session, user_id: str, payload: ConfigPresetCreate
) -> ConfigPreset:
    """Create a new configuration preset."""
    # If this is set as default, unset other defaults
    if payload.is_default:
        _unset_other_defaults(session, user_id)

    preset = ConfigPreset(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
        config_data=payload.config_data.model_dump(),
        fallback_strategy=payload.fallback_strategy.model_dump(),
    )
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


def list_presets(session: Session, user_id: str) -> Iterable[ConfigPreset]:
    """List all presets for a user."""
    return session.exec(
        select(ConfigPreset)
        .where(ConfigPreset.user_id == user_id)
        .order_by(ConfigPreset.created_at)
    ).all()


def get_preset(session: Session, user_id: str, preset_id: str) -> ConfigPreset:
    """Get a specific preset."""
    preset = session.exec(
        select(ConfigPreset)
        .where(ConfigPreset.id == preset_id)
        .where(ConfigPreset.user_id == user_id)
    ).first()
    if not preset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )
    return preset


def get_default_preset(session: Session, user_id: str) -> ConfigPreset | None:
    """Get the default preset for a user."""
    return session.exec(
        select(ConfigPreset)
        .where(ConfigPreset.user_id == user_id)
        .where(ConfigPreset.is_default == True)
    ).first()


def update_preset(
    session: Session, user_id: str, preset_id: str, payload: ConfigPresetUpdate
) -> ConfigPreset:
    """Update a preset."""
    preset = get_preset(session, user_id, preset_id)

    # Handle default flag
    if payload.is_default is True:
        _unset_other_defaults(session, user_id, exclude_id=preset_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Handle config_data separately - convert to dict if it's a Pydantic model
    if "config_data" in update_data and update_data["config_data"]:
        if hasattr(update_data["config_data"], "model_dump"):
            update_data["config_data"] = update_data["config_data"].model_dump()

    # Handle fallback_strategy separately
    if "fallback_strategy" in update_data and update_data["fallback_strategy"]:
        if hasattr(update_data["fallback_strategy"], "model_dump"):
            update_data["fallback_strategy"] = update_data["fallback_strategy"].model_dump()

    for key, value in update_data.items():
        setattr(preset, key, value)

    preset.updated_at = datetime.utcnow()
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


def delete_preset(session: Session, user_id: str, preset_id: str) -> None:
    """Delete a preset."""
    preset = get_preset(session, user_id, preset_id)
    session.delete(preset)
    session.commit()


def create_default_preset_structure(session: Session, user_id: str) -> ConfigPreset:
    """Create a default preset structure with necessary model configs."""
    # Create default config_data structure
    default_llm_model_id = settings.openrouter_main_model or "openai/gpt-4o-mini"
    default_main_model = LLMConfig(
        provider=ProviderType.OPENROUTER,
        model_id=default_llm_model_id,
        token_ids=[],
        token_selection_strategy=TokenSelectionStrategy.FAILOVER,
        sampler_settings=SamplerSettings(temperature=0.7),
        base_url=settings.OPENROUTER_BASE_URL,
    )

    # Optional LLM blocks
    rag_config = RAGConfig(
        enabled=settings.RAG_ENABLED,
        config=(
            LLMConfig(
                provider=ProviderType.OPENROUTER,
                model_id=(settings.OPENROUTER_RAG_MODEL or default_llm_model_id),
                token_ids=[],
                token_selection_strategy=TokenSelectionStrategy.FAILOVER,
                sampler_settings=SamplerSettings(temperature=0.7),
                base_url=settings.OPENROUTER_BASE_URL,
            )
            if settings.RAG_ENABLED
            else None
        ),
    )

    guard_config = GuardConfig(
        enabled=settings.GUARD_ENABLED,
        config=(
            LLMConfig(
                provider=ProviderType.OPENROUTER,
                model_id=(settings.OPENROUTER_GUARD_MODEL or default_llm_model_id),
                token_ids=[],
                token_selection_strategy=TokenSelectionStrategy.FAILOVER,
                sampler_settings=SamplerSettings(temperature=0.7),
                base_url=settings.OPENROUTER_BASE_URL,
            )
            if settings.GUARD_ENABLED
            else None
        ),
    )

    storytelling_config = StorytellingConfig(
        enabled=settings.STORYTELLING_ENABLED,
        config=(
            LLMConfig(
                provider=ProviderType.OPENROUTER,
                model_id=(
                    settings.OPENROUTER_STORYTELLING_MODEL or default_llm_model_id
                ),
                token_ids=[],
                token_selection_strategy=TokenSelectionStrategy.FAILOVER,
                sampler_settings=SamplerSettings(temperature=0.7),
                base_url=settings.OPENROUTER_BASE_URL,
            )
            if settings.STORYTELLING_ENABLED
            else None
        ),
    )

    default_embedding = EmbeddingConfigData(
        provider=ProviderType.OLLAMA,
        model_id=settings.OLLAMA_EMBEDDING_MODEL.strip() or "nomic-embed-text",
        token_ids=[],
        dimensions=settings.OLLAMA_EMBEDDING_DIMENSIONS,
        batch_size=100,
        base_url=settings.OLLAMA_BASE_URL,
    )

    default_config_data = GlobalConfigSchema(
        main_model=default_main_model,
        rag=rag_config,
        guard=guard_config,
        storytelling=storytelling_config,
        embedding=default_embedding,
    )

    # Create preset with config_data
    preset_payload = ConfigPresetCreate(
        name="Default Preset",
        description="Automatically created default configuration",
        is_default=True,
        config_data=default_config_data,
    )

    return create_preset(session, user_id, preset_payload)


def _unset_other_defaults(
    session: Session, user_id: str, exclude_id: str | None = None
) -> None:
    """Unset is_default for all other presets."""
    query = select(ConfigPreset).where(
        ConfigPreset.user_id == user_id,
        ConfigPreset.is_default == True,
    )
    if exclude_id:
        query = query.where(ConfigPreset.id != exclude_id)

    for preset in session.exec(query).all():
        preset.is_default = False
        session.add(preset)




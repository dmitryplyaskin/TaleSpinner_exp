"""
Configuration preset service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

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
    default_main_model = LLMConfig(
        provider=ProviderType.OPENAI_COMPATIBLE,
        model_id="gpt-4o-mini",
        token_ids=[],
        token_selection_strategy=TokenSelectionStrategy.FAILOVER,
        sampler_settings=SamplerSettings(temperature=0.7),
    )

    default_embedding = EmbeddingConfigData(
        provider=ProviderType.OPENAI_COMPATIBLE,
        model_id="text-embedding-3-small",
        token_ids=[],
        dimensions=1536,
        batch_size=100,
    )

    default_config_data = GlobalConfigSchema(
        main_model=default_main_model,
        rag=RAGConfig(enabled=False),
        guard=GuardConfig(enabled=False),
        storytelling=StorytellingConfig(enabled=False),
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




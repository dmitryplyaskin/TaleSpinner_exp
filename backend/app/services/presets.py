"""
Configuration preset service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.config_preset import ConfigPreset
from app.schemas.config_preset import ConfigPresetCreate, ConfigPresetUpdate
from app.schemas.embedding_config import EmbeddingConfigCreate
from app.schemas.model_config import ModelConfigCreate
from app.models.provider import ProviderType
from app.services import embedding_configs, model_configs


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
        main_model_config_id=payload.main_model_config_id,
        rag_model_config_id=payload.rag_model_config_id,
        rag_enabled=payload.rag_enabled,
        guard_model_config_id=payload.guard_model_config_id,
        guard_enabled=payload.guard_enabled,
        storytelling_model_config_id=payload.storytelling_model_config_id,
        storytelling_enabled=payload.storytelling_enabled,
        embedding_config_id=payload.embedding_config_id,
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

    # Handle fallback_strategy separately
    if "fallback_strategy" in update_data and update_data["fallback_strategy"]:
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
    # 1. Create default embedding config
    embedding_payload = EmbeddingConfigCreate(
        name="Default OpenAI Embedding",
        provider=ProviderType.OPENAI_COMPATIBLE,
        model_id="text-embedding-3-small",
        dimensions=1536,
    )
    embedding_config = embedding_configs.create_embedding_config(
        session, user_id, embedding_payload
    )

    # 2. Create default model config
    model_payload = ModelConfigCreate(
        name="Default OpenAI Model",
        provider=ProviderType.OPENAI_COMPATIBLE,
        model_id="gpt-4o-mini",
        temperature=0.7,
    )
    model_config = model_configs.create_model_config(session, user_id, model_payload)

    # 3. Create preset linking them
    preset_payload = ConfigPresetCreate(
        name="Default Preset",
        description="Automatically created default configuration",
        is_default=True,
        main_model_config_id=model_config.id,
        embedding_config_id=embedding_config.id,
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




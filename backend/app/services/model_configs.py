"""
Model configuration service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.model_config import ModelConfig
from app.schemas.model_config import ModelConfigCreate, ModelConfigUpdate


def create_model_config(
    session: Session, user_id: str, payload: ModelConfigCreate
) -> ModelConfig:
    """Create a new model configuration."""
    config = ModelConfig(
        user_id=user_id,
        name=payload.name,
        provider=payload.provider,
        model_id=payload.model_id,
        token_ids=payload.token_ids,
        token_selection_strategy=payload.token_selection_strategy,
        temperature=payload.temperature,
        top_p=payload.top_p,
        top_k=payload.top_k,
        max_tokens=payload.max_tokens,
        frequency_penalty=payload.frequency_penalty,
        presence_penalty=payload.presence_penalty,
        stop_sequences=payload.stop_sequences,
        provider_settings=payload.provider_settings,
    )
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


def list_model_configs(session: Session, user_id: str) -> Iterable[ModelConfig]:
    """List all model configurations for a user."""
    return session.exec(
        select(ModelConfig)
        .where(ModelConfig.user_id == user_id)
        .order_by(ModelConfig.created_at)
    ).all()


def get_model_config(session: Session, user_id: str, config_id: str) -> ModelConfig:
    """Get a specific model configuration."""
    config = session.exec(
        select(ModelConfig)
        .where(ModelConfig.id == config_id)
        .where(ModelConfig.user_id == user_id)
    ).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model configuration not found",
        )
    return config


def update_model_config(
    session: Session, user_id: str, config_id: str, payload: ModelConfigUpdate
) -> ModelConfig:
    """Update a model configuration."""
    config = get_model_config(session, user_id, config_id)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    config.updated_at = datetime.utcnow()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


def delete_model_config(session: Session, user_id: str, config_id: str) -> None:
    """Delete a model configuration."""
    config = get_model_config(session, user_id, config_id)
    session.delete(config)
    session.commit()

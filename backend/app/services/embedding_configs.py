"""
Embedding configuration service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.embedding_config import EmbeddingConfig
from app.schemas.embedding_config import EmbeddingConfigCreate, EmbeddingConfigUpdate


def create_embedding_config(
    session: Session, user_id: str, payload: EmbeddingConfigCreate
) -> EmbeddingConfig:
    """Create a new embedding configuration."""
    config = EmbeddingConfig(
        user_id=user_id,
        name=payload.name,
        provider=payload.provider,
        model_id=payload.model_id,
        token_ids=payload.token_ids,
        dimensions=payload.dimensions,
        batch_size=payload.batch_size,
        provider_settings=payload.provider_settings,
    )
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


def list_embedding_configs(session: Session, user_id: str) -> Iterable[EmbeddingConfig]:
    """List all embedding configurations for a user."""
    return session.exec(
        select(EmbeddingConfig)
        .where(EmbeddingConfig.user_id == user_id)
        .order_by(EmbeddingConfig.created_at)
    ).all()


def get_embedding_config(
    session: Session, user_id: str, config_id: str
) -> EmbeddingConfig:
    """Get a specific embedding configuration."""
    config = session.exec(
        select(EmbeddingConfig)
        .where(EmbeddingConfig.id == config_id)
        .where(EmbeddingConfig.user_id == user_id)
    ).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedding configuration not found",
        )
    return config


def update_embedding_config(
    session: Session, user_id: str, config_id: str, payload: EmbeddingConfigUpdate
) -> EmbeddingConfig:
    """Update an embedding configuration."""
    config = get_embedding_config(session, user_id, config_id)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    config.updated_at = datetime.utcnow()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


def delete_embedding_config(session: Session, user_id: str, config_id: str) -> None:
    """Delete an embedding configuration."""
    config = get_embedding_config(session, user_id, config_id)
    session.delete(config)
    session.commit()

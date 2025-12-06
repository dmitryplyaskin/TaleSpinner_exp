"""
Embedding configuration API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, Header, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.embedding_config import (
    EmbeddingConfigCreate,
    EmbeddingConfigRead,
    EmbeddingConfigUpdate,
)
from app.services import embedding_configs as config_service

router = APIRouter(prefix="/embedding-configs", tags=["embedding-configs"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    """Extract user ID from header."""
    return x_user_id


@router.get("/", response_model=List[EmbeddingConfigRead])
def list_embedding_configs(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """List all embedding configurations for the current user."""
    configs = config_service.list_embedding_configs(session, user_id)
    return [EmbeddingConfigRead.model_validate(c) for c in configs]


@router.post("/", response_model=EmbeddingConfigRead, status_code=status.HTTP_201_CREATED)
def create_embedding_config(
    payload: EmbeddingConfigCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Create a new embedding configuration."""
    config = config_service.create_embedding_config(session, user_id, payload)
    return EmbeddingConfigRead.model_validate(config)


@router.get("/{config_id}", response_model=EmbeddingConfigRead)
def get_embedding_config(
    config_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get a specific embedding configuration."""
    config = config_service.get_embedding_config(session, user_id, config_id)
    return EmbeddingConfigRead.model_validate(config)


@router.patch("/{config_id}", response_model=EmbeddingConfigRead)
def update_embedding_config(
    config_id: str,
    payload: EmbeddingConfigUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update an embedding configuration."""
    config = config_service.update_embedding_config(session, user_id, config_id, payload)
    return EmbeddingConfigRead.model_validate(config)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_embedding_config(
    config_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Delete an embedding configuration."""
    config_service.delete_embedding_config(session, user_id, config_id)
    return None


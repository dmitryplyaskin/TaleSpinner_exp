"""
Model configuration API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, Header, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.model_config import ModelConfigCreate, ModelConfigRead, ModelConfigUpdate
from app.services import model_configs as config_service

router = APIRouter(prefix="/model-configs", tags=["model-configs"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    """Extract user ID from header."""
    return x_user_id


@router.get("/", response_model=List[ModelConfigRead])
def list_model_configs(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """List all model configurations for the current user."""
    configs = config_service.list_model_configs(session, user_id)
    return [ModelConfigRead.model_validate(c) for c in configs]


@router.post("/", response_model=ModelConfigRead, status_code=status.HTTP_201_CREATED)
def create_model_config(
    payload: ModelConfigCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Create a new model configuration."""
    config = config_service.create_model_config(session, user_id, payload)
    return ModelConfigRead.model_validate(config)


@router.get("/{config_id}", response_model=ModelConfigRead)
def get_model_config(
    config_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get a specific model configuration."""
    config = config_service.get_model_config(session, user_id, config_id)
    return ModelConfigRead.model_validate(config)


@router.patch("/{config_id}", response_model=ModelConfigRead)
def update_model_config(
    config_id: str,
    payload: ModelConfigUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update a model configuration."""
    config = config_service.update_model_config(session, user_id, config_id, payload)
    return ModelConfigRead.model_validate(config)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model_config(
    config_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Delete a model configuration."""
    config_service.delete_model_config(session, user_id, config_id)
    return None


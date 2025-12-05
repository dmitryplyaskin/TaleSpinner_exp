"""
Configuration preset API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, Header, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.config_preset import ConfigPresetCreate, ConfigPresetRead, ConfigPresetUpdate
from app.services import presets as preset_service

router = APIRouter(prefix="/presets", tags=["presets"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    """Extract user ID from header."""
    return x_user_id


@router.get("/", response_model=List[ConfigPresetRead])
def list_presets(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """List all configuration presets for the current user."""
    presets = preset_service.list_presets(session, user_id)
    return [ConfigPresetRead.model_validate(p) for p in presets]


@router.post("/", response_model=ConfigPresetRead, status_code=status.HTTP_201_CREATED)
def create_preset(
    payload: ConfigPresetCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Create a new configuration preset."""
    preset = preset_service.create_preset(session, user_id, payload)
    return ConfigPresetRead.model_validate(preset)


@router.get("/default", response_model=ConfigPresetRead | None)
def get_default_preset(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get the default preset for the current user."""
    preset = preset_service.get_default_preset(session, user_id)
    if preset:
        return ConfigPresetRead.model_validate(preset)
    return None


@router.get("/{preset_id}", response_model=ConfigPresetRead)
def get_preset(
    preset_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get a specific preset."""
    preset = preset_service.get_preset(session, user_id, preset_id)
    return ConfigPresetRead.model_validate(preset)


@router.patch("/{preset_id}", response_model=ConfigPresetRead)
def update_preset(
    preset_id: str,
    payload: ConfigPresetUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update a preset."""
    preset = preset_service.update_preset(session, user_id, preset_id, payload)
    return ConfigPresetRead.model_validate(preset)


@router.delete("/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preset(
    preset_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Delete a preset."""
    preset_service.delete_preset(session, user_id, preset_id)
    return None

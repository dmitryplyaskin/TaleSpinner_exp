"""
Story API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, Header, Query, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.story import (
    StoryCreate,
    StoryRead,
    StoryUpdate,
    StoryConfigRead,
    StoryConfigUpdate,
    StoryWithConfig,
)
from app.services import stories as story_service

router = APIRouter(prefix="/stories", tags=["stories"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    """Extract user ID from header."""
    return x_user_id


@router.get("/", response_model=List[StoryRead])
def list_stories(
    active_only: bool = Query(default=False, description="Only return active stories"),
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """List all stories for the current user."""
    stories = story_service.list_stories(session, user_id, active_only=active_only)
    return [StoryRead.model_validate(s) for s in stories]


@router.post("/", response_model=StoryRead, status_code=status.HTTP_201_CREATED)
def create_story(
    payload: StoryCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Create a new story."""
    story = story_service.create_story(session, user_id, payload)
    return StoryRead.model_validate(story)


@router.get("/{story_id}", response_model=StoryWithConfig)
def get_story(
    story_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get a specific story with its config."""
    story = story_service.get_story(session, user_id, story_id)
    result = StoryWithConfig.model_validate(story)
    if story.config:
        result.config = StoryConfigRead.model_validate(story.config)
    return result


@router.patch("/{story_id}", response_model=StoryRead)
def update_story(
    story_id: str,
    payload: StoryUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update a story."""
    story = story_service.update_story(session, user_id, story_id, payload)
    return StoryRead.model_validate(story)


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Delete a story."""
    story_service.delete_story(session, user_id, story_id)
    return None


# Story Config endpoints


@router.get("/{story_id}/config", response_model=StoryConfigRead)
def get_story_config(
    story_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get the configuration overrides for a story."""
    config = story_service.get_story_config(session, user_id, story_id)
    return StoryConfigRead.model_validate(config)


@router.patch("/{story_id}/config", response_model=StoryConfigRead)
def update_story_config(
    story_id: str,
    payload: StoryConfigUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update story configuration overrides."""
    config = story_service.update_story_config(session, user_id, story_id, payload)
    return StoryConfigRead.model_validate(config)


@router.delete("/{story_id}/config", response_model=StoryConfigRead)
def reset_story_config(
    story_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Reset all story configuration overrides."""
    config = story_service.reset_story_config(session, user_id, story_id)
    return StoryConfigRead.model_validate(config)


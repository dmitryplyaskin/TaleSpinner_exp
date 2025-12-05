"""
Story service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.story import Story, StoryConfig
from app.schemas.story import (
    StoryCreate,
    StoryUpdate,
    StoryConfigUpdate,
)


def create_story(session: Session, user_id: str, payload: StoryCreate) -> Story:
    """Create a new story with its config."""
    story = Story(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        preset_id=payload.preset_id,
    )
    session.add(story)
    session.flush()  # Get story ID

    # Create empty story config
    config = StoryConfig(story_id=story.id)
    session.add(config)

    session.commit()
    session.refresh(story)
    return story


def list_stories(
    session: Session, user_id: str, active_only: bool = False
) -> Iterable[Story]:
    """List all stories for a user."""
    query = select(Story).where(Story.user_id == user_id)
    if active_only:
        query = query.where(Story.is_active == True)
    return session.exec(query.order_by(Story.updated_at.desc())).all()


def get_story(session: Session, user_id: str, story_id: str) -> Story:
    """Get a specific story."""
    story = session.exec(
        select(Story)
        .where(Story.id == story_id)
        .where(Story.user_id == user_id)
    ).first()
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )
    return story


def update_story(
    session: Session, user_id: str, story_id: str, payload: StoryUpdate
) -> Story:
    """Update a story."""
    story = get_story(session, user_id, story_id)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(story, key, value)

    story.updated_at = datetime.utcnow()
    session.add(story)
    session.commit()
    session.refresh(story)
    return story


def delete_story(session: Session, user_id: str, story_id: str) -> None:
    """Delete a story and its config."""
    story = get_story(session, user_id, story_id)

    # Delete config first
    if story.config:
        session.delete(story.config)

    session.delete(story)
    session.commit()


def get_story_config(session: Session, user_id: str, story_id: str) -> StoryConfig:
    """Get the config for a story."""
    story = get_story(session, user_id, story_id)
    if not story.config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story config not found",
        )
    return story.config


def update_story_config(
    session: Session, user_id: str, story_id: str, payload: StoryConfigUpdate
) -> StoryConfig:
    """Update story config overrides."""
    config = get_story_config(session, user_id, story_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Convert override objects to dicts
    for key in [
        "main_model_override",
        "rag_model_override",
        "guard_model_override",
        "storytelling_model_override",
    ]:
        if key in update_data and update_data[key] is not None:
            update_data[key] = update_data[key].model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(config, key, value)

    config.updated_at = datetime.utcnow()
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


def reset_story_config(session: Session, user_id: str, story_id: str) -> StoryConfig:
    """Reset all story config overrides to None."""
    config = get_story_config(session, user_id, story_id)

    config.main_model_override = None
    config.rag_model_override = None
    config.guard_model_override = None
    config.storytelling_model_override = None
    config.embedding_override = None
    config.rag_enabled_override = None
    config.guard_enabled_override = None
    config.storytelling_enabled_override = None
    config.updated_at = datetime.utcnow()

    session.add(config)
    session.commit()
    session.refresh(config)
    return config

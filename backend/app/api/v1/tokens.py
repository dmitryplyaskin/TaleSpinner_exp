"""
Token API endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.token import TokenCreate, TokenRead, TokenUpdate
from app.services import tokens as token_service

router = APIRouter(prefix="/tokens", tags=["tokens"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    """Extract user ID from header."""
    return x_user_id


@router.get("/", response_model=List[TokenRead])
def list_tokens(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """List all API tokens for the current user."""
    tokens = token_service.list_tokens(session, user_id)
    return [TokenRead.model_validate(t) for t in tokens]


@router.post("/", response_model=TokenRead, status_code=status.HTTP_201_CREATED)
def create_token(
    payload: TokenCreate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Create a new API token."""
    token = token_service.create_token(session, user_id, payload)
    return TokenRead.model_validate(token)


@router.get("/{token_id}", response_model=TokenRead)
def get_token(
    token_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Get a specific token."""
    token = token_service.get_token(session, user_id, token_id)
    return TokenRead.model_validate(token)


@router.patch("/{token_id}", response_model=TokenRead)
def update_token(
    token_id: str,
    payload: TokenUpdate,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Update a token."""
    token = token_service.update_token(session, user_id, token_id, payload)
    return TokenRead.model_validate(token)


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_token(
    token_id: str,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_user_id),
):
    """Delete a token."""
    token_service.delete_token(session, user_id, token_id)
    return None


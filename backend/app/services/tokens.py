"""
Token service for CRUD operations.
"""

from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.crypto import decrypt_token, encrypt_token
from app.models.token import Token
from app.schemas.token import TokenCreate, TokenUpdate


def create_token(session: Session, user_id: str, payload: TokenCreate) -> Token:
    """Create a new API token."""
    token = Token(
        user_id=user_id,
        provider=payload.provider,
        name=payload.name,
        encrypted_token=encrypt_token(payload.token),
    )
    session.add(token)
    session.commit()
    session.refresh(token)
    return token


def list_tokens(session: Session, user_id: str) -> Iterable[Token]:
    """List all tokens for a user."""
    return session.exec(
        select(Token)
        .where(Token.user_id == user_id)
        .order_by(Token.created_at)
    ).all()


def get_token(session: Session, user_id: str, token_id: str) -> Token:
    """Get a specific token."""
    token = session.exec(
        select(Token)
        .where(Token.id == token_id)
        .where(Token.user_id == user_id)
    ).first()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )
    return token


def update_token(
    session: Session, user_id: str, token_id: str, payload: TokenUpdate
) -> Token:
    """Update a token."""
    token = get_token(session, user_id, token_id)

    if payload.name is not None:
        token.name = payload.name
    if payload.token is not None:
        token.encrypted_token = encrypt_token(payload.token)
    if payload.is_active is not None:
        token.is_active = payload.is_active

    token.updated_at = datetime.utcnow()
    session.add(token)
    session.commit()
    session.refresh(token)
    return token


def delete_token(session: Session, user_id: str, token_id: str) -> None:
    """Delete a token."""
    token = get_token(session, user_id, token_id)
    session.delete(token)
    session.commit()


def get_decrypted_token(session: Session, user_id: str, token_id: str) -> str:
    """Get the decrypted value of a token (for internal use)."""
    token = get_token(session, user_id, token_id)
    if not token.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is inactive",
        )
    return decrypt_token(token.encrypted_token)

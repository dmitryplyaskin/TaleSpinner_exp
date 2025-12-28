from typing import Iterable, Optional

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdatePassword
from app.services import presets


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_unique_name(session: Session, name: str) -> None:
    existing = session.exec(select(User).where(User.name == name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this name already exists",
        )


def create_user(session: Session, payload: UserCreate) -> User:
    verify_unique_name(session, payload.name)

    password_hash: Optional[str] = None
    if payload.password:
        password_hash = hash_password(payload.password)

    user = User(name=payload.name, password_hash=password_hash)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Initialize default presets for the new user
    presets.create_default_preset_structure(session, user.id)

    return user


def list_users(session: Session) -> Iterable[User]:
    return session.exec(select(User).order_by(User.created_at)).all()


def get_user(session: Session, user_id: str) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def update_password(session: Session, user_id: str, payload: UserUpdatePassword) -> User:
    user = get_user(session, user_id)
    if payload.password:
        user.password_hash = hash_password(payload.password)
    else:
        user.password_hash = None
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(session: Session, user_id: str) -> None:
    user = get_user(session, user_id)
    session.delete(user)
    session.commit()


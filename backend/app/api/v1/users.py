from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.schemas.user import UserCreate, UserDetail, UserRead, UserUpdatePassword
from app.services import users as user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session)):
    users = user_service.list_users(session)
    return [UserRead.model_validate(user) for user in users]


@router.post("/", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, session: Session = Depends(get_session)):
    user = user_service.create_user(session, payload)
    return UserDetail.model_validate(user)


@router.get("/{user_id}", response_model=UserDetail)
def get_user(user_id: str, session: Session = Depends(get_session)):
    user = user_service.get_user(session, user_id)
    return UserDetail.model_validate(user)


@router.patch("/{user_id}/password", response_model=UserDetail)
def update_password(user_id: str, payload: UserUpdatePassword, session: Session = Depends(get_session)):
    user = user_service.update_password(session, user_id, payload)
    return UserDetail.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, session: Session = Depends(get_session)):
    user_service.delete_user(session, user_id)
    return None


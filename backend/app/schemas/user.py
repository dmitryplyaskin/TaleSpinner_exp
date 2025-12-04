from typing import Optional

from pydantic import computed_field
from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    name: str = Field(min_length=1, max_length=128)


class UserCreate(UserBase):
    password: Optional[str] = Field(default=None, min_length=1, max_length=128)


class UserUpdatePassword(SQLModel):
    password: Optional[str] = Field(default=None, min_length=0, max_length=128)


class UserRead(UserBase):
    id: str
    password_hash: Optional[str] = Field(default=None, exclude=True)

    @computed_field(return_type=bool)
    @property
    def has_password(self) -> bool:
        return bool(self.password_hash)

    model_config = {
        "from_attributes": True,
        "extra": "ignore",
    }


class UserDetail(UserRead):
    pass


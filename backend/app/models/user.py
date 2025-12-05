from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.config_preset import ConfigPreset
    from app.models.embedding_config import EmbeddingConfig
    from app.models.model_config import ModelConfig
    from app.models.story import Story
    from app.models.token import Token


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        index=True,
        nullable=False,
    )
    name: str = Field(index=True, unique=True, nullable=False, max_length=128)
    password_hash: Optional[str] = Field(
        default=None, nullable=True, max_length=256, repr=False
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    tokens: list["Token"] = Relationship(back_populates="user")
    model_configs: list["ModelConfig"] = Relationship(back_populates="user")
    embedding_configs: list["EmbeddingConfig"] = Relationship(back_populates="user")
    config_presets: list["ConfigPreset"] = Relationship(back_populates="user")
    stories: list["Story"] = Relationship(back_populates="user")


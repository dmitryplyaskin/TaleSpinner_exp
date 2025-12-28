from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from sqlmodel import Field, SQLModel


RunStateType = Literal["running", "completed", "cancelled"]


class RunCreateResponse(SQLModel):
    run_id: str


class RunStatus(SQLModel):
    run_id: str
    state: RunStateType = "running"
    created_at: datetime
    updated_at: datetime


class RunEvent(SQLModel):
    """
    Event envelope that is sent over SSE.
    The `type` is mirrored in the SSE `event:` field.
    """

    run_id: str
    seq: int = Field(ge=1)
    type: str = Field(min_length=1, max_length=64)
    ts: datetime
    payload: Any



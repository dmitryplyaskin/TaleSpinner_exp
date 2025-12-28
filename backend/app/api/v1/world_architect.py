from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.schemas.run import RunCreateResponse, RunStatus
from app.schemas.world_architect import WorldArchitectAnswersRequest, WorldArchitectStartRequest
from app.services import runs as runs_service
from app.services import world_architect as world_architect_service


router = APIRouter(prefix="/world-architect", tags=["world-architect"])


def get_user_id(x_user_id: str = Header(..., description="Current user ID")) -> str:
    # We don't persist anything yet, but we keep the API consistent with the rest of v1.
    return x_user_id


@router.post("/runs", response_model=RunCreateResponse, status_code=status.HTTP_201_CREATED)
async def start_world_architect_run(
    payload: WorldArchitectStartRequest,
    _user_id: str = Depends(get_user_id),
) -> RunCreateResponse:
    run_id = await runs_service.create_run()
    asyncio.create_task(world_architect_service.run_world_architect(run_id, payload))
    return RunCreateResponse(run_id=run_id)


@router.post("/runs/{run_id}/answers", response_model=RunStatus)
async def submit_world_architect_answers(
    run_id: str,
    payload: WorldArchitectAnswersRequest,
    _user_id: str = Depends(get_user_id),
) -> RunStatus:
    st = await runs_service.get_run_status(run_id)
    if not st:
        raise HTTPException(status_code=404, detail="Run not found")
    ok = await runs_service.submit_workflow_payload(run_id, "world_architect_answers", payload.answers)
    if not ok:
        raise HTTPException(status_code=404, detail="Run not found")
    return st



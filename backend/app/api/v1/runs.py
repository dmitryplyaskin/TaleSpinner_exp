"""
Run / SSE endpoints (foundation for long-running agent workflows).

Not used by the app yet; intended for future integration.
"""

from fastapi import APIRouter, HTTPException, Request, status
from starlette.responses import StreamingResponse

from app.schemas.run import RunCreateResponse, RunStatus
from app.services import runs as runs_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("/", response_model=RunCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_run() -> RunCreateResponse:
    run_id = await runs_service.create_run()
    return RunCreateResponse(run_id=run_id)


@router.get("/{run_id}", response_model=RunStatus)
async def get_run(run_id: str) -> RunStatus:
    st = await runs_service.get_run_status(run_id)
    if not st:
        raise HTTPException(status_code=404, detail="Run not found")
    return st


@router.post("/{run_id}/cancel", response_model=RunStatus)
async def cancel_run(run_id: str) -> RunStatus:
    st = await runs_service.cancel_run(run_id)
    if not st:
        raise HTTPException(status_code=404, detail="Run not found")
    return st


@router.get("/{run_id}/events")
async def run_events(run_id: str, request: Request):
    """
    Server-Sent Events stream.

    Client connects here and listens to event types:
    - hello
    - run_created
    - run_cancelled
    - (future) stage, question, done, error, etc.
    """

    async def gen():
        async for msg in runs_service.subscribe(run_id):
            if await request.is_disconnected():
                break
            yield msg

    return StreamingResponse(gen(), media_type="text/event-stream")



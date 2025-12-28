from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from app.schemas.run import RunEvent, RunStatus


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _format_sse(*, event: str, data: str, event_id: int | None = None) -> str:
    """
    Minimal SSE framing.
    See: https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
    """
    parts: list[str] = []
    if event_id is not None:
        parts.append(f"id: {event_id}")
    parts.append(f"event: {event}")

    # SSE supports multi-line data; we split to be safe.
    for line in data.splitlines() or [""]:
        parts.append(f"data: {line}")
    parts.append("")  # blank line terminates event
    return "\n".join(parts) + "\n"


@dataclass
class _RunState:
    status: RunStatus
    cancelled: bool = False
    seq: int = 0
    subscribers: set[asyncio.Queue[str]] = field(default_factory=set)
    workflow_payloads: dict[str, object] = field(default_factory=dict)
    workflow_events: dict[str, asyncio.Event] = field(default_factory=dict)


_runs: dict[str, _RunState] = {}
_lock = asyncio.Lock()


async def create_run() -> str:
    run_id = uuid.uuid4().hex
    now = _utc_now()
    state = _RunState(
        status=RunStatus(run_id=run_id, state="running", created_at=now, updated_at=now)
    )
    async with _lock:
        _runs[run_id] = state
    await publish(run_id, "run_created", {"run_id": run_id})
    return run_id


async def get_run_status(run_id: str) -> RunStatus | None:
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return None
        return state.status


async def cancel_run(run_id: str) -> RunStatus | None:
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return None
        state.cancelled = True
        state.status.state = "cancelled"
        state.status.updated_at = _utc_now()
        # Unblock any workflows waiting for input
        for ev in state.workflow_events.values():
            ev.set()

    await publish(run_id, "run_cancelled", {"run_id": run_id})
    return await get_run_status(run_id)


async def publish(run_id: str, event_type: str, payload: Any) -> None:
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            # If someone publishes before create_run, auto-create a placeholder
            now = _utc_now()
            state = _RunState(
                status=RunStatus(
                    run_id=run_id, state="running", created_at=now, updated_at=now
                )
            )
            _runs[run_id] = state

        state.seq += 1
        state.status.updated_at = _utc_now()
        envelope = RunEvent(
            run_id=run_id,
            seq=state.seq,
            type=event_type,
            ts=state.status.updated_at,
            payload=payload,
        )
        message = _format_sse(
            event=event_type,
            event_id=envelope.seq,
            data=json.dumps(envelope.model_dump(mode="json"), ensure_ascii=False),
        )
        subscribers = list(state.subscribers)

    # Fan-out without holding the lock
    for q in subscribers:
        try:
            q.put_nowait(message)
        except asyncio.QueueFull:
            # Drop if client is too slow; future: backpressure / disconnect
            pass


async def subscribe(
    run_id: str,
    *,
    keepalive_seconds: int = 15,
) -> AsyncGenerator[str, None]:
    """
    Subscribe to SSE messages for a run_id.
    Yields already-framed SSE strings.
    """
    q: asyncio.Queue[str] = asyncio.Queue(maxsize=100)
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            now = _utc_now()
            state = _RunState(
                status=RunStatus(
                    run_id=run_id, state="running", created_at=now, updated_at=now
                )
            )
            _runs[run_id] = state
        state.subscribers.add(q)

    try:
        # Initial hello so the client sees immediate activity
        yield _format_sse(event="hello", data=json.dumps({"run_id": run_id}))

        while True:
            try:
                msg = await asyncio.wait_for(q.get(), timeout=keepalive_seconds)
                yield msg
            except TimeoutError:
                # Comment ping keeps the connection alive across some intermediaries
                yield ": ping\n\n"
    finally:
        async with _lock:
            state = _runs.get(run_id)
            if state:
                state.subscribers.discard(q)


async def is_cancelled(run_id: str) -> bool:
    async with _lock:
        state = _runs.get(run_id)
        return bool(state.cancelled) if state else False


async def submit_workflow_payload(run_id: str, key: str, payload: object) -> bool:
    """
    Store a workflow payload (e.g. HITL answers) and signal waiters.
    Returns False if run not found.
    """
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return False
        state.workflow_payloads[key] = payload
        ev = state.workflow_events.get(key)
        if not ev:
            ev = asyncio.Event()
            state.workflow_events[key] = ev
        ev.set()
        return True


async def wait_workflow_payload(
    run_id: str, key: str, *, timeout_seconds: float | None = None
) -> object | None:
    """
    Wait until a workflow payload for `key` is submitted.
    Returns the stored payload (and keeps it stored) or None on timeout / missing run.
    """
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return None
        ev = state.workflow_events.get(key)
        if not ev:
            ev = asyncio.Event()
            state.workflow_events[key] = ev

    try:
        if timeout_seconds is None:
            await ev.wait()
        else:
            await asyncio.wait_for(ev.wait(), timeout=timeout_seconds)
    except TimeoutError:
        return None

    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return None
        return state.workflow_payloads.get(key)


async def pop_workflow_payload(run_id: str, key: str) -> object | None:
    """
    Pop a stored workflow payload and reset its event.
    """
    async with _lock:
        state = _runs.get(run_id)
        if not state:
            return None
        payload = state.workflow_payloads.pop(key, None)
        ev = state.workflow_events.get(key)
        if ev:
            ev.clear()
        return payload



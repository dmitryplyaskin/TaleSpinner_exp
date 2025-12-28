from __future__ import annotations

import json
from typing import Any, cast

import httpx
from pydantic import TypeAdapter, ValidationError

from app.core.config import settings
from app.schemas.world_architect import (
    ArchitectDoneResponse,
    ArchitectLLMResponse,
    ArchitectQuestionsResponse,
    HitlAnswer,
    WorldArchitectStartRequest,
    WorldSkeleton,
)
from app.services import runs as runs_service


_ANSWERS_KEY = "world_architect_answers"
_ARCHITECT_RESPONSE_ADAPTER = TypeAdapter(ArchitectLLMResponse)


def _build_plot_text(req: WorldArchitectStartRequest) -> str:
    if req.plot_type != "custom":
        return req.plot_type
    return (req.plot_type_custom or "").strip()


def _json_schema_text() -> str:
    # We embed JSON Schema as a guardrail + we validate strictly on the backend anyway.
    return json.dumps(_ARCHITECT_RESPONSE_ADAPTER.json_schema(), ensure_ascii=False)


def _system_prompt() -> str:
    return (
        "Ты — агент-архитектор мира. Ты создаёшь общий каркас вселенной для текстового игрового движка.\n\n"
        "Ключевая идея:\n"
        "- game_prompt = WORLD_CORE: краткое предисловие/синопсис СЕТТИНГА.\n"
        "  Это НЕ инструкция, не обращение ко «второму лицу» и не роль ведущего.\n"
        "  В WORLD_CORE НЕ должно быть сюжета, конкретных сцен, миссий, персонажей или событий.\n"
        "  Только общая картина мира: эпоха, технологии/магия, устройство общества, ключевые реалии.\n"
        "- world_bible = CORE_LORE: длинный, плотный, подробный лор мира.\n"
        "  Это опорный текст, на базе которого будут генерироваться фракции, локации, детали и т.д.\n"
        "  CORE_LORE должен быть существенно длиннее WORLD_CORE и покрывать мир «широкими мазками».\n"
        "- global_conflict (опционально): макро-конфликт уровня мира (не квест/не конкретная сцена).\n\n"
        "Жёсткие правила:\n"
        "- Верни ТОЛЬКО валидный JSON. Никакого Markdown, комментариев или текста вокруг.\n"
        "- JSON должен строго соответствовать SCHEMA (см. ниже).\n"
        "- Фокус на общем, а не частном: не создавать персонажей, имена НПС, сюжетные арки, конкретные события.\n"
        "- Можно упоминать «типы сил/групп» и «примеры локаций» без частных деталей и без имён персонажей.\n"
        "- plot_type влияет только на акценты/темы/тип конфликтов и темп игры, но не превращается в сюжет.\n"
        "- Вопросы задавай только если без них НЕЛЬЗЯ сделать качественный WORLD_CORE + CORE_LORE.\n"
        "- Максимум 4 вопроса.\n"
        "- Не спрашивай то, что уже дано пользователем: plot_type и нужен ли глобальный конфликт.\n"
        "- Если is_global_conflict_enabled=false: global_conflict должен быть null/отсутствовать.\n"
        "- Пиши нейтрально (3-е лицо), без «ты/вы/ведите игрока/реагируй».\n"
    )


def _user_prompt_initial(req: WorldArchitectStartRequest) -> str:
    plot_text = _build_plot_text(req)
    return (
        "INPUT:\n"
        f"- world_description: {req.world_description.strip()}\n"
        f"- plot_type: {req.plot_type}\n"
        f"- plot_type_custom: {(req.plot_type_custom or '').strip()}\n"
        f"- plot_text: {plot_text}\n"
        f"- is_global_conflict_enabled: {req.is_global_conflict_enabled}\n\n"
        "Задача:\n"
        "1) Если вход уже достаточно качественный — сразу верни mode=done со скелетом.\n"
        "2) Если не хватает критически важных данных — верни mode=questions и задай вопросы.\n\n"
        "Критерии качества для mode=done:\n"
        "- WORLD_CORE (game_prompt) должен читаться как краткое предисловие к миру.\n"
        "- CORE_LORE (world_bible) должен быть длинным и структурированным (можно списками/разделами).\n"
        "- Никаких инструкций, 2-го лица, «ты ведущий», «реагируй», «описывай», и т.п.\n"
        "- Никаких конкретных сюжетных сцен/миссий/персонажей. Только устройство мира.\n\n"
        "Рекомендуемая структура CORE_LORE (не обязательно заголовками, но содержательно):\n"
        "- Обзор мира и масштаб (планета/континенты/мегаполисы/мультивселенная)\n"
        "- Технологии/магия/наука (что возможно, что запрещено/опасно)\n"
        "- Социальное устройство, экономика, власть (какие силы доминируют)\n"
        "- Культура/повседневность (как живут обычные люди)\n"
        "- География/типы локаций (уровни/регионы/биомы) — без конкретных сюжетных точек\n"
        "- Типы угроз и конфликтов (локальные, системные)\n"
        "- Точки входа для игры (какие «роли» обычно возможны) без имен персонажей\n\n"
        "SCHEMA:\n"
        f"{_json_schema_text()}\n"
    )


def _user_prompt_final(
    req: WorldArchitectStartRequest, answers: dict[str, HitlAnswer]
) -> str:
    plot_text = _build_plot_text(req)
    answers_json = json.dumps(
        {
            qid: {
                "selected_option_id": a.selected_option_id,
                "free_text": a.free_text,
            }
            for qid, a in answers.items()
        },
        ensure_ascii=False,
    )
    return (
        "INPUT:\n"
        f"- world_description: {req.world_description.strip()}\n"
        f"- plot_type: {req.plot_type}\n"
        f"- plot_type_custom: {(req.plot_type_custom or '').strip()}\n"
        f"- plot_text: {plot_text}\n"
        f"- is_global_conflict_enabled: {req.is_global_conflict_enabled}\n"
        f"- user_answers: {answers_json}\n\n"
        "Теперь ОБЯЗАТЕЛЬНО верни mode=done и заполни skeleton.\n"
        "Те же правила: никакого 2-го лица и инструкций; никакого сюжета/персонажей/сцен.\n"
        "WORLD_CORE = краткое предисловие; CORE_LORE = длинный базовый лор.\n\n"
        "SCHEMA:\n"
        f"{_json_schema_text()}\n"
    )


def _extract_json(text: str) -> str:
    s = text.strip()
    if s.startswith("{") and s.endswith("}"):
        return s
    # Best-effort: cut first JSON object.
    start = s.find("{")
    end = s.rfind("}")
    if start >= 0 and end > start:
        return s[start : end + 1]
    return s


async def _call_openrouter_chat(*, system: str, user: str) -> str:
    model = settings.openrouter_main_model
    if not model:
        raise RuntimeError("OPENROUTER model is not configured in env")

    headers: dict[str, str] = {"Content-Type": "application/json"}
    token = settings.OPENROUTER_API_KEY.strip() or None
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    try:
        return str(data["choices"][0]["message"]["content"])
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Unexpected OpenRouter response format: {e}") from e


async def _parse_and_validate_llm_json(
    raw_text: str, *, attempt_repair: int = 2
) -> ArchitectLLMResponse:
    last_error: str | None = None
    text = raw_text

    for _ in range(attempt_repair + 1):
        candidate = _extract_json(text)
        try:
            payload = json.loads(candidate)
        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}"
            text = await _call_openrouter_chat(
                system=(
                    "Ты исправляешь JSON. Верни ТОЛЬКО валидный JSON по SCHEMA, без текста."
                ),
                user=f"Invalid JSON:\n{candidate}\n\nError:\n{last_error}\n\nSCHEMA:\n{_json_schema_text()}",
            )
            continue

        try:
            return _ARCHITECT_RESPONSE_ADAPTER.validate_python(payload)
        except ValidationError as e:
            last_error = f"Schema validation error: {e.errors()[:3]}"
            text = await _call_openrouter_chat(
                system=(
                    "Ты исправляешь JSON, чтобы он строго соответствовал SCHEMA. "
                    "Верни ТОЛЬКО JSON, без текста."
                ),
                user=f"Invalid JSON:\n{json.dumps(payload, ensure_ascii=False)}\n\nError:\n{last_error}\n\nSCHEMA:\n{_json_schema_text()}",
            )

    raise RuntimeError(last_error or "Failed to parse/validate LLM JSON")


async def _publish_stage(run_id: str, stage: str) -> None:
    await runs_service.publish(run_id, "stage", {"stage": stage})


async def run_world_architect(run_id: str, req: WorldArchitectStartRequest) -> None:
    """
    Main workflow:
    - Analyze input -> either ask questions or finish skeleton.
    - If asked -> wait for answers -> finalize skeleton.
    Publishes progress through SSE run events.
    """
    try:
        await _publish_stage(run_id, "analyzing")

        raw = await _call_openrouter_chat(system=_system_prompt(), user=_user_prompt_initial(req))
        result = await _parse_and_validate_llm_json(raw)

        # Round 1
        if isinstance(result, ArchitectQuestionsResponse):
            await _publish_stage(run_id, "asking")
            await runs_service.publish(
                run_id,
                "hitl_questions",
                {"questions": [q.model_dump(mode="json") for q in result.questions]},
            )

            # Wait for answers
            await _publish_stage(run_id, "waiting_for_answers")
            _ = await runs_service.wait_workflow_payload(run_id, _ANSWERS_KEY)
            if await runs_service.is_cancelled(run_id):
                return
            payload = await runs_service.pop_workflow_payload(run_id, _ANSWERS_KEY)
            answers = (
                cast(dict[str, Any], payload) if isinstance(payload, dict) else {}
            )
            parsed_answers: dict[str, HitlAnswer] = {
                qid: HitlAnswer.model_validate(a) for qid, a in answers.items()
            }

            await _publish_stage(run_id, "building")
            raw2 = await _call_openrouter_chat(
                system=_system_prompt(), user=_user_prompt_final(req, parsed_answers)
            )
            final_result = await _parse_and_validate_llm_json(raw2)
            if not isinstance(final_result, ArchitectDoneResponse):
                raise RuntimeError("LLM returned questions again during finalize")
            skeleton = final_result.skeleton
        else:
            skeleton = result.skeleton

        # Enforce global conflict toggle
        if not req.is_global_conflict_enabled:
            skeleton = WorldSkeleton(
                game_prompt=skeleton.game_prompt,
                world_bible=skeleton.world_bible,
                global_conflict=None,
            )
        elif req.is_global_conflict_enabled and skeleton.global_conflict:
            skeleton = skeleton
        else:
            # allowed to be None even when enabled; agent can omit if not needed
            skeleton = skeleton

        await _publish_stage(run_id, "finalizing")
        await runs_service.publish(run_id, "world_skeleton", skeleton.model_dump(mode="json"))
        await runs_service.publish(run_id, "done", {"ok": True})
    except Exception as e:  # noqa: BLE001
        await runs_service.publish(run_id, "error", {"message": str(e)})


from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, AliasChoices


PlotTypeId = Literal[
    "adventure",
    "mystery",
    "exploration",
    "survival",
    "political_intrigue",
    "heist",
    "horror",
    "slice_of_life",
    "romance",
    "war_campaign",
    "comedy",
    "custom",
]


class WorldArchitectStartRequest(BaseModel):
    """
    Input captured from Create World step 1.
    """

    model_config = ConfigDict(extra="forbid")

    world_description: str = Field(
        validation_alias=AliasChoices("world_description", "worldDescription"),
        min_length=1,
        max_length=8000,
    )
    plot_type: PlotTypeId = Field(
        validation_alias=AliasChoices("plot_type", "plotType"),
    )
    plot_type_custom: str | None = Field(
        default=None,
        validation_alias=AliasChoices("plot_type_custom", "plotTypeCustom"),
        max_length=500,
    )
    is_global_conflict_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices(
            "is_global_conflict_enabled", "isGlobalConflictEnabled"
        ),
    )


class HitlOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=1, max_length=120)


class HitlQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=1, max_length=400)
    options: list[HitlOption] = Field(default_factory=list, max_length=12)


class HitlAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selected_option_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("selected_option_id", "selectedOptionId"),
        max_length=64,
    )
    free_text: str | None = Field(
        default=None,
        validation_alias=AliasChoices("free_text", "freeText"),
        max_length=2000,
    )


class WorldArchitectAnswersRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: dict[str, HitlAnswer] = Field(default_factory=dict)


class WorldSkeleton(BaseModel):
    """
    Final skeleton returned by the architect agent.
    """

    model_config = ConfigDict(extra="forbid")

    # World core: concise preface / synopsis of the setting (NOT instructions).
    game_prompt: str = Field(min_length=200, max_length=4000)
    # Core lore: long, detailed world text used as a base for further generations.
    world_bible: str = Field(min_length=2000, max_length=20000)
    global_conflict: str | None = Field(default=None, max_length=6000)


class ArchitectQuestionsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["questions"]
    questions: list[HitlQuestion] = Field(min_length=1, max_length=4)


class ArchitectDoneResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["done"]
    skeleton: WorldSkeleton


ArchitectLLMResponse = Annotated[
    ArchitectQuestionsResponse | ArchitectDoneResponse,
    Field(discriminator="mode"),
]



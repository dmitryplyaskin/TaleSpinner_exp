import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
} from "effector";
import type {
  HitlAnswer,
  HitlPhase,
  HitlRound,
  PlotTypeId,
  WorldDraft,
} from "./types";

const TOTAL_STEPS = 6;
const HITL_THINKING_DELAY_MS = 1200;

const hitlScript: HitlRound[] = [
  {
    id: "round_1",
    thinkingTitle: "Агент думает…",
    thinkingDescription:
      "Собираю основу мира из вашего описания и подбираю уточняющие вопросы.",
    questions: [
      {
        id: "genre",
        question: "Какой жанр или настроение вам ближе?",
        options: [
          { id: "epic_fantasy", label: "Эпическое фэнтези" },
          { id: "dark", label: "Мрачное / дарк" },
          { id: "light", label: "Лёгкое / приключение" },
        ],
      },
      {
        id: "magic_tech",
        question: "Какая роль магии или технологий в мире?",
        options: [
          { id: "rare", label: "Редкая и опасная" },
          { id: "common", label: "Обычная часть жизни" },
          { id: "none", label: "Почти отсутствует" },
        ],
      },
    ],
  },
  {
    id: "round_2",
    thinkingTitle: "Агент уточняет детали…",
    thinkingDescription:
      "Строю конфликты и силы мира. Нужны ваши ответы, чтобы сделать основу точнее.",
    questions: [
      {
        id: "main_conflict",
        question: "Что является главным конфликтом мира?",
        options: [
          { id: "war", label: "Война/экспансия" },
          { id: "intrigue", label: "Интриги/политика" },
          { id: "cataclysm", label: "Катастрофа/угроза" },
        ],
      },
      {
        id: "protagonists",
        question: "За кого мы обычно играем?",
        options: [
          { id: "heroes", label: "Герои/избранные" },
          { id: "survivors", label: "Выжившие/аутсайдеры" },
          { id: "agents", label: "Агенты/наёмники" },
        ],
      },
    ],
  },
];

// Events
export const openCreateWorldForm = createEvent();
export const closeCreateWorldForm = createEvent();
export const nextStep = createEvent();
export const prevStep = createEvent();
export const setWorldDescription = createEvent<string>();
export const setPlotType = createEvent<PlotTypeId>();
export const setPlotTypeCustom = createEvent<string>();
export const setGlobalConflictEnabled = createEvent<boolean>();

export const hitlContinueClicked = createEvent();
export const hitlOptionSelected = createEvent<{
  questionId: string;
  optionId: string;
}>();
export const hitlFreeTextChanged = createEvent<{
  questionId: string;
  text: string;
}>();
export const setWorldDraftField = createEvent<{
  field: keyof WorldDraft;
  value: string;
}>();

// Stores
export const $isFormOpen = createStore(false)
  .on(openCreateWorldForm, () => true)
  .on(closeCreateWorldForm, () => false);

export const $currentStep = createStore(0)
  .on(nextStep, (step) => Math.min(TOTAL_STEPS - 1, step + 1))
  .on(prevStep, (step) => Math.max(0, step - 1))
  .reset(closeCreateWorldForm);

export const $worldDescription = createStore("")
  .on(setWorldDescription, (_, description) => description)
  .reset(closeCreateWorldForm);

export const $plotType = createStore<PlotTypeId | null>(null)
  .on(setPlotType, (_, plotType) => plotType)
  .reset(closeCreateWorldForm);

export const $plotTypeCustom = createStore("")
  .on(setPlotTypeCustom, (_, text) => text)
  .reset(closeCreateWorldForm);

export const $isGlobalConflictEnabled = createStore(true)
  .on(setGlobalConflictEnabled, (_, enabled) => enabled)
  .reset(closeCreateWorldForm);

export const $foundationCanContinue = combine(
  $worldDescription,
  $plotType,
  $plotTypeCustom,
  (description, plotType, customText) => {
    if (!description.trim()) return false;
    if (!plotType) return false;
    if (plotType === "custom" && !customText.trim()) return false;
    return true;
  }
);

// --- HITL (mock) ---

const startHitl = createEvent();
const hitlStartThinking = createEvent();
const hitlShowQuestions = createEvent();
const hitlDone = createEvent();
const hitlAnswersSubmitted = createEvent();
const hitlAdvanceRound = createEvent();
const hitlRoundSubmitted = createEvent<number>();

const waitFx = createEffect<number, void>(
  async (ms) => await new Promise((resolve) => setTimeout(resolve, ms))
);

export const $hitlPhase = createStore<HitlPhase>("thinking")
  .on(startHitl, () => "thinking")
  .on(hitlStartThinking, () => "thinking")
  .on(hitlShowQuestions, () => "questions")
  .on(hitlDone, () => "done")
  .reset(closeCreateWorldForm);

export const $hitlRoundIndex = createStore(0)
  .on(startHitl, () => 0)
  .on(hitlAdvanceRound, (idx) => idx + 1)
  .reset(closeCreateWorldForm);

export const $hitlAnswers = createStore<Record<string, HitlAnswer>>({})
  .on(hitlOptionSelected, (state, { questionId, optionId }) => ({
    ...state,
    [questionId]: { ...(state[questionId] ?? {}), selectedOptionId: optionId },
  }))
  .on(hitlFreeTextChanged, (state, { questionId, text }) => ({
    ...state,
    [questionId]: { ...(state[questionId] ?? {}), freeText: text },
  }))
  .reset([closeCreateWorldForm, startHitl]);

export const $hitlCurrentRound = combine($hitlRoundIndex, (idx) => {
  return hitlScript[idx] ?? null;
});

export const $hitlCanContinue = combine(
  $hitlPhase,
  $hitlCurrentRound,
  $hitlAnswers,
  (phase, round, answers) => {
    if (phase !== "questions") return false;
    if (!round) return false;

    return round.questions.every((q) => {
      const a = answers[q.id];
      const hasOption = !!a?.selectedOptionId;
      const hasText = !!a?.freeText?.trim();
      return hasOption || hasText;
    });
  }
);

// Entering step 2 starts HITL
sample({
  clock: $currentStep,
  filter: (step) => step === 1,
  target: startHitl,
});

// Start thinking -> delay -> show questions
sample({
  clock: startHitl,
  fn: () => HITL_THINKING_DELAY_MS,
  target: waitFx,
});

sample({
  clock: waitFx.done,
  target: hitlShowQuestions,
});

// Clicking continue on HITL:
// - if questions and all answered -> submit (switch to thinking)
// - if done -> go next step
sample({
  clock: hitlContinueClicked,
  source: { phase: $hitlPhase, canContinue: $hitlCanContinue },
  filter: ({ phase, canContinue }) => phase === "questions" && canContinue,
  target: hitlAnswersSubmitted,
});

sample({
  clock: hitlContinueClicked,
  source: $hitlPhase,
  filter: (phase) => phase === "done",
  target: nextStep,
});

// Submitting answers: either advance to next round (thinking) or finish HITL (done)
sample({
  clock: hitlAnswersSubmitted,
  source: $hitlRoundIndex,
  target: hitlRoundSubmitted,
});

sample({
  clock: hitlRoundSubmitted,
  filter: (idx) => idx < hitlScript.length - 1,
  target: [hitlAdvanceRound, hitlStartThinking],
});

sample({
  clock: hitlRoundSubmitted,
  filter: (idx) => idx >= hitlScript.length - 1,
  target: hitlDone,
});

sample({
  clock: hitlAdvanceRound,
  fn: () => HITL_THINKING_DELAY_MS,
  target: waitFx,
});

// When HITL completes, allow moving to step 3 via button (phase done)
// (navigation to step 3 is triggered from UI by hitlContinueClicked when phase==="done")

// --- World draft (step 3 stub) ---

const buildWorldDraft = createEvent();
const worldDraftBuilt = createEvent<WorldDraft>();

export const $worldDraft = createStore<WorldDraft>({
  overview: "",
  geography: "",
  societies: "",
  conflicts: "",
  tone: "",
})
  .on(worldDraftBuilt, (_, draft) => draft)
  .on(setWorldDraftField, (state, { field, value }) => ({
    ...state,
    [field]: value,
  }))
  .reset(closeCreateWorldForm);

const buildDraftFromAnswers = (
  description: string,
  plotType: PlotTypeId | null,
  plotTypeCustom: string,
  isGlobalConflictEnabled: boolean,
  answers: Record<string, HitlAnswer>
): WorldDraft => {
  const genre = answers.genre?.selectedOptionId ?? "";
  const magic = answers.magic_tech?.selectedOptionId ?? "";
  const conflict = answers.main_conflict?.selectedOptionId ?? "";
  const protagonists = answers.protagonists?.selectedOptionId ?? "";

  const plotText = (() => {
    if (!plotType) return "";
    if (plotType !== "custom") return plotType;
    return plotTypeCustom.trim();
  })();

  return {
    overview: [
      `Кратко: ${description.trim()}`.trim(),
      plotText ? `Тип игры/сюжета: ${plotText}` : null,
      `Глобальный конфликт: ${isGlobalConflictEnabled ? "нужен" : "не нужен"}`,
    ]
      .filter(Boolean)
      .join("\n"),
    geography:
      "География (заглушка): 2–3 ключевые локации, климат, транспорт/переходы.",
    societies: `Общества (заглушка): ключевые силы и группы. protagonists=${protagonists}`,
    conflicts: isGlobalConflictEnabled
      ? `Конфликты (заглушка): conflict=${conflict || "TBD"}`
      : "Конфликты (заглушка): без глобального конфликта — локальные проблемы, повседневные цели, эпизодические зацепки.",
    tone: `Тон (заглушка): genre=${genre}, magic=${magic}`,
  };
};

sample({
  clock: $currentStep,
  filter: (step) => step === 2,
  target: buildWorldDraft,
});

sample({
  clock: buildWorldDraft,
  source: {
    description: $worldDescription,
    plotType: $plotType,
    plotTypeCustom: $plotTypeCustom,
    isGlobalConflictEnabled: $isGlobalConflictEnabled,
    answers: $hitlAnswers,
  },
  fn: (src) =>
    buildDraftFromAnswers(
      src.description,
      src.plotType,
      src.plotTypeCustom,
      src.isGlobalConflictEnabled,
      src.answers
    ),
  target: worldDraftBuilt,
});

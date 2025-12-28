import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
} from "effector";
import { userModel } from "@/entities/user";
import { connectSse, type SseClient } from "@/shared/api/sse-client";
import type { SseEnvelope } from "@/shared/api/sse-types";
import type {
  HitlAnswer,
  HitlPhase,
  HitlQuestion,
  PlotTypeId,
  WorldDraft,
} from "./types";
import {
  startWorldArchitectRun,
  submitWorldArchitectAnswers,
} from "../api/world-architect-api";

const TOTAL_STEPS = 6;

// Events
export const openCreateWorldForm = createEvent();
export const closeCreateWorldForm = createEvent();
export const nextStep = createEvent();
export const prevStep = createEvent();
export const setStep = createEvent<number>();
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
  .on(setStep, (_, step) => Math.max(0, Math.min(TOTAL_STEPS - 1, step)))
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

// --- HITL (SSE run) ---

const hitlReset = createEvent();
const hitlStarted = createEvent<string>();
const hitlThinking = createEvent();
const hitlQuestionsReceived = createEvent<HitlQuestion[]>();
const hitlStageReceived = createEvent<string>();
const hitlErrorReceived = createEvent<string>();
const worldSkeletonReceived = createEvent<{
  game_prompt?: string;
  world_bible?: string;
  global_conflict?: string | null;
  gamePrompt?: string;
  worldBible?: string;
  globalConflict?: string;
}>();

export const $hitlPhase = createStore<HitlPhase>("thinking")
  .on(hitlStarted, () => "thinking")
  .on(hitlThinking, () => "thinking")
  .on(hitlQuestionsReceived, () => "questions")
  .on(worldSkeletonReceived, () => "done")
  .reset([closeCreateWorldForm, hitlReset]);

export const $hitlRunId = createStore<string | null>(null)
  .on(hitlStarted, (_, runId) => runId)
  .reset([closeCreateWorldForm, hitlReset]);

export const $hitlStage = createStore<string>("analyzing")
  .on(hitlStageReceived, (_, stage) => stage)
  .reset([closeCreateWorldForm, hitlReset]);

export const $hitlError = createStore<string | null>(null)
  .on(hitlErrorReceived, (_, msg) => msg)
  .reset([closeCreateWorldForm, hitlReset, hitlStarted]);

export const $hitlQuestions = createStore<HitlQuestion[]>([])
  .on(hitlQuestionsReceived, (_, qs) => qs)
  .reset([closeCreateWorldForm, hitlReset, worldSkeletonReceived]);

export const $hitlAnswers = createStore<Record<string, HitlAnswer>>({})
  .on(hitlOptionSelected, (state, { questionId, optionId }) => ({
    ...state,
    [questionId]: { ...(state[questionId] ?? {}), selectedOptionId: optionId },
  }))
  .on(hitlFreeTextChanged, (state, { questionId, text }) => ({
    ...state,
    [questionId]: { ...(state[questionId] ?? {}), freeText: text },
  }))
  .reset([closeCreateWorldForm, hitlReset, hitlQuestionsReceived]);

export const $hitlCanContinue = combine(
  $hitlPhase,
  $hitlQuestions,
  $hitlAnswers,
  (phase, questions, answers) => {
    if (phase !== "questions") return false;
    if (!questions.length) return false;

    return questions.every((q) => {
      const a = answers[q.id];
      const hasOption = !!a?.selectedOptionId;
      const hasText = !!a?.freeText?.trim();
      return hasOption || hasText;
    });
  }
);

const closeSseRequested = createEvent();
const sseConnected = createEvent<SseClient>();

const closeSseFx = createEffect<SseClient | null, void>((client) => {
  client?.close();
});

export const $hitlSseClient = createStore<SseClient | null>(null)
  .on(sseConnected, (_, client) => client)
  .reset([closeCreateWorldForm, hitlReset]);

sample({
  clock: closeSseRequested,
  source: $hitlSseClient,
  target: closeSseFx,
});

sample({
  clock: closeSseFx.done,
  target: hitlReset,
});

const startWorldArchitectRunFx = createEffect<
  {
    userId: string;
    worldDescription: string;
    plotType: PlotTypeId;
    plotTypeCustom: string;
    isGlobalConflictEnabled: boolean;
  },
  { run_id: string }
>(
  async ({
    userId,
    worldDescription,
    plotType,
    plotTypeCustom,
    isGlobalConflictEnabled,
  }) => {
    return startWorldArchitectRun(userId, {
      world_description: worldDescription,
      plot_type: plotType,
      plot_type_custom: plotType === "custom" ? plotTypeCustom : null,
      is_global_conflict_enabled: isGlobalConflictEnabled,
    });
  }
);

const connectSseFx = createEffect<string, SseClient>((runId) => {
  const client = connectSse({
    path: `/api/v1/runs/${runId}/events`,
    handlers: {
      stage: (env) => {
        const stage = (env.payload as { stage?: string })?.stage ?? "analyzing";
        hitlStageReceived(stage);
      },
      hitl_questions: (env) => {
        const qs = (env.payload as { questions?: HitlQuestion[] })?.questions ?? [];
        hitlQuestionsReceived(qs);
      },
      world_skeleton: (env) => {
        worldSkeletonReceived(env.payload as SseEnvelope["payload"]);
      },
      error: (env) => {
        const msg =
          (env.payload as { message?: string })?.message ?? "Unknown error";
        hitlErrorReceived(msg);
      },
      done: () => {
        // no-op (phase is derived from world_skeleton)
      },
    },
    onError: () => hitlErrorReceived("SSE connection error"),
  });
  return client;
});

sample({
  clock: connectSseFx.doneData,
  target: sseConnected,
});

// Entering step 2 starts a new run + SSE subscription
sample({
  clock: $currentStep,
  filter: (step) => step === 1,
  source: {
    userId: userModel.$selectedUserId,
    worldDescription: $worldDescription,
    plotType: $plotType,
    plotTypeCustom: $plotTypeCustom,
    isGlobalConflictEnabled: $isGlobalConflictEnabled,
  },
  filter: (src): src is {
    userId: string;
    worldDescription: string;
    plotType: PlotTypeId;
    plotTypeCustom: string;
    isGlobalConflictEnabled: boolean;
  } => Boolean(src.userId) && Boolean(src.plotType),
  target: startWorldArchitectRunFx,
});

sample({
  clock: $currentStep,
  filter: (step) => step === 1,
  source: userModel.$selectedUserId,
  filter: (userId) => !userId,
  fn: () => "Не выбран пользователь (X-User-Id).",
  target: hitlErrorReceived,
});

sample({
  clock: startWorldArchitectRunFx.doneData,
  fn: (res) => res.run_id,
  target: hitlStarted,
});

sample({
  clock: hitlStarted,
  target: connectSseFx,
});

// Close SSE when leaving step 2 or closing the form
sample({
  clock: $currentStep,
  filter: (step) => step !== 1,
  target: closeSseRequested,
});

sample({
  clock: closeCreateWorldForm,
  target: closeSseRequested,
});

const submitWorldArchitectAnswersFx = createEffect<
  { userId: string; runId: string; answers: Record<string, HitlAnswer> },
  void
>(async ({ userId, runId, answers }) => {
  const payloadAnswers: Record<
    string,
    { selected_option_id?: string; free_text?: string }
  > = {};

  for (const [qid, a] of Object.entries(answers)) {
    payloadAnswers[qid] = {
      selected_option_id: a.selectedOptionId,
      free_text: a.freeText,
    };
  }

  await submitWorldArchitectAnswers(userId, runId, { answers: payloadAnswers });
});

// Continue button submits answers when we are in questions phase
sample({
  clock: hitlContinueClicked,
  source: {
    phase: $hitlPhase,
    canContinue: $hitlCanContinue,
    userId: userModel.$selectedUserId,
    runId: $hitlRunId,
    answers: $hitlAnswers,
  },
  filter: (src): src is {
    phase: HitlPhase;
    canContinue: boolean;
    userId: string;
    runId: string;
    answers: Record<string, HitlAnswer>;
  } =>
    src.phase === "questions" &&
    src.canContinue &&
    Boolean(src.userId) &&
    Boolean(src.runId),
  fn: (src) => ({
    userId: src.userId,
    runId: src.runId,
    answers: src.answers,
  }),
  target: submitWorldArchitectAnswersFx,
});

// After submitting answers, go back to thinking state and wait for SSE updates
sample({
  clock: submitWorldArchitectAnswersFx.done,
  target: hitlThinking,
});

sample({
  clock: submitWorldArchitectAnswersFx.done,
  fn: () => "building",
  target: hitlStageReceived,
});

// Continue button in done state moves to step 3
sample({
  clock: hitlContinueClicked,
  source: $hitlPhase,
  filter: (phase) => phase === "done",
  target: nextStep,
});

// Auto-advance to step 3 as soon as the skeleton is ready (avoid redundant interim screen)
sample({
  clock: worldSkeletonReceived,
  source: $currentStep,
  filter: (step) => step === 1,
  target: nextStep,
});

// Prevent duplicate world_skeleton events from advancing steps again
sample({
  clock: worldSkeletonReceived,
  target: closeSseRequested,
});

// --- World draft (step 3) ---

export const $worldDraft = createStore<WorldDraft>({
  gamePrompt: "",
  worldBible: "",
  globalConflict: "",
})
  .on(worldSkeletonReceived, (_, payload) => ({
    gamePrompt: (payload.game_prompt ?? payload.gamePrompt ?? "").trim(),
    worldBible: (payload.world_bible ?? payload.worldBible ?? "").trim(),
    globalConflict:
      (payload.global_conflict ?? payload.globalConflict ?? "")?.toString().trim() ??
      "",
  }))
  .on(setWorldDraftField, (state, { field, value }) => ({
    ...state,
    [field]: value,
  }))
  .reset(closeCreateWorldForm);

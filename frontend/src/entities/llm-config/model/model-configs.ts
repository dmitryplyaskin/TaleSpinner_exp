import { createEffect, createEvent, createStore, sample } from "effector";
import type {
  ModelConfig,
  ModelConfigCreate,
  ModelConfigUpdate,
} from "../types";
import {
  fetchModelConfigs,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig,
} from "../api/llm-config-api";

// Events
export const loadModelConfigs = createEvent<string>(); // userId
export const addModelConfig = createEvent<{
  userId: string;
  data: ModelConfigCreate;
}>();
export const editModelConfig = createEvent<{
  userId: string;
  configId: string;
  data: ModelConfigUpdate;
}>();
export const removeModelConfig = createEvent<{
  userId: string;
  configId: string;
}>();
export const resetModelConfigs = createEvent();

// Effects
export const fetchModelConfigsFx = createEffect<string, ModelConfig[], Error>(
  fetchModelConfigs
);

export const createModelConfigFx = createEffect<
  { userId: string; data: ModelConfigCreate },
  ModelConfig,
  Error
>(({ userId, data }) => createModelConfig(userId, data));

export const updateModelConfigFx = createEffect<
  { userId: string; configId: string; data: ModelConfigUpdate },
  ModelConfig,
  Error
>(({ userId, configId, data }) => updateModelConfig(userId, configId, data));

export const deleteModelConfigFx = createEffect<
  { userId: string; configId: string },
  void,
  Error
>(({ userId, configId }) => deleteModelConfig(userId, configId));

// Stores
export const $modelConfigs = createStore<ModelConfig[]>([]);
export const $modelConfigsLoading = fetchModelConfigsFx.pending;
export const $modelConfigSaving = createModelConfigFx.pending;
export const $modelConfigDeleting = deleteModelConfigFx.pending;
export const $modelConfigsError = createStore<string | null>(null);

// Reducers
$modelConfigs
  .on(fetchModelConfigsFx.doneData, (_, configs) => configs)
  .on(createModelConfigFx.doneData, (state, config) => [...state, config])
  .on(updateModelConfigFx.doneData, (state, updatedConfig) =>
    state.map((c) => (c.id === updatedConfig.id ? updatedConfig : c))
  )
  .on(deleteModelConfigFx.done, (state, { params }) =>
    state.filter((c) => c.id !== params.configId)
  )
  .reset(resetModelConfigs);

$modelConfigsError
  .reset([
    fetchModelConfigsFx,
    createModelConfigFx,
    updateModelConfigFx,
    deleteModelConfigFx,
  ])
  .on(fetchModelConfigsFx.failData, (_, error) => error.message)
  .on(createModelConfigFx.failData, (_, error) => error.message)
  .on(updateModelConfigFx.failData, (_, error) => error.message)
  .on(deleteModelConfigFx.failData, (_, error) => error.message);

// Logic
sample({
  clock: loadModelConfigs,
  target: fetchModelConfigsFx,
});

sample({
  clock: addModelConfig,
  target: createModelConfigFx,
});

sample({
  clock: editModelConfig,
  target: updateModelConfigFx,
});

sample({
  clock: removeModelConfig,
  target: deleteModelConfigFx,
});


import { createEffect, createEvent, createStore, sample } from "effector";
import type {
  EmbeddingConfig,
  EmbeddingConfigCreate,
  EmbeddingConfigUpdate,
} from "../types";
import {
  fetchEmbeddingConfigs,
  createEmbeddingConfig,
  updateEmbeddingConfig,
  deleteEmbeddingConfig,
} from "../api/llm-config-api";

// Events
export const loadEmbeddingConfigs = createEvent<string>(); // userId
export const addEmbeddingConfig = createEvent<{
  userId: string;
  data: EmbeddingConfigCreate;
}>();
export const editEmbeddingConfig = createEvent<{
  userId: string;
  configId: string;
  data: EmbeddingConfigUpdate;
}>();
export const removeEmbeddingConfig = createEvent<{
  userId: string;
  configId: string;
}>();
export const resetEmbeddingConfigs = createEvent();

// Effects
export const fetchEmbeddingConfigsFx = createEffect<
  string,
  EmbeddingConfig[],
  Error
>(fetchEmbeddingConfigs);

export const createEmbeddingConfigFx = createEffect<
  { userId: string; data: EmbeddingConfigCreate },
  EmbeddingConfig,
  Error
>(({ userId, data }) => createEmbeddingConfig(userId, data));

export const updateEmbeddingConfigFx = createEffect<
  { userId: string; configId: string; data: EmbeddingConfigUpdate },
  EmbeddingConfig,
  Error
>(({ userId, configId, data }) =>
  updateEmbeddingConfig(userId, configId, data)
);

export const deleteEmbeddingConfigFx = createEffect<
  { userId: string; configId: string },
  void,
  Error
>(({ userId, configId }) => deleteEmbeddingConfig(userId, configId));

// Stores
export const $embeddingConfigs = createStore<EmbeddingConfig[]>([]);
export const $embeddingConfigsLoading = fetchEmbeddingConfigsFx.pending;
export const $embeddingConfigSaving = createEmbeddingConfigFx.pending;
export const $embeddingConfigDeleting = deleteEmbeddingConfigFx.pending;
export const $embeddingConfigsError = createStore<string | null>(null);

// Reducers
$embeddingConfigs
  .on(fetchEmbeddingConfigsFx.doneData, (_, configs) => configs)
  .on(createEmbeddingConfigFx.doneData, (state, config) => [...state, config])
  .on(updateEmbeddingConfigFx.doneData, (state, updatedConfig) =>
    state.map((c) => (c.id === updatedConfig.id ? updatedConfig : c))
  )
  .on(deleteEmbeddingConfigFx.done, (state, { params }) =>
    state.filter((c) => c.id !== params.configId)
  )
  .reset(resetEmbeddingConfigs);

$embeddingConfigsError
  .reset([
    fetchEmbeddingConfigsFx,
    createEmbeddingConfigFx,
    updateEmbeddingConfigFx,
    deleteEmbeddingConfigFx,
  ])
  .on(fetchEmbeddingConfigsFx.failData, (_, error) => error.message)
  .on(createEmbeddingConfigFx.failData, (_, error) => error.message)
  .on(updateEmbeddingConfigFx.failData, (_, error) => error.message)
  .on(deleteEmbeddingConfigFx.failData, (_, error) => error.message);

// Logic
sample({
  clock: loadEmbeddingConfigs,
  target: fetchEmbeddingConfigsFx,
});

sample({
  clock: addEmbeddingConfig,
  target: createEmbeddingConfigFx,
});

sample({
  clock: editEmbeddingConfig,
  target: updateEmbeddingConfigFx,
});

sample({
  clock: removeEmbeddingConfig,
  target: deleteEmbeddingConfigFx,
});

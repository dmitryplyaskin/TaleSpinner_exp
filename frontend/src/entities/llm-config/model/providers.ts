import { createEffect, createEvent, createStore, sample } from "effector";
import type {
  ProviderInfo,
  ProviderModelInfo,
  ProviderModelsResponse,
  ProviderType,
  ModelType,
} from "../types";
import {
  fetchProviders,
  fetchProviderModels,
  type FetchProviderModelsParams,
} from "../api/llm-config-api";

// Events
export const loadProviders = createEvent();
export const loadProviderModels = createEvent<{
  providerId: ProviderType;
  modelType?: ModelType;
  forceRefresh?: boolean;
  apiKey?: string;
}>();

// Effects
export const fetchProvidersFx = createEffect<void, ProviderInfo[], Error>(
  fetchProviders
);

export const fetchProviderModelsFx = createEffect<
  FetchProviderModelsParams,
  ProviderModelsResponse,
  Error
>(fetchProviderModels);

// Stores
export const $providers = createStore<ProviderInfo[]>([]);
export const $providersLoading = fetchProvidersFx.pending;
export const $providersError = createStore<string | null>(null);

// Cache for provider models: { providerId: { llm: models[], embedding: models[] } }
export const $providerModels = createStore<
  Record<ProviderType, Record<ModelType, ProviderModelInfo[]>>
>({
  openrouter: { llm: [], embedding: [] },
  ollama: { llm: [], embedding: [] },
});
export const $providerModelsLoading = fetchProviderModelsFx.pending;
export const $providerModelsError = createStore<string | null>(null);

// Derived stores
export const $llmProviders = $providers.map((providers) =>
  providers.filter((p) => p.supports_llm)
);

export const $embeddingProviders = $providers.map((providers) =>
  providers.filter((p) => p.supports_embedding)
);

// Reducers
$providers.on(fetchProvidersFx.doneData, (_, providers) => providers);

$providersError
  .reset(fetchProvidersFx)
  .on(fetchProvidersFx.failData, (_, error) => error.message);

$providerModels.on(fetchProviderModelsFx.doneData, (state, response) => {
  const { provider, models } = response;
  const llmModels = models.filter((m) => m.model_type === "llm");
  const embeddingModels = models.filter((m) => m.model_type === "embedding");

  return {
    ...state,
    [provider]: {
      llm: llmModels,
      embedding: embeddingModels,
    },
  };
});

$providerModelsError
  .reset(fetchProviderModelsFx)
  .on(fetchProviderModelsFx.failData, (_, error) => error.message);

// Logic
sample({
  clock: loadProviders,
  target: fetchProvidersFx,
});

sample({
  clock: loadProviderModels,
  fn: ({ providerId, modelType, forceRefresh, apiKey }) => ({
    providerId,
    modelType,
    forceRefresh,
    apiKey,
  }),
  target: fetchProviderModelsFx,
});

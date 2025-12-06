import { createEvent, createStore, sample, combine } from "effector";
import {
  providersModel,
  tokensModel,
  modelConfigsModel,
  embeddingConfigsModel,
  presetsModel,
} from "@/entities/llm-config";
import type {
  ModelConfig,
  ModelConfigUpdate,
  ModelConfigCreate,
  EmbeddingConfig,
  EmbeddingConfigUpdate,
  EmbeddingConfigCreate,
  ConfigPresetUpdate,
} from "@/entities/llm-config";
import { createConfigFormFactory } from "./form-factory";
import { userModel } from "@/entities/user";

// Events
export const openApiSettings = createEvent();
export const closeApiSettings = createEvent();
export const initApiSettings = createEvent<string>(); // userId
export const setActivePresetId = createEvent<string>();
export const updateActivePreset = createEvent<ConfigPresetUpdate>(); // Updates current preset fields (including config refs)

// Stores
export const $isOpen = createStore(false)
  .on(openApiSettings, () => true)
  .on(closeApiSettings, () => false);

export const $activePresetId = createStore<string | null>(null);

export const $activePreset = combine(
  presetsModel.$presets,
  $activePresetId,
  (presets, id) => presets.find((p) => p.id === id) || null
);

// --- Form Factories ---

// Main Model
export const mainModelForm = createConfigFormFactory<
  ModelConfig,
  ModelConfigUpdate,
  ModelConfigCreate
>({
  saveFx: async ({ configId, data }) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.updateModelConfigFx({ userId, configId, data });
  },
  createFx: async (data) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.createModelConfigFx({ userId, data });
  },
});

// RAG Model
export const ragModelForm = createConfigFormFactory<
  ModelConfig,
  ModelConfigUpdate,
  ModelConfigCreate
>({
  saveFx: async ({ configId, data }) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.updateModelConfigFx({ userId, configId, data });
  },
  createFx: async (data) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.createModelConfigFx({ userId, data });
  },
});

// Guard Model
export const guardModelForm = createConfigFormFactory<
  ModelConfig,
  ModelConfigUpdate,
  ModelConfigCreate
>({
  saveFx: async ({ configId, data }) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.updateModelConfigFx({ userId, configId, data });
  },
  createFx: async (data) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.createModelConfigFx({ userId, data });
  },
});

// Storytelling Model
export const storytellingModelForm = createConfigFormFactory<
  ModelConfig,
  ModelConfigUpdate,
  ModelConfigCreate
>({
  saveFx: async ({ configId, data }) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.updateModelConfigFx({ userId, configId, data });
  },
  createFx: async (data) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return modelConfigsModel.createModelConfigFx({ userId, data });
  },
});

// Embedding Model
export const embeddingForm = createConfigFormFactory<
  EmbeddingConfig,
  EmbeddingConfigUpdate,
  EmbeddingConfigCreate
>({
  saveFx: async ({ configId, data }) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return embeddingConfigsModel.updateEmbeddingConfigFx({
      userId,
      configId,
      data,
    });
  },
  createFx: async (data) => {
    const userId = userModel.$currentUser.getState()?.id;
    if (!userId) throw new Error("User not found");
    return embeddingConfigsModel.createEmbeddingConfigFx({ userId, data });
  },
});

// --- Logic ---

// Load all data when initializing
sample({
  clock: initApiSettings,
  target: [
    providersModel.loadProviders,
    tokensModel.loadTokens,
    modelConfigsModel.loadModelConfigs,
    embeddingConfigsModel.loadEmbeddingConfigs,
    presetsModel.loadPresets,
  ],
});

// Set default preset when loaded if none selected
sample({
  clock: presetsModel.$presets,
  source: $activePresetId,
  filter: (activeId, presets) => !activeId && presets.length > 0,
  fn: (_, presets) => {
    const def = presets.find((p) => p.is_default);
    return def ? def.id : presets[0].id;
  },
  target: setActivePresetId,
});

$activePresetId.on(setActivePresetId, (_, id) => id);

// Handle Preset Updates (e.g. switching config ID)
sample({
  clock: updateActivePreset,
  source: { userId: userModel.$currentUser, presetId: $activePresetId },
  filter: ({ userId, presetId }) => !!userId && !!presetId,
  fn: ({ userId, presetId }, data) => ({
    userId: userId!.id,
    presetId: presetId!,
    data,
  }),
  target: presetsModel.updatePresetFx, // This will update server and reload presets list
});

// Helper to find config by ID
const findConfig = <T extends { id: string }>(
  configs: T[],
  id: string | null
) => {
  if (!id) return null;
  return configs.find((c) => c.id === id) || null;
};

// Wire Main Model
sample({
  source: {
    preset: $activePreset,
    configs: modelConfigsModel.$modelConfigs,
  },
  filter: ({ preset }) => !!preset,
  fn: ({ preset, configs }) =>
    findConfig(configs, preset!.main_model_config_id),
}).watch((config) => {
  if (config) mainModelForm.init(config);
});

// Wire RAG Model
sample({
  source: {
    preset: $activePreset,
    configs: modelConfigsModel.$modelConfigs,
  },
  filter: ({ preset }) => !!preset,
  fn: ({ preset, configs }) => findConfig(configs, preset!.rag_model_config_id),
}).watch((config) => {
  if (config) ragModelForm.init(config);
});

// Wire Guard Model
sample({
  source: {
    preset: $activePreset,
    configs: modelConfigsModel.$modelConfigs,
  },
  filter: ({ preset }) => !!preset,
  fn: ({ preset, configs }) =>
    findConfig(configs, preset!.guard_model_config_id),
}).watch((config) => {
  if (config) guardModelForm.init(config);
});

// Wire Storytelling Model
sample({
  source: {
    preset: $activePreset,
    configs: modelConfigsModel.$modelConfigs,
  },
  filter: ({ preset }) => !!preset,
  fn: ({ preset, configs }) =>
    findConfig(configs, preset!.storytelling_model_config_id),
}).watch((config) => {
  if (config) storytellingModelForm.init(config);
});

// Wire Embedding Model
sample({
  source: {
    preset: $activePreset,
    configs: embeddingConfigsModel.$embeddingConfigs,
  },
  filter: ({ preset }) => !!preset,
  fn: ({ preset, configs }) => findConfig(configs, preset!.embedding_config_id),
}).watch((config) => {
  if (config) embeddingForm.init(config);
});

// Clear data on close
sample({
  clock: closeApiSettings,
  target: [
    tokensModel.resetTokens,
    modelConfigsModel.resetModelConfigs,
    embeddingConfigsModel.resetEmbeddingConfigs,
    presetsModel.resetPresets,
    mainModelForm.resetTriggered,
    ragModelForm.resetTriggered,
    guardModelForm.resetTriggered,
    storytellingModelForm.resetTriggered,
    embeddingForm.resetTriggered,
  ],
});

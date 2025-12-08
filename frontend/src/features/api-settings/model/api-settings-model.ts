import { createEvent, createStore, sample, combine } from "effector";
import {
  providersModel,
  tokensModel,
  presetsModel,
} from "@/entities/llm-config";
import type {
  LLMConfigData,
  EmbeddingConfigData,
  GlobalConfigSchema,
  ConfigPresetUpdate,
} from "@/entities/llm-config";
import { createConfigDataFormFactory } from "./form-factory";
import { userModel } from "@/entities/user";

// Events
export const openApiSettings = createEvent();
export const closeApiSettings = createEvent();
export const initApiSettings = createEvent<string>(); // userId
export const setActivePresetId = createEvent<string>();
export const updateActivePreset = createEvent<ConfigPresetUpdate>(); // Updates current preset fields

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

// Helper to get current config data from preset
const getMainModelConfig = (preset: { config_data: GlobalConfigSchema }) =>
  preset.config_data.main_model;

const getRAGConfig = (preset: { config_data: GlobalConfigSchema }) =>
  preset.config_data.rag.config;

const getGuardConfig = (preset: { config_data: GlobalConfigSchema }) =>
  preset.config_data.guard.config;

const getStorytellingConfig = (preset: { config_data: GlobalConfigSchema }) =>
  preset.config_data.storytelling.config;

const getEmbeddingConfig = (preset: { config_data: GlobalConfigSchema }) =>
  preset.config_data.embedding;

// Helper to update config_data
const updateMainModelInConfigData = (
  configData: GlobalConfigSchema,
  newConfig: LLMConfigData
): GlobalConfigSchema => ({
  ...configData,
  main_model: newConfig,
});

const updateRAGConfigInConfigData = (
  configData: GlobalConfigSchema,
  newConfig: LLMConfigData | null
): GlobalConfigSchema => ({
  ...configData,
  rag: {
    ...configData.rag,
    config: newConfig,
  },
});

const updateGuardConfigInConfigData = (
  configData: GlobalConfigSchema,
  newConfig: LLMConfigData | null
): GlobalConfigSchema => ({
  ...configData,
  guard: {
    ...configData.guard,
    config: newConfig,
  },
});

const updateStorytellingConfigInConfigData = (
  configData: GlobalConfigSchema,
  newConfig: LLMConfigData | null
): GlobalConfigSchema => ({
  ...configData,
  storytelling: {
    ...configData.storytelling,
    config: newConfig,
  },
});

const updateEmbeddingInConfigData = (
  configData: GlobalConfigSchema,
  newConfig: EmbeddingConfigData
): GlobalConfigSchema => ({
  ...configData,
  embedding: newConfig,
});

// Form Factories
export const mainModelForm = createConfigDataFormFactory<LLMConfigData>({
  updatePresetFx: async ({ userId, presetId, configData }) => {
    const result = await presetsModel.updatePresetFx({
      userId,
      presetId,
      data: { config_data: configData },
    });
    return { config_data: result.config_data };
  },
  getConfigFromPreset: getMainModelConfig,
  updateConfigData: updateMainModelInConfigData,
});

export const ragModelForm = createConfigDataFormFactory<LLMConfigData>({
  updatePresetFx: async ({ userId, presetId, configData }) => {
    const result = await presetsModel.updatePresetFx({
      userId,
      presetId,
      data: { config_data: configData },
    });
    return { config_data: result.config_data };
  },
  getConfigFromPreset: (preset) => getRAGConfig(preset),
  updateConfigData: updateRAGConfigInConfigData,
});

export const guardModelForm = createConfigDataFormFactory<LLMConfigData>({
  updatePresetFx: async ({ userId, presetId, configData }) => {
    const result = await presetsModel.updatePresetFx({
      userId,
      presetId,
      data: { config_data: configData },
    });
    return { config_data: result.config_data };
  },
  getConfigFromPreset: (preset) => getGuardConfig(preset),
  updateConfigData: updateGuardConfigInConfigData,
});

export const storytellingModelForm = createConfigDataFormFactory<LLMConfigData>(
  {
    updatePresetFx: async ({ userId, presetId, configData }) => {
      const result = await presetsModel.updatePresetFx({
        userId,
        presetId,
        data: { config_data: configData },
      });
      return { config_data: result.config_data };
    },
    getConfigFromPreset: (preset) => getStorytellingConfig(preset),
    updateConfigData: updateStorytellingConfigInConfigData,
  }
);

export const embeddingForm = createConfigDataFormFactory<EmbeddingConfigData>({
  updatePresetFx: async ({ userId, presetId, configData }) => {
    const result = await presetsModel.updatePresetFx({
      userId,
      presetId,
      data: { config_data: configData },
    });
    return { config_data: result.config_data };
  },
  getConfigFromPreset: getEmbeddingConfig,
  updateConfigData: updateEmbeddingInConfigData,
});

// --- Logic ---

// Load all data when initializing
sample({
  clock: initApiSettings,
  target: [
    providersModel.loadProviders,
    tokensModel.loadTokens,
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

// Handle Preset Updates
sample({
  clock: updateActivePreset,
  source: { userId: userModel.$currentUser, presetId: $activePresetId },
  filter: ({ userId, presetId }) => !!userId && !!presetId,
  fn: ({ userId, presetId }, data) => ({
    userId: userId!.id,
    presetId: presetId!,
    data,
  }),
  target: presetsModel.updatePresetFx,
});

// Initialize forms when preset changes
sample({
  clock: $activePreset,
  filter: (preset): preset is NonNullable<typeof preset> => !!preset,
  fn: (preset) => {
    const mainConfig = getMainModelConfig(preset);
    const ragConfig = getRAGConfig(preset);
    const guardConfig = getGuardConfig(preset);
    const storytellingConfig = getStorytellingConfig(preset);
    const embeddingConfig = getEmbeddingConfig(preset);

    return {
      preset,
      mainConfig,
      ragConfig,
      guardConfig,
      storytellingConfig,
      embeddingConfig,
    };
  },
}).watch(
  ({
    preset,
    mainConfig,
    ragConfig,
    guardConfig,
    storytellingConfig,
    embeddingConfig,
  }) => {
    if (mainConfig) mainModelForm.init(mainConfig);
    // RAG, Guard, Storytelling forms only init if config exists and is enabled
    if (ragConfig && preset.config_data.rag.enabled)
      ragModelForm.init(ragConfig);
    if (guardConfig && preset.config_data.guard.enabled)
      guardModelForm.init(guardConfig);
    if (storytellingConfig && preset.config_data.storytelling.enabled)
      storytellingModelForm.init(storytellingConfig);
    if (embeddingConfig) embeddingForm.init(embeddingConfig);
  }
);

// Wire save effects to update preset
sample({
  clock: mainModelForm.saveTriggered,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    config: mainModelForm.$config,
  },
  filter: ({ userId, presetId, preset, config }) =>
    !!userId && !!presetId && !!preset && !!config,
  fn: ({ userId, presetId, preset, config }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: config!,
  }),
  target: mainModelForm.saveEffect,
});

sample({
  clock: ragModelForm.saveTriggered,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    config: ragModelForm.$config,
  },
  filter: ({ userId, presetId, preset, config }) =>
    !!userId && !!presetId && !!preset && !!config,
  fn: ({ userId, presetId, preset, config }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: config!,
  }),
  target: ragModelForm.saveEffect,
});

sample({
  clock: guardModelForm.saveTriggered,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    config: guardModelForm.$config,
  },
  filter: ({ userId, presetId, preset, config }) =>
    !!userId && !!presetId && !!preset && !!config,
  fn: ({ userId, presetId, preset, config }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: config!,
  }),
  target: guardModelForm.saveEffect,
});

sample({
  clock: storytellingModelForm.saveTriggered,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    config: storytellingModelForm.$config,
  },
  filter: ({ userId, presetId, preset, config }) =>
    !!userId && !!presetId && !!preset && !!config,
  fn: ({ userId, presetId, preset, config }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: config!,
  }),
  target: storytellingModelForm.saveEffect,
});

sample({
  clock: embeddingForm.saveTriggered,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    config: embeddingForm.$config,
  },
  filter: ({ userId, presetId, preset, config }) =>
    !!userId && !!presetId && !!preset && !!config,
  fn: ({ userId, presetId, preset, config }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: config!,
  }),
  target: embeddingForm.saveEffect,
});

// Reload preset after successful save and reinitialize forms
sample({
  clock: [
    mainModelForm.saveEffect.doneData,
    ragModelForm.saveEffect.doneData,
    guardModelForm.saveEffect.doneData,
    storytellingModelForm.saveEffect.doneData,
    embeddingForm.saveEffect.doneData,
  ],
  source: { userId: userModel.$currentUser, presetId: $activePresetId },
  filter: ({ userId, presetId }) => !!userId && !!presetId,
  fn: ({ userId }) => userId!.id,
  target: presetsModel.loadPresets,
});

// Reinitialize forms after preset is updated
sample({
  clock: presetsModel.updatePresetFx.doneData,
  source: $activePresetId,
  filter: (presetId, updatedPreset) =>
    !!presetId && updatedPreset.id === presetId,
  fn: (_, updatedPreset) => updatedPreset,
}).watch((preset) => {
  const mainConfig = getMainModelConfig(preset);
  const ragConfig = getRAGConfig(preset);
  const guardConfig = getGuardConfig(preset);
  const storytellingConfig = getStorytellingConfig(preset);
  const embeddingConfig = getEmbeddingConfig(preset);

  if (mainConfig) mainModelForm.init(mainConfig);
  if (ragConfig && preset.config_data.rag.enabled) ragModelForm.init(ragConfig);
  if (guardConfig && preset.config_data.guard.enabled)
    guardModelForm.init(guardConfig);
  if (storytellingConfig && preset.config_data.storytelling.enabled)
    storytellingModelForm.init(storytellingConfig);
  if (embeddingConfig) embeddingForm.init(embeddingConfig);
});

// Clear data on close
sample({
  clock: closeApiSettings,
  target: [
    tokensModel.resetTokens,
    presetsModel.resetPresets,
    mainModelForm.resetTriggered,
    ragModelForm.resetTriggered,
    guardModelForm.resetTriggered,
    storytellingModelForm.resetTriggered,
    embeddingForm.resetTriggered,
  ],
});

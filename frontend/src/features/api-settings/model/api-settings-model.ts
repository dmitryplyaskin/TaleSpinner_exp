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
export const resetAllForms = createEvent(); // Reset all forms

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

// Select last available preset after deletion if deleted preset was active
sample({
  clock: presetsModel.deletePresetFx.done,
  source: { activePresetId: $activePresetId, presets: presetsModel.$presets },
  filter: ({ activePresetId, presets }, { params }) => {
    // Only select new preset if deleted preset was active and there are presets left
    return activePresetId === params.presetId && presets.length > 0;
  },
  fn: ({ presets }) => {
    // Select default preset if exists, otherwise select last available
    const def = presets.find((p) => p.is_default);
    return def ? def.id : presets[presets.length - 1].id;
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
    // RAG, Guard, Storytelling forms init if enabled (even if config is null, it will be created on first save)
    if (preset.config_data.rag.enabled) {
      if (ragConfig) {
        ragModelForm.init(ragConfig);
      }
    }
    if (preset.config_data.guard.enabled) {
      if (guardConfig) {
        guardModelForm.init(guardConfig);
      }
    }
    if (preset.config_data.storytelling.enabled) {
      if (storytellingConfig) {
        storytellingModelForm.init(storytellingConfig);
      }
    }
    if (embeddingConfig) embeddingForm.init(embeddingConfig);
  }
);

// Track unsaved changes across all forms
export const $hasUnsavedChanges = combine(
  mainModelForm.$isDirty,
  ragModelForm.$isDirty,
  guardModelForm.$isDirty,
  storytellingModelForm.$isDirty,
  embeddingForm.$isDirty,
  (mainDirty, ragDirty, guardDirty, storytellingDirty, embeddingDirty) => {
    return (
      mainDirty || ragDirty || guardDirty || storytellingDirty || embeddingDirty
    );
  }
);

// Event to trigger save for all dirty forms
export const saveAllForms = createEvent();

// Wire save effects to update preset (only when saveAllForms is triggered)
sample({
  clock: saveAllForms,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    mainConfig: mainModelForm.$config,
    mainDirty: mainModelForm.$isDirty,
  },
  filter: ({ userId, presetId, preset, mainConfig, mainDirty }) =>
    !!userId && !!presetId && !!preset && !!mainConfig && mainDirty,
  fn: ({ userId, presetId, preset, mainConfig }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: mainConfig!,
  }),
  target: mainModelForm.saveEffect,
});

sample({
  clock: saveAllForms,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    ragConfig: ragModelForm.$config,
    ragDirty: ragModelForm.$isDirty,
  },
  filter: ({ userId, presetId, preset, ragConfig, ragDirty }) =>
    !!userId && !!presetId && !!preset && !!ragConfig && ragDirty,
  fn: ({ userId, presetId, preset, ragConfig }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: ragConfig!,
  }),
  target: ragModelForm.saveEffect,
});

sample({
  clock: saveAllForms,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    guardConfig: guardModelForm.$config,
    guardDirty: guardModelForm.$isDirty,
  },
  filter: ({ userId, presetId, preset, guardConfig, guardDirty }) =>
    !!userId && !!presetId && !!preset && !!guardConfig && guardDirty,
  fn: ({ userId, presetId, preset, guardConfig }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: guardConfig!,
  }),
  target: guardModelForm.saveEffect,
});

sample({
  clock: saveAllForms,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    storytellingConfig: storytellingModelForm.$config,
    storytellingDirty: storytellingModelForm.$isDirty,
  },
  filter: ({
    userId,
    presetId,
    preset,
    storytellingConfig,
    storytellingDirty,
  }) =>
    !!userId &&
    !!presetId &&
    !!preset &&
    !!storytellingConfig &&
    storytellingDirty,
  fn: ({ userId, presetId, preset, storytellingConfig }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: storytellingConfig!,
  }),
  target: storytellingModelForm.saveEffect,
});

sample({
  clock: saveAllForms,
  source: {
    userId: userModel.$currentUser,
    presetId: $activePresetId,
    preset: $activePreset,
    embeddingConfig: embeddingForm.$config,
    embeddingDirty: embeddingForm.$isDirty,
  },
  filter: ({ userId, presetId, preset, embeddingConfig, embeddingDirty }) =>
    !!userId && !!presetId && !!preset && !!embeddingConfig && embeddingDirty,
  fn: ({ userId, presetId, preset, embeddingConfig }) => ({
    userId: userId!.id,
    presetId: presetId!,
    currentConfigData: preset!.config_data,
    updatedConfig: embeddingConfig!,
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
  // RAG, Guard, Storytelling forms init if enabled (even if config is null, it will be created on first save)
  if (preset.config_data.rag.enabled && ragConfig) {
    ragModelForm.init(ragConfig);
  }
  if (preset.config_data.guard.enabled && guardConfig) {
    guardModelForm.init(guardConfig);
  }
  if (preset.config_data.storytelling.enabled && storytellingConfig) {
    storytellingModelForm.init(storytellingConfig);
  }
  if (embeddingConfig) embeddingForm.init(embeddingConfig);
});

// Reset all forms
sample({
  clock: resetAllForms,
  target: [
    mainModelForm.resetTriggered,
    ragModelForm.resetTriggered,
    guardModelForm.resetTriggered,
    storytellingModelForm.resetTriggered,
    embeddingForm.resetTriggered,
  ],
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

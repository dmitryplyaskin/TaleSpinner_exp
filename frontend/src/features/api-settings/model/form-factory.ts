import { createStore, createEvent, createEffect, sample } from "effector";
import type {
  LLMConfigData,
  EmbeddingConfigData,
  GlobalConfigSchema,
} from "@/entities/llm-config/types";

type ConfigData = LLMConfigData | EmbeddingConfigData;

export interface ConfigDataFormFactoryOptions<T extends ConfigData> {
  // Function to update the entire preset with updated config_data
  updatePresetFx: (params: {
    userId: string;
    presetId: string;
    configData: GlobalConfigSchema;
  }) => Promise<{ config_data: GlobalConfigSchema }>;
  // Function to get the current config from preset's config_data
  getConfigFromPreset: (preset: {
    config_data: GlobalConfigSchema;
  }) => T | null;
  // Function to update config_data with new config
  updateConfigData: (
    configData: GlobalConfigSchema,
    newConfig: T
  ) => GlobalConfigSchema;
}

export function createConfigDataFormFactory<T extends ConfigData>({
  updatePresetFx,
  getConfigFromPreset,
  updateConfigData,
}: ConfigDataFormFactoryOptions<T>) {
  // Events
  const init = createEvent<T>();
  const fieldChanged = createEvent<{ key: keyof T; value: unknown }>();
  const saveTriggered = createEvent();
  const resetTriggered = createEvent();

  // Stores
  const $config = createStore<T | null>(null);
  const $initialConfig = createStore<T | null>(null);
  const $isDirty = createStore(false);
  const $saveStatus = createStore<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  // Logic
  $config
    .on(init, (_, config) => config)
    .on(fieldChanged, (state, { key, value }) => {
      if (!state) return null;
      return { ...state, [key]: value };
    })
    .reset(resetTriggered);

  $initialConfig.on(init, (_, config) => config).reset(resetTriggered);

  // Dirty check
  sample({
    source: { current: $config, initial: $initialConfig },
    fn: ({ current, initial }) => {
      if (!current || !initial) return false;
      return JSON.stringify(current) !== JSON.stringify(initial);
    },
    target: $isDirty,
  });

  // Save - updates the entire preset
  const saveEffect = createEffect(
    async ({
      userId,
      presetId,
      currentConfigData,
      updatedConfig,
    }: {
      userId: string;
      presetId: string;
      currentConfigData: GlobalConfigSchema;
      updatedConfig: T;
    }) => {
      const updatedConfigData = updateConfigData(
        currentConfigData,
        updatedConfig
      );
      const result = await updatePresetFx({
        userId,
        presetId,
        configData: updatedConfigData,
      });
      return result.config_data;
    }
  );

  $saveStatus
    .on(saveEffect.pending, () => "saving")
    .on(saveEffect.done, () => "success")
    .on(saveEffect.fail, () => "error")
    .reset(resetTriggered, fieldChanged);

  return {
    $config,
    $isDirty,
    $saveStatus,
    init,
    fieldChanged,
    saveTriggered,
    resetTriggered,
    saveEffect,
  };
}

export type ConfigDataFormInstance<T extends ConfigData> = ReturnType<
  typeof createConfigDataFormFactory<T>
>;

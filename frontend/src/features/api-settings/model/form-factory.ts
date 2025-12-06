import { createStore, createEvent, createEffect, sample } from "effector";
import type {
  ModelConfig,
  ModelConfigUpdate,
  EmbeddingConfig,
  EmbeddingConfigUpdate,
} from "@/entities/llm-config/types";

type AnyConfig = ModelConfig | EmbeddingConfig;
type AnyConfigUpdate = ModelConfigUpdate | EmbeddingConfigUpdate;

export interface ConfigFormFactoryOptions<
  T extends AnyConfig,
  U extends AnyConfigUpdate,
  C = unknown
> {
  saveFx: (params: { configId: string; data: U }) => Promise<T>;
  createFx: (data: C) => Promise<T>; // For duplication
}

export function createConfigFormFactory<
  T extends AnyConfig,
  U extends AnyConfigUpdate,
  C = unknown
>({ saveFx, createFx }: ConfigFormFactoryOptions<T, U, C>) {
  // Events
  const init = createEvent<T>();
  const fieldChanged = createEvent<{ key: keyof T; value: unknown }>();
  const saveTriggered = createEvent();
  const duplicateTriggered = createEvent<string>(); // New name
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

  // Save
  const saveEffect = createEffect(
    async ({ id, data }: { id: string; data: U }) => {
      return saveFx({ configId: id, data });
    }
  );

  sample({
    clock: saveTriggered,
    source: $config,
    filter: (config): config is T => !!config,
    fn: (config) => {
      // Extract only updatable fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, user_id, created_at, updated_at, ...updatable } =
        config as unknown as Record<string, unknown>;
      return { id: id as string, data: updatable as unknown as U };
    },
    target: saveEffect,
  });

  $saveStatus
    .on(saveEffect.pending, () => "saving")
    .on(saveEffect.done, () => "success")
    .on(saveEffect.fail, () => "error")
    .reset(resetTriggered, fieldChanged);

  // Update initial config on successful save to reset dirty state
  sample({
    clock: saveEffect.doneData,
    target: [init, $initialConfig], // Re-init with returned data
  });

  // Duplicate
  const duplicateEffect = createEffect(
    async ({ config, name }: { config: T; name: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, user_id, created_at, updated_at, ...rest } =
        config as unknown as Record<string, unknown>;
      return createFx({ ...rest, name } as C);
    }
  );

  duplicateTriggered.watch((name) => {
    const config = $config.getState();
    if (config) {
      duplicateEffect({ config, name });
    }
  });

  return {
    $config,
    $isDirty,
    $saveStatus,
    init,
    fieldChanged,
    saveTriggered,
    duplicateTriggered,
    resetTriggered,
    saveEffect,
    duplicateEffect,
  };
}

export type ConfigFormInstance<
  T extends AnyConfig,
  U extends AnyConfigUpdate,
  C = unknown
> = ReturnType<typeof createConfigFormFactory<T, U, C>>;

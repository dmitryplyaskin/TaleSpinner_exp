import { createEffect, createEvent, createStore, sample } from "effector";
import type {
  ConfigPreset,
  ConfigPresetCreate,
  ConfigPresetUpdate,
} from "../types";
import {
  fetchPresets,
  fetchDefaultPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from "../api/llm-config-api";

// Events
export const loadPresets = createEvent<string>(); // userId
export const loadDefaultPreset = createEvent<string>(); // userId
export const addPreset = createEvent<{
  userId: string;
  data: ConfigPresetCreate;
}>();
export const editPreset = createEvent<{
  userId: string;
  presetId: string;
  data: ConfigPresetUpdate;
}>();
export const removePreset = createEvent<{
  userId: string;
  presetId: string;
}>();
export const resetPresets = createEvent();

// Effects
export const fetchPresetsFx = createEffect<string, ConfigPreset[], Error>(
  fetchPresets
);

export const fetchDefaultPresetFx = createEffect<
  string,
  ConfigPreset | null,
  Error
>(fetchDefaultPreset);

export const createPresetFx = createEffect<
  { userId: string; data: ConfigPresetCreate },
  ConfigPreset,
  Error
>(({ userId, data }) => createPreset(userId, data));

export const updatePresetFx = createEffect<
  { userId: string; presetId: string; data: ConfigPresetUpdate },
  ConfigPreset,
  Error
>(({ userId, presetId, data }) => updatePreset(userId, presetId, data));

export const deletePresetFx = createEffect<
  { userId: string; presetId: string },
  void,
  Error
>(({ userId, presetId }) => deletePreset(userId, presetId));

// Stores
export const $presets = createStore<ConfigPreset[]>([]);
export const $presetsLoading = fetchPresetsFx.pending;
export const $presetSaving = createPresetFx.pending;
export const $presetDeleting = deletePresetFx.pending;
export const $presetsError = createStore<string | null>(null);

// Derived stores
export const $defaultPreset = $presets.map(
  (presets) => presets.find((p) => p.is_default) ?? null
);

// Reducers
$presets
  .on(fetchPresetsFx.doneData, (_, presets) => presets)
  .on(createPresetFx.doneData, (state, preset) => {
    // If new preset is default, unset previous default
    if (preset.is_default) {
      return [...state.map((p) => ({ ...p, is_default: false })), preset];
    }
    return [...state, preset];
  })
  .on(updatePresetFx.doneData, (state, updatedPreset) => {
    // If updated preset is now default, unset others
    if (updatedPreset.is_default) {
      return state.map((p) =>
        p.id === updatedPreset.id ? updatedPreset : { ...p, is_default: false }
      );
    }
    return state.map((p) => (p.id === updatedPreset.id ? updatedPreset : p));
  })
  .on(deletePresetFx.done, (state, { params }) =>
    state.filter((p) => p.id !== params.presetId)
  )
  .reset(resetPresets);

$presetsError
  .reset([fetchPresetsFx, createPresetFx, updatePresetFx, deletePresetFx])
  .on(fetchPresetsFx.failData, (_, error) => error.message)
  .on(createPresetFx.failData, (_, error) => error.message)
  .on(updatePresetFx.failData, (_, error) => error.message)
  .on(deletePresetFx.failData, (_, error) => error.message);

// Logic
sample({
  clock: loadPresets,
  target: fetchPresetsFx,
});

sample({
  clock: loadDefaultPreset,
  target: fetchDefaultPresetFx,
});

sample({
  clock: addPreset,
  target: createPresetFx,
});

sample({
  clock: editPreset,
  target: updatePresetFx,
});

sample({
  clock: removePreset,
  target: deletePresetFx,
});

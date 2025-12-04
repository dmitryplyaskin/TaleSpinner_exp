import { createEvent, createStore } from "effector";

export const toggleUserSettings = createEvent<boolean>();

export const $userSettingsOpen = createStore(false).on(
  toggleUserSettings,
  (_, data) => data
);

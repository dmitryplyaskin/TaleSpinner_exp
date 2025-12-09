import { createEvent, createStore } from "effector";

// Events
export const openCreateWorldForm = createEvent();
export const closeCreateWorldForm = createEvent();
export const nextStep = createEvent();
export const prevStep = createEvent();
export const setWorldDescription = createEvent<string>();

// Stores
export const $isFormOpen = createStore(false)
  .on(openCreateWorldForm, () => true)
  .on(closeCreateWorldForm, () => false);

export const $currentStep = createStore(0)
  .on(nextStep, (step) => step + 1)
  .on(prevStep, (step) => Math.max(0, step - 1))
  .reset(closeCreateWorldForm);

export const $worldDescription = createStore("")
  .on(setWorldDescription, (_, description) => description)
  .reset(closeCreateWorldForm);

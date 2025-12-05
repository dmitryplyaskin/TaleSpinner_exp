import { createEvent, createStore, sample } from "effector";
import {
  providersModel,
  tokensModel,
  modelConfigsModel,
  embeddingConfigsModel,
  presetsModel,
} from "@/entities/llm-config";

// Events
export const openApiSettings = createEvent();
export const closeApiSettings = createEvent();
export const initApiSettings = createEvent<string>(); // userId

// Stores
export const $isOpen = createStore(false)
  .on(openApiSettings, () => true)
  .on(closeApiSettings, () => false);

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

// Clear data on close
sample({
  clock: closeApiSettings,
  target: [
    tokensModel.resetTokens,
    modelConfigsModel.resetModelConfigs,
    embeddingConfigsModel.resetEmbeddingConfigs,
    presetsModel.resetPresets,
  ],
});

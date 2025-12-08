import { request } from "@/shared/api/client";
import type {
  ProviderInfo,
  ProviderModelsResponse,
  ProviderType,
  ModelType,
  Token,
  TokenCreate,
  TokenUpdate,
  ConfigPreset,
  ConfigPresetCreate,
  ConfigPresetUpdate,
} from "../types";

// Helper to create headers with user ID
const createHeaders = (userId: string): HeadersInit => ({
  "X-User-Id": userId,
});

// ============ Providers ============

export const fetchProviders = async (): Promise<ProviderInfo[]> => {
  return request<ProviderInfo[]>("/api/v1/providers");
};

export interface FetchProviderModelsParams {
  providerId: ProviderType;
  modelType?: ModelType;
  forceRefresh?: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export const fetchProviderModels = async ({
  providerId,
  modelType,
  forceRefresh,
  apiKey,
  baseUrl,
}: FetchProviderModelsParams): Promise<ProviderModelsResponse> => {
  const params = new URLSearchParams();
  if (modelType) params.set("model_type", modelType);
  if (forceRefresh) params.set("force_refresh", "true");
  if (apiKey) params.set("api_key", apiKey);
  if (baseUrl) params.set("base_url", baseUrl);

  const query = params.toString();
  const url = `/api/v1/providers/${providerId}/models${
    query ? `?${query}` : ""
  }`;
  return request<ProviderModelsResponse>(url);
};

// ============ Tokens ============

export const fetchTokens = async (userId: string): Promise<Token[]> => {
  return request<Token[]>("/api/v1/tokens", {
    headers: createHeaders(userId),
  });
};

export const fetchToken = async (
  userId: string,
  tokenId: string
): Promise<Token> => {
  return request<Token>(`/api/v1/tokens/${tokenId}`, {
    headers: createHeaders(userId),
  });
};

export const createToken = async (
  userId: string,
  data: TokenCreate
): Promise<Token> => {
  return request<Token>("/api/v1/tokens", {
    method: "POST",
    headers: createHeaders(userId),
    body: JSON.stringify(data),
  });
};

export const updateToken = async (
  userId: string,
  tokenId: string,
  data: TokenUpdate
): Promise<Token> => {
  return request<Token>(`/api/v1/tokens/${tokenId}`, {
    method: "PATCH",
    headers: createHeaders(userId),
    body: JSON.stringify(data),
  });
};

export const deleteToken = async (
  userId: string,
  tokenId: string
): Promise<void> => {
  return request<void>(`/api/v1/tokens/${tokenId}`, {
    method: "DELETE",
    headers: createHeaders(userId),
  });
};

// ============ Presets ============

export const fetchPresets = async (userId: string): Promise<ConfigPreset[]> => {
  return request<ConfigPreset[]>("/api/v1/presets", {
    headers: createHeaders(userId),
  });
};

export const fetchPreset = async (
  userId: string,
  presetId: string
): Promise<ConfigPreset> => {
  return request<ConfigPreset>(`/api/v1/presets/${presetId}`, {
    headers: createHeaders(userId),
  });
};

export const fetchDefaultPreset = async (
  userId: string
): Promise<ConfigPreset | null> => {
  try {
    return await request<ConfigPreset>("/api/v1/presets/default", {
      headers: createHeaders(userId),
    });
  } catch {
    return null;
  }
};

export const createPreset = async (
  userId: string,
  data: ConfigPresetCreate
): Promise<ConfigPreset> => {
  return request<ConfigPreset>("/api/v1/presets", {
    method: "POST",
    headers: createHeaders(userId),
    body: JSON.stringify(data),
  });
};

export const createDefaultPreset = async (
  userId: string
): Promise<ConfigPreset> => {
  return request<ConfigPreset>("/api/v1/presets/initialize-defaults", {
    method: "POST",
    headers: createHeaders(userId),
  });
};

export const updatePreset = async (
  userId: string,
  presetId: string,
  data: ConfigPresetUpdate
): Promise<ConfigPreset> => {
  return request<ConfigPreset>(`/api/v1/presets/${presetId}`, {
    method: "PATCH",
    headers: createHeaders(userId),
    body: JSON.stringify(data),
  });
};

export const deletePreset = async (
  userId: string,
  presetId: string
): Promise<void> => {
  return request<void>(`/api/v1/presets/${presetId}`, {
    method: "DELETE",
    headers: createHeaders(userId),
  });
};

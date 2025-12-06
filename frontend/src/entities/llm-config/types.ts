// Provider types
export type ProviderType = "openrouter" | "ollama";
export type ModelType = "llm" | "embedding";

export interface ProviderInfo {
  id: ProviderType;
  name: string;
  supports_llm: boolean;
  supports_embedding: boolean;
  requires_api_key: boolean;
}

export interface ProviderModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  model_type: ModelType;
  context_length: number | null;
  description: string | null;
}

export interface ProviderModelsResponse {
  provider: ProviderType;
  models: ProviderModelInfo[];
  cached: boolean;
}

// Token types
export interface Token {
  id: string;
  user_id: string;
  provider: ProviderType;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenCreate {
  provider: ProviderType;
  name: string;
  token: string;
}

export interface TokenUpdate {
  name?: string;
  token?: string;
  is_active?: boolean;
}

// Model Config types
export type TokenSelectionStrategy = "random" | "sequential" | "failover";

export interface ModelConfig {
  id: string;
  user_id: string;
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids: string[];
  token_selection_strategy: TokenSelectionStrategy;
  temperature: number;
  top_p: number;
  top_k: number | null;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences: string[];
  provider_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModelConfigCreate {
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids?: string[];
  token_selection_strategy?: TokenSelectionStrategy;
  temperature?: number;
  top_p?: number;
  top_k?: number | null;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  provider_settings?: Record<string, unknown>;
}

export interface ModelConfigUpdate {
  name?: string;
  provider?: ProviderType;
  model_id?: string;
  token_ids?: string[];
  token_selection_strategy?: TokenSelectionStrategy;
  temperature?: number;
  top_p?: number;
  top_k?: number | null;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  provider_settings?: Record<string, unknown>;
}

// Embedding Config types
export interface EmbeddingConfig {
  id: string;
  user_id: string;
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids: string[];
  dimensions: number | null;
  batch_size: number;
  provider_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmbeddingConfigCreate {
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids?: string[];
  dimensions?: number;
  batch_size?: number;
  provider_settings?: Record<string, unknown>;
}

export interface EmbeddingConfigUpdate {
  name?: string;
  provider?: ProviderType;
  model_id?: string;
  token_ids?: string[];
  dimensions?: number;
  batch_size?: number;
  provider_settings?: Record<string, unknown>;
}

// Preset types
export interface FallbackStrategy {
  use_main_for_unset: boolean;
  model_fallback_order: string[];
  timeout_seconds: number;
  max_retries: number;
}

export interface ConfigPreset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  main_model_config_id: string;
  rag_model_config_id: string | null;
  rag_enabled: boolean;
  guard_model_config_id: string | null;
  guard_enabled: boolean;
  storytelling_model_config_id: string | null;
  storytelling_enabled: boolean;
  embedding_config_id: string;
  fallback_strategy: FallbackStrategy;
  created_at: string;
  updated_at: string;
}

export interface ConfigPresetCreate {
  name: string;
  description?: string;
  is_default?: boolean;
  main_model_config_id: string;
  rag_model_config_id?: string;
  rag_enabled?: boolean;
  guard_model_config_id?: string;
  guard_enabled?: boolean;
  storytelling_model_config_id?: string;
  storytelling_enabled?: boolean;
  embedding_config_id: string;
  fallback_strategy?: Partial<FallbackStrategy>;
}

export interface ConfigPresetUpdate {
  name?: string;
  description?: string;
  is_default?: boolean;
  main_model_config_id?: string;
  rag_model_config_id?: string | null;
  rag_enabled?: boolean;
  guard_model_config_id?: string | null;
  guard_enabled?: boolean;
  storytelling_model_config_id?: string | null;
  storytelling_enabled?: boolean;
  embedding_config_id?: string;
  fallback_strategy?: Partial<FallbackStrategy>;
}


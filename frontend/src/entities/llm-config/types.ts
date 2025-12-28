// Provider types
export type ProviderType = "openrouter" | "ollama" | "openai_compatible";
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

// Model Config types (deprecated - kept for backward compatibility during migration)
export type TokenSelectionStrategy = "random" | "sequential" | "failover";

// Legacy types - deprecated, use LLMConfigData instead
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
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
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
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
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
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
}

// Embedding Config types (deprecated - kept for backward compatibility during migration)
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
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
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
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
}

export interface EmbeddingConfigUpdate {
  name?: string;
  provider?: ProviderType;
  model_id?: string;
  token_ids?: string[];
  dimensions?: number;
  batch_size?: number;
  provider_settings?: Record<string, unknown>;
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
}

// New types for config_data structure
export interface SamplerSettings {
  temperature: number;
  top_p: number;
  top_k: number | null;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences: string[];
}

export interface LLMConfigData {
  provider: ProviderType;
  model_id: string;
  token_ids: string[];
  token_selection_strategy: TokenSelectionStrategy;
  sampler_settings: SamplerSettings;
  provider_settings: Record<string, unknown>;
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
}

export interface RAGConfig {
  enabled: boolean;
  config: LLMConfigData | null;
}

export interface GuardConfig {
  enabled: boolean;
  config: LLMConfigData | null;
}

export interface StorytellingConfig {
  enabled: boolean;
  config: LLMConfigData | null;
}

export interface EmbeddingConfigData {
  provider: ProviderType;
  model_id: string;
  token_ids: string[];
  dimensions: number | null;
  batch_size: number;
  provider_settings: Record<string, unknown>;
  base_url?: string | null;
  http_headers?: Record<string, unknown>;
}

export interface GlobalConfigSchema {
  main_model: LLMConfigData;
  rag: RAGConfig;
  guard: GuardConfig;
  storytelling: StorytellingConfig;
  embedding: EmbeddingConfigData;
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
  config_data: GlobalConfigSchema;
  fallback_strategy: FallbackStrategy;
  created_at: string;
  updated_at: string;
}

export interface ConfigPresetCreate {
  name: string;
  description?: string;
  is_default?: boolean;
  config_data: GlobalConfigSchema;
  fallback_strategy?: Partial<FallbackStrategy>;
}

export interface ConfigPresetUpdate {
  name?: string;
  description?: string;
  is_default?: boolean;
  config_data?: GlobalConfigSchema;
  fallback_strategy?: Partial<FallbackStrategy>;
}

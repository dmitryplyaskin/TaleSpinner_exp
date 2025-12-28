# LLM Configuration API

Документация для фронтенд-разработчика по работе с API конфигурации LLM провайдеров.

## Общие сведения

### Аутентификация

Все endpoints (кроме `/providers`) требуют заголовок `X-User-Id` с ID текущего пользователя.

```typescript
const headers = {
  "Content-Type": "application/json",
  "X-User-Id": currentUserId,
};
```

### Базовый URL

```
/api/v1
```

---

## Провайдеры

### Типы провайдеров

```typescript
type ProviderType = "openrouter" | "ollama";
type ModelType = "llm" | "embedding";
```

### GET /providers

Получить список всех поддерживаемых провайдеров.

**Ответ:**

```typescript
interface ProviderInfo {
  id: ProviderType;
  name: string;
  supports_llm: boolean;
  supports_embedding: boolean;
  requires_api_key: boolean;
}

// Response: ProviderInfo[]
```

**Пример ответа:**

```json
[
  {
    "id": "openrouter",
    "name": "Openrouter",
    "supports_llm": true,
    "supports_embedding": true,
    "requires_api_key": true
  },
  {
    "id": "ollama",
    "name": "Ollama",
    "supports_llm": true,
    "supports_embedding": true,
    "requires_api_key": false
  }
]
```

### GET /providers/{provider_id}/models

Получить список моделей провайдера. Результаты кэшируются на 5 минут.

**Query параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `model_type` | `llm` \| `embedding` | Фильтр по типу модели |
| `force_refresh` | `boolean` | Принудительно обновить кэш |
| `api_key` | `string` | API ключ для аутентифицированных запросов |

**Ответ:**

```typescript
interface ProviderModelInfo {
  id: string; // "anthropic/claude-3.5-sonnet"
  name: string; // "Claude 3.5 Sonnet"
  provider: ProviderType;
  model_type: ModelType;
  context_length: number | null;
  description: string | null;
}

interface ProviderModelsResponse {
  provider: ProviderType;
  models: ProviderModelInfo[];
  cached: boolean;
}
```

**Пример запроса:**

```typescript
// Получить только LLM модели
fetch("/api/v1/providers/openrouter/models?model_type=llm");

// Принудительно обновить кэш
fetch("/api/v1/providers/openrouter/models?force_refresh=true");
```

---

## Токены (API ключи)

Токены хранятся в зашифрованном виде. Сам токен никогда не возвращается в ответах API.

### Типы

```typescript
interface Token {
  id: string;
  user_id: string;
  provider: ProviderType;
  name: string; // Пользовательское название
  is_active: boolean;
  created_at: string; // ISO datetime
  updated_at: string;
}

interface TokenCreate {
  provider: ProviderType;
  name: string;
  token: string; // Сам API ключ (только при создании/обновлении)
}

interface TokenUpdate {
  name?: string;
  token?: string; // Новый токен
  is_active?: boolean;
}
```

### Endpoints

| Метод  | Endpoint       | Описание                         |
| ------ | -------------- | -------------------------------- |
| GET    | `/tokens`      | Список всех токенов пользователя |
| POST   | `/tokens`      | Создать новый токен              |
| GET    | `/tokens/{id}` | Получить токен по ID             |
| PATCH  | `/tokens/{id}` | Обновить токен                   |
| DELETE | `/tokens/{id}` | Удалить токен                    |

**Пример создания токена:**

```typescript
const response = await fetch("/api/v1/tokens", {
  method: "POST",
  headers,
  body: JSON.stringify({
    provider: "openrouter",
    name: "My OpenRouter Key",
    token: "sk-or-v1-xxxxx...",
  }),
});
```

---

## Конфигурации моделей (Model Configs)

Переиспользуемые конфигурации LLM моделей с настройками семплера.

### Типы

```typescript
type TokenSelectionStrategy = "random" | "sequential" | "failover";

interface ModelConfig {
  id: string;
  user_id: string;
  name: string; // "Fast GPT-4"
  provider: ProviderType;
  model_id: string; // "anthropic/claude-3.5-sonnet"

  // Привязка токенов
  token_ids: string[]; // Массив ID токенов
  token_selection_strategy: TokenSelectionStrategy;

  // Настройки семплера
  temperature: number; // 0.0 - 2.0, default: 0.7
  top_p: number; // 0.0 - 1.0, default: 1.0
  top_k: number | null; // >= 1
  max_tokens: number; // 1 - 200000, default: 4096
  frequency_penalty: number; // -2.0 - 2.0, default: 0.0
  presence_penalty: number; // -2.0 - 2.0, default: 0.0
  stop_sequences: string[];

  // Специфичные настройки провайдера
  provider_settings: Record<string, any>;

  created_at: string;
  updated_at: string;
}

interface ModelConfigCreate {
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
  provider_settings?: Record<string, any>;
}

// ModelConfigUpdate - все поля опциональны
```

### Endpoints

| Метод  | Endpoint              | Описание             |
| ------ | --------------------- | -------------------- |
| GET    | `/model-configs`      | Список конфигураций  |
| POST   | `/model-configs`      | Создать конфигурацию |
| GET    | `/model-configs/{id}` | Получить по ID       |
| PATCH  | `/model-configs/{id}` | Обновить             |
| DELETE | `/model-configs/{id}` | Удалить              |

**Пример создания:**

```typescript
const response = await fetch("/api/v1/model-configs", {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: "Creative Writing",
    provider: "openrouter",
    model_id: "anthropic/claude-3.5-sonnet",
    token_ids: ["token-uuid-1"],
    temperature: 0.9,
    max_tokens: 8192,
  }),
});
```

---

## Конфигурации эмбеддингов (Embedding Configs)

### Типы

```typescript
interface EmbeddingConfig {
  id: string;
  user_id: string;
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids: string[];
  dimensions: number | null;
  batch_size: number; // 1 - 1000, default: 100
  provider_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface EmbeddingConfigCreate {
  name: string;
  provider: ProviderType;
  model_id: string;
  token_ids?: string[];
  dimensions?: number;
  batch_size?: number;
  provider_settings?: Record<string, any>;
}
```

### Endpoints

| Метод  | Endpoint                  | Описание |
| ------ | ------------------------- | -------- |
| GET    | `/embedding-configs`      | Список   |
| POST   | `/embedding-configs`      | Создать  |
| GET    | `/embedding-configs/{id}` | Получить |
| PATCH  | `/embedding-configs/{id}` | Обновить |
| DELETE | `/embedding-configs/{id}` | Удалить  |

---

## Пресеты (Config Presets)

Комбинация конфигураций моделей для разных целей.

### Типы

```typescript
interface FallbackStrategy {
  use_main_for_unset: boolean; // Использовать main для неустановленных
  model_fallback_order: string[]; // Порядок fallback
  timeout_seconds: number; // 1 - 300, default: 30
  max_retries: number; // 0 - 10, default: 3
}

interface ConfigPreset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;

  // Основная модель (обязательно)
  main_model_config_id: string;

  // RAG модель (опционально)
  rag_model_config_id: string | null;
  rag_enabled: boolean;

  // Guard модель (опционально)
  guard_model_config_id: string | null;
  guard_enabled: boolean;

  // Storytelling модель (опционально)
  storytelling_model_config_id: string | null;
  storytelling_enabled: boolean;

  // Эмбеддинг (обязательно)
  embedding_config_id: string;

  fallback_strategy: FallbackStrategy;

  created_at: string;
  updated_at: string;
}

interface ConfigPresetCreate {
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
  fallback_strategy?: FallbackStrategy;
}
```

### Endpoints

| Метод  | Endpoint           | Описание                  |
| ------ | ------------------ | ------------------------- |
| GET    | `/presets`         | Список пресетов           |
| POST   | `/presets`         | Создать пресет            |
| GET    | `/presets/default` | Получить дефолтный пресет |
| GET    | `/presets/{id}`    | Получить по ID            |
| PATCH  | `/presets/{id}`    | Обновить                  |
| DELETE | `/presets/{id}`    | Удалить                   |

**Пример создания пресета:**

```typescript
const response = await fetch("/api/v1/presets", {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: "My RPG Setup",
    description: "Настройки для ролевых игр",
    is_default: true,
    main_model_config_id: "model-config-uuid-1",
    storytelling_model_config_id: "model-config-uuid-2",
    storytelling_enabled: true,
    embedding_config_id: "embedding-config-uuid-1",
    fallback_strategy: {
      use_main_for_unset: true,
      timeout_seconds: 30,
      max_retries: 3,
    },
  }),
});
```

---

## Истории (Stories)

### Типы

```typescript
interface Story {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  preset_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StoryCreate {
  title: string;
  description?: string;
  preset_id: string;
}

interface StoryUpdate {
  title?: string;
  description?: string;
  is_active?: boolean;
}
```

### Endpoints

| Метод  | Endpoint        | Описание            |
| ------ | --------------- | ------------------- |
| GET    | `/stories`      | Список историй      |
| POST   | `/stories`      | Создать историю     |
| GET    | `/stories/{id}` | Получить с конфигом |
| PATCH  | `/stories/{id}` | Обновить            |
| DELETE | `/stories/{id}` | Удалить             |

**Query параметры для GET /stories:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `active_only` | `boolean` | Только активные истории |

---

## Конфигурация истории (Story Config)

Переопределения настроек для конкретной истории.

### Типы

```typescript
interface StoryConfigOverrides {
  // Переопределения семплера
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];

  // Можно также переопределить модель
  model_id?: string;
}

interface StoryConfig {
  id: string;
  story_id: string;

  main_model_override: StoryConfigOverrides | null;
  rag_model_override: StoryConfigOverrides | null;
  guard_model_override: StoryConfigOverrides | null;
  storytelling_model_override: StoryConfigOverrides | null;
  embedding_override: Record<string, any> | null;

  rag_enabled_override: boolean | null;
  guard_enabled_override: boolean | null;
  storytelling_enabled_override: boolean | null;

  updated_at: string;
}

interface StoryConfigUpdate {
  main_model_override?: StoryConfigOverrides;
  rag_model_override?: StoryConfigOverrides;
  guard_model_override?: StoryConfigOverrides;
  storytelling_model_override?: StoryConfigOverrides;
  embedding_override?: Record<string, any>;
  rag_enabled_override?: boolean;
  guard_enabled_override?: boolean;
  storytelling_enabled_override?: boolean;
}
```

### Endpoints

| Метод  | Endpoint               | Описание                     |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/stories/{id}/config` | Получить конфиг истории      |
| PATCH  | `/stories/{id}/config` | Обновить переопределения     |
| DELETE | `/stories/{id}/config` | Сбросить все переопределения |

**Пример обновления температуры для конкретной истории:**

```typescript
await fetch(`/api/v1/stories/${storyId}/config`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    main_model_override: {
      temperature: 0.8,
    },
  }),
});
```

---

## Рекомендуемый порядок UI

### 1. Управление токенами

Первый шаг - пользователь добавляет свои API ключи.

```
┌─────────────────────────────────────┐
│ API Tokens                          │
├─────────────────────────────────────┤
│ + Add Token                         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔑 My OpenRouter Key            │ │
│ │    Provider: openrouter         │ │
│ │    Status: ✓ Active             │ │
│ │    [Edit] [Delete]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔑 Ollama Local                 │ │
│ │    Provider: ollama             │ │
│ │    Status: ✓ Active             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Конфигурации моделей

Создание переиспользуемых конфигураций.

```
┌─────────────────────────────────────┐
│ Model Configurations                │
├─────────────────────────────────────┤
│ + New Configuration                 │
│                                     │
│ Name: [Creative Writing         ]   │
│                                     │
│ Provider: [OpenRouter ▼]            │
│ Model:    [Claude 3.5 Sonnet ▼]     │
│ Token:    [My OpenRouter Key ▼]     │
│                                     │
│ ─── Sampler Settings ───            │
│ Temperature: [═══════●══] 0.9       │
│ Top P:       [══════════●] 1.0      │
│ Max Tokens:  [8192        ]         │
│                                     │
│ [Save Configuration]                │
└─────────────────────────────────────┘
```

### 3. Конфигурации эмбеддингов

Аналогично, но с меньшим количеством настроек.

### 4. Пресеты

Комбинирование конфигураций.

```
┌─────────────────────────────────────┐
│ Preset: My RPG Setup                │
├─────────────────────────────────────┤
│ Main Model*:  [Creative Writing ▼]  │
│                                     │
│ ☑ Storytelling Model                │
│   Config:     [Narrative Pro   ▼]   │
│                                     │
│ ☐ RAG Model                         │
│   Config:     [Select...       ▼]   │
│                                     │
│ ☐ Guard Model                       │
│   Config:     [Select...       ▼]   │
│                                     │
│ Embedding*:   [Nomic Embed     ▼]   │
│                                     │
│ ☑ Set as default                    │
│                                     │
│ [Save Preset]                       │
└─────────────────────────────────────┘
```

### 5. Создание истории

Выбор пресета при создании.

```
┌─────────────────────────────────────┐
│ New Story                           │
├─────────────────────────────────────┤
│ Title:   [My Fantasy Adventure  ]   │
│                                     │
│ Preset:  [My RPG Setup ▼]           │
│                                     │
│ [Create Story]                      │
└─────────────────────────────────────┘
```

### 6. Настройки внутри истории

Переопределение параметров на лету.

```
┌─────────────────────────────────────┐
│ Story Settings (overrides)          │
├─────────────────────────────────────┤
│ Based on preset: My RPG Setup       │
│                                     │
│ Main Model Temperature:             │
│ [═══════●══════] 0.8 (was 0.9)      │
│                                     │
│ [Reset to Preset Defaults]          │
└─────────────────────────────────────┘
```

---

## Effector модели (рекомендация)

```typescript
// entities/llm-config/model/tokens.ts
export const fetchTokensFx = createEffect<void, Token[]>();
export const createTokenFx = createEffect<TokenCreate, Token>();
export const deleteTokenFx = createEffect<string, void>();

export const $tokens = createStore<Token[]>([]);

// entities/llm-config/model/model-configs.ts
export const fetchModelConfigsFx = createEffect<void, ModelConfig[]>();
export const createModelConfigFx = createEffect<
  ModelConfigCreate,
  ModelConfig
>();
// ...

// entities/llm-config/model/presets.ts
export const fetchPresetsFx = createEffect<void, ConfigPreset[]>();
export const $presets = createStore<ConfigPreset[]>([]);
export const $defaultPreset = $presets.map(
  (presets) => presets.find((p) => p.is_default) ?? null
);
```

---

## Коды ошибок

| Код | Описание                                            |
| --- | --------------------------------------------------- |
| 400 | Невалидные данные                                   |
| 404 | Ресурс не найден                                    |
| 422 | Ошибка валидации                                    |
| 500 | Ошибка шифрования токена (проверьте ENCRYPTION_KEY) |

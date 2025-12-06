# Техническая спецификация реализации API Settings (Frontend)

## Обзор

Модуль настроек API (API Settings Drawer) предоставляет интерфейс для управления конфигурациями LLM, Эмбеддингов, Токенов и Пресетов. Данный документ описывает взаимодействие с обновленным API бекенда, структуру данных и логику работы компонентов.

---

## 1. Основные сущности и типы данных

### 1.1. Провайдеры (Providers)

Список доступных провайдеров получается через `GET /api/v1/providers`.

```typescript
type ProviderType = "openrouter" | "ollama" | "openai_compatible";

interface ProviderInfo {
  id: ProviderType;
  name: string;
  supports_llm: boolean; // false для Ollama
  supports_embedding: boolean;
  requires_api_key: boolean; // false для Ollama и OpenAI Compatible
  base_url?: string; // Default URL (если есть)
}
```

### 1.2. Конфигурация модели (Model Config)

Используется для блоков: "Основная модель", "RAG модель", "Guard модель", "Storytelling модель".

```typescript
interface ModelConfig {
  id: string;
  name: string; // Название конфига (не модели!)
  provider: ProviderType;
  model_id: string; // ID модели (напр. "anthropic/claude-3")

  // Расширенные настройки подключения (новые поля!)
  base_url?: string | null; // Для OpenAI Compatible / Custom Ollama
  http_headers?: Record<string, any>; // JSON с кастомными заголовками

  // Токены
  token_ids: string[];
  token_selection_strategy: "random" | "sequential" | "failover";

  // Семплеры
  temperature: number;
  top_p: number;
  top_k?: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences: string[];

  // Кастомные параметры
  provider_settings: Record<string, any>; // JSON для extra-параметров тела запроса
}
```

### 1.3. Конфигурация эмбеддинга (Embedding Config)

Используется для блока "Эмбединг".

```typescript
interface EmbeddingConfig {
  id: string;
  name: string;
  provider: ProviderType;
  model_id: string;

  // Расширенные настройки подключения (новые поля!)
  base_url?: string | null;
  http_headers?: Record<string, any>;

  token_ids: string[];
  batch_size: number;
  provider_settings: Record<string, any>;
}
```

---

## 2. Логика работы компонентов (UI/UX)

### 2.1. Блок "Глобальный пресет"

- **Логика:** Управляет сущностью `ConfigPreset`.
- **Данные:** `GET /api/v1/presets`.
- **Действие:** При выборе пресета (`activePresetId`), приложение должно загрузить связанные конфиги (`main_model_config_id` и др.) и отобразить их в соответствующих блоках.
- **Проверка изменений:** Фронтенд должен хранить состояние "грязных" (измененных) форм. Если пользователь меняет пресет, а в текущих формах есть несохраненные изменения -> показать Alert Dialog.

### 2.2. Блок "Модель" (Main, RAG, Guard, Storytelling)

- **Состояние:** Каждый блок привязан к конкретному `ModelConfig` ID из текущего Пресета.
- **Выбор Провайдера:**
  - При смене провайдера на `openai_compatible` -> Показать инпут `Base URL`.
  - При смене провайдера на `ollama` -> LLM выбрать нельзя (т.к. `supports_llm: false`). (Учесть это в валидации: Ollama доступна только в блоке Эмбеддингов или если бекенд разрешит).
- **Загрузка списка моделей:**
  - Запрос: `GET /api/v1/providers/{provider}/models`
  - Для `openai_compatible`: Обязательно передавать параметр `?base_url=...` при запросе списка моделей. Если URL пустой -> список пуст.
- **Токены:**
  - Фильтровать список токенов по выбранному `provider`.
  - Если `requires_api_key: false` (Ollama, OpenAI Compatible) -> выбор токена не обязателен (можно слать пустой массив `token_ids`).
- **Поля JSON:**
  - "Custom Samplers" -> маппится в `provider_settings`.
  - "Custom Headers" -> маппится в `http_headers`.
  - Валидировать JSON на клиенте перед отправкой.

### 2.3. Блок "Эмбединг"

- **Аналогично блоку модели**, но работает с сущностью `EmbeddingConfig`.
- **Важно:** Теперь здесь тоже есть поля `Base URL` и `Headers` (для подключения к удаленной Ollama или vLLM).

### 2.4. Модальное окно "Управление токенами"

- **Создание:** `POST /api/v1/tokens`.
- **Валидация:** Если выбран провайдер, не требующий ключа, поле ввода токена может быть опциональным (или фронтенд шлет dummy-строку, если бекенд требует not null).

---

## 3. Сценарии взаимодействия с API

### 3.1. Получение списка моделей для Custom Provider

Когда пользователь выбирает "OpenAI Compatible" и вводит `http://localhost:1234/v1`:

1.  Фронтенд делает debounce (задержку) ввода.
2.  Выполняет запрос:
    ```http
    GET /api/v1/providers/openai_compatible/models?base_url=http://localhost:1234/v1
    ```
3.  Если успешно -> обновляет список в селекте "Model Name".
4.  Если ошибка -> показывает уведомление "Failed to fetch models from custom URL".

### 3.2. Сохранение настроек

1.  Пользователь меняет настройки в блоке (например, температуру).
2.  Нажимает кнопку "Сохранить пресет" (в блоке пресета) или "Сохранить конфиг" (в блоке модели).
    - _Примечание:_ Гайд подразумевает сохранение именно Пресета. Но так как Пресет состоит из ссылок на Конфиги, то "Сохранение" должно, вероятно, обновлять `ModelConfig` (`PATCH /api/v1/model-configs/{id}`).
    - _Best Practice:_ Если пользователь изменил параметры переиспользуемого конфига, лучше спросить: "Обновить этот конфиг для всех пресетов или создать копию?".

---

## 4. Особенности реализации (Технические детали)

1.  **Ollama:**

    - В блоках типа "LLM" (Main, RAG...) провайдер `ollama` должен быть скрыт или заблокирован, так как бекенд возвращает `supports_llm: false`.
    - Он доступен только в блоке "Эмбединг".

2.  **OpenAI Compatible:**

    - Требует обязательного ввода `base_url` пользователем.
    - `http_headers` полезны для провайдеров типа Azure OpenAI (где нужны специфические ключи в заголовках) или прокси с авторизацией.

3.  **Сворачивание блоков:**

    - Состояние `is_expanded` для блоков хранить в локальном стейте (или `localStorage`), это не влияет на бекенд.
    - Состояние `is_enabled` (чекбокс RAG/Guard) -> сохраняется в `ConfigPreset` (`rag_enabled`, `guard_enabled`).

4.  **Валидация форм:**
    - `base_url`: Должен быть валидным URL (начинаться с http/https).
    - `json` поля: Должны парситься через `JSON.parse()` без ошибок.

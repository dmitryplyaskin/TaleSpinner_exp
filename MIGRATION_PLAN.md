# Описание задачи

Необходимо провести архитектурный рефакторинг системы управления конфигурациями LLM (ConfigPreset).

### Текущее состояние

В данный момент система использует реляционную модель, где `ConfigPreset` является контейнером, хранящим внешние ключи (Foreign Keys) на отдельные записи в таблицах `model_configs` (для Main, RAG, Guard, Storytelling) и `embedding_configs`. Это создает сложность в управлении зависимостями, требует множественных запросов к API для сборки полного конфига на клиенте и усложняет логику "глобальных пресетов".

### Целевое состояние

Мы переходим к модели, где `ConfigPreset` является **самодостаточной сущностью**.

1. Вся конфигурация моделей (провайдеры, параметры, токены) должна храниться внутри одного JSON-поля `config_data` в таблице `config_presets`.
2. Таблицы `model_configs` и `embedding_configs` должны быть удалены.
3. Таблица `tokens` (API ключи) остается независимой, и конфигурация внутри JSON будет ссылаться на ID токенов.
4. Глобальные пресеты — это просто записи в таблице `config_presets`, содержащие полный набор настроек. Пользователь может создавать множество таких пресетов.

### Ключевые требования

- **База данных**: Миграция схемы с удалением старых таблиц и добавлением JSON-поля в пресеты. Данные в старых таблицах можно не сохранять (база считается пустой/тестовой).
- **Backend**: API должно принимать и отдавать полный JSON конфига. Валидация структуры JSON должна происходить через Pydantic.
- **Frontend**: Удаление сторов для отдельных конфигов. UI формы должны редактировать части JSON-объекта активного пресета и сохранять пресет целиком.

---

# План рефакторинга: Унификация настроек в ConfigPreset

Цель: Избавиться от разрозненных сущностей `ModelConfig` и `EmbeddingConfig` и хранить всю конфигурацию (Main, RAG, Guard, Storytelling, Embedding) внутри одного JSON-поля в `ConfigPreset`.

---

## Фаза 1: Backend (Python / SQLModel) ✅ ВЫПОЛНЕНО

### 1. Удаление устаревших моделей и API ✅

- [x] **Удалить файлы моделей:**
  - `backend/app/models/model_config.py` ✅
  - `backend/app/models/embedding_config.py` ✅
- [x] **Удалить файлы схем (Pydantic):**
  - `backend/app/schemas/model_config.py` ✅
  - `backend/app/schemas/embedding_config.py` ✅
- [x] **Удалить API эндпоинты:**
  - `backend/app/api/v1/model_configs.py` ✅
  - `backend/app/api/v1/embedding_configs.py` ✅
- [x] **Очистить импорты:** ✅
  - Обновлен `backend/app/main.py` - удалена регистрация роутеров
  - Обновлен `backend/app/models/__init__.py` - удалены экспорты
  - Обновлен `backend/app/schemas/__init__.py` - удалены экспорты
  - Обновлен `backend/app/models/user.py` - удалены relationships
  - Удалены сервисы `model_configs.py` и `embedding_configs.py`

### 2. Обновление ConfigPreset (Model & Schema) ✅

- [x] **Обновить `backend/app/models/config_preset.py`:** ✅

  - Удалены поля-внешние ключи: `main_model_config_id`, `rag_model_config_id`, `embedding_config_id`, `guard_model_config_id`, `storytelling_model_config_id` ✅
  - Удалены флаги: `rag_enabled`, `guard_enabled`, `storytelling_enabled` (перенесены внутрь JSON) ✅
  - Добавлено поле: `config_data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))` ✅
  - Удалены TYPE_CHECKING импорты для удаленных моделей ✅

- [x] **Обновить `backend/app/schemas/config_preset.py`:** ✅

  - Созданы Pydantic модели для структуры config_data: ✅
    - `SamplerSettings` - настройки сэмплера (temperature, top_p, max_tokens и т.д.)
    - `LLMConfig` - базовая конфигурация LLM (provider, model_id, token_ids, sampler_settings и т.д.)
    - `RAGConfig` - конфигурация RAG (enabled, config: LLMConfig)
    - `GuardConfig` - конфигурация Guard (enabled, config: LLMConfig)
    - `StorytellingConfig` - конфигурация Storytelling (enabled, config: LLMConfig)
    - `EmbeddingConfigData` - конфигурация Embedding (provider, model_id, token_ids, dimensions, batch_size и т.д.)
    - `GlobalConfigSchema` - объединяющая модель со всеми секциями
  - Обновлены схемы: ✅
    - `ConfigPresetCreate` - использует `config_data: GlobalConfigSchema`
    - `ConfigPresetUpdate` - использует `config_data: GlobalConfigSchema | None`
    - `ConfigPresetRead` - использует `config_data: dict[str, Any]`

### 3. Обновление логики сервиса Presets ✅

- [x] **Обновить `backend/app/services/presets.py`:** ✅
  - Удалены импорты `EmbeddingConfigCreate`, `ModelConfigCreate`, `embedding_configs`, `model_configs` ✅
  - Обновлена функция `create_preset` - работает с `config_data` напрямую ✅
  - Обновлена функция `update_preset` - обрабатывает `config_data` как Pydantic модель или dict ✅
  - Обновлена функция `create_default_preset_structure` - создает пресет с валидным JSON в `config_data` вместо создания отдельных конфигов ✅
  - Валидация JSON структуры происходит через Pydantic схемы (`GlobalConfigSchema`) при входе в API ✅

### 4. Миграция БД ✅

- [x] **Создана миграция Alembic:** ✅
  - Файл: `backend/alembic/versions/refactor_presets_json.py`
  - Миграция удаляет внешние ключи из `config_presets` ✅
  - Удаляет колонки: `main_model_config_id`, `rag_model_config_id`, `guard_model_config_id`, `storytelling_model_config_id`, `embedding_config_id`, `rag_enabled`, `guard_enabled`, `storytelling_enabled` ✅
  - Добавляет колонку `config_data` (JSON) ✅
  - Удаляет таблицы `model_configs` и `embedding_configs` ✅
  - Удаляет индексы связанные с удаляемыми таблицами ✅
  - **Примечание:** Миграция создана, но не применена. Для применения выполните: `alembic upgrade head`

---

## Фаза 2: Frontend (React / Effector / TypeScript) ✅ ВЫПОЛНЕНО

### 1. Обновление типов и API ✅

- [x] **Обновить типы в `frontend/src/entities/llm-config/types.ts`:** ✅

  - Созданы новые типы для структуры `config_data`: `SamplerSettings`, `LLMConfigData`, `RAGConfig`, `GuardConfig`, `StorytellingConfig`, `EmbeddingConfigData`, `GlobalConfigSchema` ✅
  - Обновлен интерфейс `ConfigPreset`: заменены поля `*_config_id` и `*_enabled` на поле `config_data: GlobalConfigSchema` ✅
  - Обновлены `ConfigPresetCreate` и `ConfigPresetUpdate` для работы с `config_data` ✅
  - Старые типы `ModelConfig` и `EmbeddingConfig` помечены как deprecated, но оставлены для обратной совместимости ✅

- [x] **Очистить API слой:** ✅
  - Удален `frontend/src/entities/llm-config/model/model-configs.ts` ✅
  - Удален `frontend/src/entities/llm-config/model/embedding-configs.ts` ✅
  - Удалены функции для model-configs и embedding-configs из `llm-config-api.ts` ✅
  - Убраны экспорты `modelConfigsModel` и `embeddingConfigsModel` из `index.ts` ✅

### 2. Рефакторинг стора `presets.ts` ✅

- [x] `presetsModel` работает с новой структурой `ConfigPreset` с полем `config_data` ✅

### 3. Рефакторинг Feature: `api-settings` ✅

Логика "сборки" пресета из кусков удалена.

- [x] **Обновлен `frontend/src/features/api-settings/model/api-settings-model.ts`:** ✅

  - Удалены импорты и зависимости от `modelConfigsModel` и `embeddingConfigsModel` ✅
  - Удалены сэмплы, которые слушали загрузку `modelConfigs` и `embeddingConfigs` ✅
  - Удалена логика `findConfig` ✅
  - Создана новая фабрика форм `createConfigDataFormFactory` для работы с частями `config_data` ✅
  - Формы редактирования (Main, RAG, Guard, Storytelling, Embedding) теперь работают с частями `activePreset.config_data` ✅
  - При сохранении формы обновляют весь пресет через `updatePresetFx` с обновленным `config_data` ✅
  - Добавлена логика инициализации форм при изменении активного пресета ✅
  - Добавлена логика переинициализации форм после успешного сохранения ✅

- [x] **Обновлены UI компоненты:** ✅
  - **`frontend/src/features/api-settings/ui/blocks/model-config-block.tsx`**: ✅
    - Удален селектор конфигов и кнопки создания/удаления отдельных конфигов ✅
    - Получает данные напрямую из формы, которая работает с `config_data.main_model` (или rag/guard/storytelling) ✅
    - Обновлена работа с `sampler_settings` (теперь вложенный объект) ✅
    - Удалены зависимости от `modelConfigsModel` ✅
  - **`frontend/src/features/api-settings/ui/blocks/embedding-config-block.tsx`**: ✅
    - Аналогично `model-config-block.tsx` ✅
    - Получает данные из формы, работающей с `config_data.embedding` ✅
    - Удалены зависимости от `embeddingConfigsModel` ✅
  - **`frontend/src/features/api-settings/ui/blocks/global-preset-block.tsx`**: ✅
    - Обновлен `handleDuplicate`: копирует `config_data` вместо отдельных ID ✅
  - **`frontend/src/features/api-settings/ui/api-settings-drawer.tsx`**: ✅
    - Обновлена передача данных в блоки: удалены `configId` и `onConfigChange` ✅
    - Обновлен `onToggle` для работы с `config_data.rag.enabled`, `config_data.guard.enabled`, `config_data.storytelling.enabled` ✅
  - **`frontend/src/features/api-settings/ui/preset-form.tsx`**: ✅
    - Полностью переписан для создания пресета с `config_data` ✅
    - Использует функцию `createDefaultConfigData()` для создания валидной структуры по умолчанию ✅
    - Упрощен: создает пресет с дефолтной структурой, которую можно редактировать после создания ✅
  - **Удалены неиспользуемые компоненты**: ✅
    - `model-config-form.tsx` - удален ✅
    - `embedding-config-form.tsx` - удален ✅
    - `model-configs-section.tsx` - удален ✅
    - `embedding-configs-section.tsx` - удален ✅

### 4. Проверка

- [ ] Убедиться, что создание нового пресета создает запись с валидным JSON.
- [ ] Убедиться, что переключение пресетов корректно обновляет все формы на экране.
- [ ] Проверить сохранение изменений (PATCH запрос должен отправлять обновленный JSON).

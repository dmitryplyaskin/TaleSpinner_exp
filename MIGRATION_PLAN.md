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

## Фаза 1: Backend (Python / SQLModel)

### 1. Удаление устаревших моделей и API

- [ ] **Удалить файлы моделей:**
  - `backend/app/models/model_config.py`
  - `backend/app/models/embedding_config.py`
- [ ] **Удалить файлы схем (Pydantic):**
  - `backend/app/schemas/model_config.py`
  - `backend/app/schemas/embedding_config.py`
- [ ] **Удалить API эндпоинты:**
  - `backend/app/api/v1/model_configs.py`
  - `backend/app/api/v1/embedding_configs.py`
- [ ] **Очистить `backend/app/api/v1/__init__.py`** от импортов удаленных роутеров.

### 2. Обновление ConfigPreset (Model & Schema)

- [ ] **Обновить `backend/app/models/config_preset.py`:**

  - Удалить поля-внешние ключи: `main_model_config_id`, `rag_model_config_id`, `embedding_config_id`, `guard_model_config_id`, `storytelling_model_config_id` и соответствующие флаги `*_enabled` (флаги можно перенести внутрь JSON, если удобно, или оставить на уровне корня, но лучше сгруппировать в JSON).
  - Удалить старые связи (`relationship`).
  - Добавить новое поле:
    ```python
    config_data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    ```
    _Примечание: Структура JSON должна включать секции `main_model`, `rag`, `guard`, `storytelling`, `embedding`._

- [ ] **Обновить `backend/app/schemas/config_preset.py`:**

  - Определить Pydantic модели для вложенных конфигураций (можно переиспользовать логику из удаленных схем `ModelConfigBase`, но без ID и полей БД).
  - Примерная структура:

    ```python
    class LLMConfig(BaseModel):
        provider: str
        model_id: str
        parameters: dict  # temp, top_p, etc
        token_ids: list[str]

    class RAGConfig(BaseModel):
        enabled: bool
        config: LLMConfig

    class ConfigPresetCreate(ConfigPresetBase):
        config_data: GlobalConfigSchema # Модель, объединяющая всё выше
    ```

### 3. Обновление логики сервиса Presets

- [ ] **Обновить `backend/app/services/presets.py` (или где лежит логика):**
  - Убрать логику проверки существования `model_config_id` при создании пресета.
  - Убедиться, что валидация JSON структуры происходит через Pydantic схемы при входе в API.

### 4. Миграция БД

- [ ] **Создать новую миграцию Alembic:**
  - Поскольку данные не важны: `alembic revision --autogenerate -m "refactor_presets_json"`
  - Убедиться, что миграция удаляет таблицы `model_configs`, `embedding_configs` и изменяет `config_presets`.
  - Применить миграцию: `alembic upgrade head`.

---

## Фаза 2: Frontend (React / Effector / TypeScript)

### 1. Обновление типов и API

- [ ] **Обновить типы в `frontend/src/entities/llm-config/types.ts` (или `index.ts`):**

  - Удалить интерфейсы `ModelConfig`, `EmbeddingConfig` как самостоятельные сущности с ID.
  - Обновить интерфейс `ConfigPreset`: заменить поля `*_id` на поле `config_data` (или развернуть его структуру в типе).
  - Создать интерфейс для структуры настроек (похожий на то, что было в ModelConfig, но без ID).

- [ ] **Очистить API слой:**
  - Удалить `frontend/src/entities/llm-config/model/model-configs.ts`
  - Удалить `frontend/src/entities/llm-config/model/embedding-configs.ts`
  - Убрать их из экспортов.

### 2. Рефакторинг стора `presets.ts`

- [ ] Убедиться, что `presetsModel` загружает и хранит полные объекты пресетов с новой структурой.

### 3. Рефакторинг Feature: `api-settings`

Это самая объемная часть. Логика "сборки" пресета из кусков удаляется.

- [ ] **Обновить `frontend/src/features/api-settings/model/api-settings-model.ts`:**

  - Удалить сэмплы, которые слушали загрузку `modelConfigs`.
  - Удалить `findConfig` логику.
  - Формы редактирования (Main, RAG и т.д.) теперь должны принимать **часть данных** из активного пресета, а при сохранении — вызывать обновление **всего пресета** (patch).

- [ ] **Обновить UI компоненты:**
  - **`frontend/src/features/api-settings/ui/model-config-form.tsx`**:
    - Больше не создает новый конфиг модели.
    - Просто редактирует переданный объект настроек.
  - **`frontend/src/features/api-settings/ui/embedding-config-form.tsx`**:
    - Аналогично, редактирует настройки эмбеддинга внутри пресета.
  - **`frontend/src/features/api-settings/ui/blocks/*.tsx`**:
    - Компоненты-блоки (Main Model, RAG Block) должны получать данные напрямую из `activePreset.config_data.main_model` и т.д.

### 4. Проверка

- [ ] Убедиться, что создание нового пресета создает запись с валидным JSON.
- [ ] Убедиться, что переключение пресетов корректно обновляет все формы на экране.
- [ ] Проверить сохранение изменений (PUT запрос должен отправлять обновленный JSON).

мне нужно продумать правильную структуру данных для моего проекта.
в чем суть, это хранение настроек апи для llm.

1. основная модель: провайдер (опенроутер, и другие, но сейчас только опенроутер), название модели, токен (множественный выбор, можно сохранять несколько токенов, токены сохраняются уникально для провайдера, можно менять название токенов, сам токен не должен быть виден), вероятные другие настройки, возможные специфичные настройки для ставщика, отдельно настройки семплеров и прочее.
2. опционально поле (можно включить чек боксом и выключить), модель для работы с rag: все те же самые настройки
3. опционально поле (можно включить чек боксом и выключить), модель для системной работы (по сути гард который будет делать какие либо проверки, чекать согласованность действий и прочее): все те же самые настройки
4. опционально поле (можно включить чек боксом и выключить), модель для сторителлинга, которая будет писать финальный аутпут: все те же самые настройки
5. эмбединг: выбор провайдера (олама и опенроутер), выбор модели. если нужны иные настройки для эбедингов которые обязательны, добавь их.
   пояснение по поводу опциональный полей: я делаю ролевой текстовый ллм движок для написания и игры в различные истории. Будет агентная работа. Основная модель, эта та которая будет использоваться по дефолту если другие модели не выбраны. модель для сторителлинга, это модель которая будет делать аутпут который увидет юзер у себя на экране. модели 2 и 3 я не уверен что это нужно разделять, возможно нужно добавить какой либо еще вид модели.
   в общем что можно придумать? подумай, возможно задай мне вопросы. Мне нужно за раннее продумать структуру так, что бы ее потом не пришлось переписывать. Она была адаптивна для расширения, добавления новых провайдеров и так далее.

Отлично, теперь картина ясна! Предлагаю следующую структуру:

## Концептуальная архитектура

### 1. Базовые сущности

```
Provider (справочник провайдеров)
├── id
├── name (openrouter, ollama, openai, anthropic...)
├── type (llm | embedding)
├── requires_api_key
└── specific_config_schema (JSON schema для специфичных настроек провайдера)

Token (хранилище токенов)
├── id
├── user_id
├── provider_id
├── name (user-friendly название, например "My OpenRouter - Main")
├── encrypted_token
├── is_active
└── created_at

Model (справочник доступных моделей)
├── id
├── provider_id
├── model_identifier (например "anthropic/claude-3.5-sonnet")
├── display_name
├── type (llm | embedding)
└── supports (массив: ["chat", "completion", "function_calling"])
```

### 2. Конфигурация моделей

```
ModelConfig (переиспользуемая конфигурация модели)
├── id
├── name (для идентификации, например "Fast GPT-4")
├── provider_id
├── model_id
├── token_ids[] (массив токенов для fallback/rotation)
├── token_selection_strategy (random | sequential | failover)
├── sampler_settings (JSON)
│   ├── temperature
│   ├── top_p
│   ├── top_k
│   ├── max_tokens
│   ├── frequency_penalty
│   ├── presence_penalty
│   └── custom_params (для будущих параметров)
└── provider_specific_settings (JSON, валидируется по schema из Provider)
```

### 3. Preset (пресет пользователя)

```
ConfigPreset
├── id
├── user_id
├── name
├── description
├── is_default
├── main_model_config_id (обязательно)
├── rag_model_config_id (опционально)
├── rag_enabled
├── guard_model_config_id (опционально)
├── guard_enabled
├── storytelling_model_config_id (опционально)
├── storytelling_enabled
├── embedding_config_id (обязательно)
├── fallback_strategy (JSON)
│   ├── use_main_for_unset (если RAG не выбран, использовать main)
│   ├── model_fallback_order[] (порядок попытки моделей при ошибке)
│   └── timeout_settings
└── created_at
```

### 4. Story Configuration (конфигурация конкретной истории)

```
StoryConfig
├── id
├── story_id
├── user_id
├── based_on_preset_id (ссылка на исходный пресет)
├── overrides (JSON, содержит только измененные параметры)
│   ├── main_model_config_override
│   ├── rag_model_config_override
│   ├── guard_model_config_override
│   ├── storytelling_model_config_override
│   └── embedding_config_override
└── updated_at
```

### 5. Embedding Configuration

```
EmbeddingConfig
├── id
├── name
├── provider_id (ollama | openrouter)
├── model_id
├── token_ids[] (для провайдеров требующих токены)
├── dimensions (если нужно указывать)
├── batch_size
└── provider_specific_settings (JSON)
```

## Ключевые преимущества структуры:

1. **ModelConfig как переиспользуемый блок** - одну конфигурацию модели можно использовать в разных ролях (main, rag, guard, storytelling)

2. **Наследование с переопределением** - StoryConfig хранит только измененные параметры, остальное берется из preset

3. **Гибкий fallback** - токены и модели имеют свои стратегии fallback

4. **Расширяемость** - JSON поля для custom параметров, schema validation для провайдеров

5. **Безопасность** - токены отдельно, с шифрованием, можно ротировать

## Пример работы:

1. Юзер создает preset "My RPG Setup"
2. Выбирает main_model: GPT-4 с temperature 0.7
3. Включает storytelling_model: Claude Sonnet с temperature 0.9
4. RAG и Guard оставляет выключенными (используется main)
5. Начинает историю с этим preset
6. В процессе игры меняет temperature main модели на 0.8
7. Изменение сохраняется в StoryConfig.overrides
8. Может сохранить как новый preset "My RPG Setup v2"

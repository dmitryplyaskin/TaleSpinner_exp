# TaleSpinner Exp

Экспериментальный проект на Python 3.12+ с использованием современного стека технологий для AI-разработки.

## Технологический стек

*   **FastAPI** (Веб-фреймворк)
*   **LiteLLM** (Универсальный интерфейс для LLM)
*   **ChromaDB** (Векторная база данных)
*   **LangGraph** (Оркестрация агентов)
*   **SQLModel** (ORM на базе Pydantic и SQLAlchemy)
*   **Alembic** (Миграции базы данных)
*   **Jinja2** (Шаблонизатор)

## Установка и запуск

Проект использует **Poetry** для управления зависимостями.

### 1. Установка зависимостей

```bash
poetry install
```

### 2. Настройка окружения

Создайте файл `.env` в **корне репозитория** (рядом с `backend/` и `frontend/`).
Для удобства можно скопировать `env.example` → `.env` и отредактировать.

```ini
# Пример .env
DATABASE_URL=sqlite:///./talespinner.db

# Current mode: модели управляются через env
MODELS_FROM_ENV_ONLY=true

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODELS=anthropic/claude-3.5-sonnet,openai/gpt-4o-mini
# OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

# Ollama (Embedding)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### 3. База данных

Применение миграций:

```bash
poetry run alembic upgrade head
```

Создание новой миграции (после изменения моделей):

```bash
poetry run alembic revision --autogenerate -m "Описание изменений"
```

### 4. Запуск сервера

```bash
poetry run uvicorn app.main:app --reload
```

Сервер будет доступен по адресу: http://127.0.0.1:8000
Документация API: http://127.0.0.1:8000/docs

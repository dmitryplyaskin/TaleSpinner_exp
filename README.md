# TaleSpinner Exp (Monorepo)

Это монорепозиторий экспериментального AI-проекта.

## Структура

*   `backend/` - Серверная часть (FastAPI, Python 3.12+, LangGraph, ChromaDB)
*   `frontend/` - Клиентская часть (В разработке)

## Работа с проектом

### Backend

Все команды для бэкенда выполняются из директории `backend`:

```bash
cd backend
poetry install
poetry run task dev
```

### Переменные окружения (.env)

Файл `.env` должен лежать **в корне репозитория** (рядом с `backend/` и `frontend/`).
Можно скопировать `env.example` → `.env`.

Подробнее см. [backend/README.md](backend/README.md).


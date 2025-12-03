from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create db tables
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to TaleSpinner API",
        "docs": "/docs",
        "stack": [
            "FastAPI", "LiteLLM", "ChromaDB", "LangGraph", "SQLModel", "Jinja2"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


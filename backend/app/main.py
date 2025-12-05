from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.users import router as users_router
from app.api.v1.providers import router as providers_router
from app.api.v1.tokens import router as tokens_router
from app.api.v1.model_configs import router as model_configs_router
from app.api.v1.embedding_configs import router as embedding_configs_router
from app.api.v1.presets import router as presets_router
from app.api.v1.stories import router as stories_router
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
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routers
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(providers_router, prefix=settings.API_V1_STR)
app.include_router(tokens_router, prefix=settings.API_V1_STR)
app.include_router(model_configs_router, prefix=settings.API_V1_STR)
app.include_router(embedding_configs_router, prefix=settings.API_V1_STR)
app.include_router(presets_router, prefix=settings.API_V1_STR)
app.include_router(stories_router, prefix=settings.API_V1_STR)

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


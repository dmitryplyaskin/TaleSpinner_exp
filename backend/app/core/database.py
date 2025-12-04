from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# check_same_thread=False is needed only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, echo=True, connect_args=connect_args)

def init_db():
    # Import models so they are registered on metadata before create_all
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session


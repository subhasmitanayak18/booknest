from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app import models
from app.routers import auth


app = FastAPI(title="BookNest API")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Welcome to BookNest API"}


@app.get("/test-db")
def test_db():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"database": result.scalar()}
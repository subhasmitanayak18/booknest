from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app import models
from app.routers import auth, books, shelves, loans, activity, websocket, dashboard


app = FastAPI(title="BookNest API")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(shelves.router)
app.include_router(loans.router)
app.include_router(activity.router)
app.include_router(websocket.router)
app.include_router(dashboard.router)
@app.get("/")
def root():
    return {"message": "Welcome to BookNest API"}


@app.get("/test-db")
def test_db():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"database": result.scalar()}
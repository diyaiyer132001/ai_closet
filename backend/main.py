from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import engine, get_db, Base
import models  # noqa: F401 — registers models with Base so create_all sees them

load_dotenv()

# Create database tables on startup (no-op if they already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Closet API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/items")
def list_items(db: Session = Depends(get_db)):
    items = db.query(models.ClothingItem).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "color": item.color,
            "description": item.description,
            "tags": item.tags,
            "image_path": item.image_path,
            "created_at": item.created_at,
        }
        for item in items
    ]
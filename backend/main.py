import json
import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import engine, get_db, Base, SessionLocal
import models  # noqa: F401 — registers models with Base so create_all sees them
from pydantic import BaseModel

from ai import analyze_clothing_image, suggest_outfit

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

CACHE_FILE = os.path.join(UPLOAD_DIR, "analysis_cache.json")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE) as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}


def _save_cache(cache: dict) -> None:
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


# ---------------------------------------------------------------------------
# Startup sync
# ---------------------------------------------------------------------------

def sync_uploads_to_db() -> None:
    """Rebuild the DB from the uploads folder.

    - Images already in analysis_cache.json are inserted directly (no API call).
    - New images are analyzed by Claude, cached, then inserted.
    - Images removed from the folder are dropped from the DB.
    """
    cache = _load_cache()

    image_files = sorted(
        f for f in os.listdir(UPLOAD_DIR)
        if os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS
    )

    # Analyze any images not yet cached
    cache_dirty = False
    for filename in image_files:
        if filename not in cache:
            path = os.path.join(UPLOAD_DIR, filename)
            print(f"[startup] New image — analyzing: {filename}")
            try:
                metadata = analyze_clothing_image(path)
                cache[filename] = metadata
                cache_dirty = True
                print(f"[startup] Cached: {filename} → {metadata.get('name')}")
            except Exception as e:
                print(f"[startup] Analysis failed for {filename}: {e}")

    if cache_dirty:
        _save_cache(cache)

    # Wipe and rebuild the DB
    db = SessionLocal()
    try:
        db.query(models.ClothingItem).delete()
        db.commit()

        for filename in image_files:
            metadata = cache.get(filename, {})
            tags = metadata.get("tags", [])
            db.add(models.ClothingItem(
                image_path=f"uploads/{filename}",
                name=metadata.get("name"),
                category=metadata.get("category"),
                color=metadata.get("color"),
                description=metadata.get("description"),
                tags=json.dumps(tags) if isinstance(tags, list) else tags,
            ))

        db.commit()
        print(f"[startup] DB synced — {len(image_files)} item(s)")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    sync_uploads_to_db()
    yield


app = FastAPI(title="Lookbook Edit API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/items")
def list_items(db: Session = Depends(get_db)):
    items = db.query(models.ClothingItem).all()
    return [_serialize(item) for item in items]


@app.post("/items/upload", status_code=201)
async def upload_item(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(dest, "wb") as f:
        f.write(contents)

    # Save to DB first so the upload is never lost if AI fails
    item = models.ClothingItem(image_path=f"uploads/{filename}")
    db.add(item)
    db.commit()
    db.refresh(item)

    # Analyze and cache so future restarts don't re-hit the API
    try:
        metadata = analyze_clothing_image(dest)
        item.name = metadata.get("name")
        item.category = metadata.get("category")
        item.color = metadata.get("color")
        item.description = metadata.get("description")
        tags = metadata.get("tags", [])
        item.tags = json.dumps(tags) if isinstance(tags, list) else tags

        cache = _load_cache()
        cache[filename] = metadata
        _save_cache(cache)

        db.commit()
        db.refresh(item)
    except Exception as e:
        print(f"[AI] Analysis failed for item {item.id}: {e}")

    return _serialize(item)


class SuggestRequest(BaseModel):
    query: str


@app.post("/suggest")
def suggest(body: SuggestRequest, db: Session = Depends(get_db)):
    all_items = db.query(models.ClothingItem).all()
    serialized = [_serialize(item) for item in all_items]

    result = suggest_outfit(body.query, serialized)

    recommended_ids = set(result.get("recommended_ids", []))
    recommended_items = [s for s in serialized if s["id"] in recommended_ids]

    return {
        "suggestion": result["suggestion"],
        "items": recommended_items,
    }


@app.post("/items/{item_id}/analyze")
def analyze_item(item_id: int, db: Session = Depends(get_db)):
    """Re-run AI analysis on an existing item. Updates the cache."""
    item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.image_path or not os.path.exists(item.image_path):
        raise HTTPException(status_code=404, detail=f"Image file not found at {item.image_path}")

    try:
        metadata = analyze_clothing_image(item.image_path)
        item.name = metadata.get("name")
        item.category = metadata.get("category")
        item.color = metadata.get("color")
        item.description = metadata.get("description")
        tags = metadata.get("tags", [])
        item.tags = json.dumps(tags) if isinstance(tags, list) else tags

        filename = os.path.basename(item.image_path)
        cache = _load_cache()
        cache[filename] = metadata
        _save_cache(cache)

        db.commit()
        db.refresh(item)
        return {"item": _serialize(item), "ai_metadata": metadata, "error": None}
    except Exception as e:
        return {"item": _serialize(item), "ai_metadata": None, "error": str(e)}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize(item: models.ClothingItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "color": item.color,
        "description": item.description,
        "tags": item.tags,
        "image_path": item.image_path,
        "created_at": item.created_at,
    }
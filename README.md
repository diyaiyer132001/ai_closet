# AI Closet

A web app that catalogs your clothing with AI and suggests outfits for any occasion.

Upload photos of your clothes → an AI vision model detects and describes each item → browse your closet → ask "what should I wear to a Broadway show?" and get a personalized suggestion based on what you actually own.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) + Material UI |
| Backend | Python + FastAPI |
| Database | SQLite (local) |
| File storage | Local filesystem |
| AI | Claude (Anthropic) — vision + chat |

---

## Prerequisites

- **Python 3.11+** — `python3 --version`
- **Node 18+** — `node --version`
- **npm** — comes with Node

---

## Local Setup

### 1. Clone and enter the repo

```bash
git clone <repo-url>
cd ai_closet
```

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # macOS / Linux
# venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Create your .env file from the example
cp .env.example .env
# Open .env and fill in your ANTHROPIC_API_KEY
```

### 3. Frontend

```bash
cd frontend
npm install
```

---

## Running Locally

Open **two terminal tabs** — one for each server.

**Terminal 1 — Backend**

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.
Interactive API docs are available at `http://localhost:8000/docs`.

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (get one at console.anthropic.com) |
| `DATABASE_URL` | SQLAlchemy DB URL — default `sqlite:///./closet.db` |
| `UPLOAD_DIR` | Where uploaded images are saved — default `uploads` |

The `.env` file is gitignored and should never be committed.

---

## How Local Storage & Caching Works

### Images

Uploaded photos are saved to `backend/uploads/` using a UUID filename (e.g. `a3f9c2d1-....jpg`). This folder is gitignored — images live only on your local machine.

### AI Analysis Cache

Every time an image is analyzed by Claude, the result (name, category, color, description, tags) is written to `backend/uploads/analysis_cache.json`. This file maps each image filename to its metadata:

```json
{
  "a3f9c2d1-....jpg": {
    "name": "navy blazer",
    "category": "outerwear",
    "color": "navy blue",
    "description": "...",
    "tags": ["formal", "layering"]
  }
}
```

### Startup Sync

Every time the backend starts, it:

1. Scans `backend/uploads/` for image files
2. Checks `analysis_cache.json` for each one
   - **Already cached** → uses the stored metadata, no API call
   - **Not in cache** → sends the image to Claude, stores the result
3. Wipes the database and rebuilds it from the cache

This means:
- **Restarting is cheap** — no duplicate API calls for images you've already uploaded
- **The DB always matches the folder** — deleting an image file removes it from the app on next restart
- **New images are picked up automatically** — drop an image into `uploads/` and restart to add it without going through the upload UI

### Re-analyzing an item

If Claude got something wrong, you can correct it without re-uploading. Open `http://localhost:8000/docs`, find `POST /items/{item_id}/analyze`, and run it with the item's ID. This calls Claude again, updates the DB, and overwrites the cache entry for that image.

You can also manually edit `analysis_cache.json` directly — it's plain JSON. Changes take effect on the next restart.

---

## Project Structure

```
ai_closet/
├── backend/
│   ├── main.py              # FastAPI app, routes, startup sync
│   ├── ai.py                # Claude vision analysis + outfit suggestions
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # Database models
│   ├── requirements.txt
│   ├── .env.example         # Template for environment variables
│   └── uploads/             # Clothing photos + analysis_cache.json (gitignored)
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   └── Nav.tsx
│       └── pages/
│           ├── Closet.tsx   # Browsable clothing grid with filters
│           ├── Upload.tsx   # Photo upload with AI analysis
│           └── Suggest.tsx  # Outfit suggestion chat
├── .gitignore
├── PLAN.md
└── README.md
```
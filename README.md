# AI Closet

A web app that catalogs your clothing with AI and suggests outfits for any occasion.

Upload photos of your clothes → an AI vision model detects and describes each item → browse your closet → ask "what should I wear to a Broadway show?" and get a personalized suggestion based on what you actually own.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
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

## Project Structure

```
ai_closet/
├── backend/
│   ├── main.py          # FastAPI app and routes
│   ├── database.py      # SQLAlchemy setup (added in Phase 2)
│   ├── requirements.txt
│   ├── .env.example     # Template for environment variables
│   └── uploads/         # Saved clothing photos (gitignored)
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   └── Nav.tsx
│       └── pages/
│           ├── Closet.tsx
│           ├── Upload.tsx
│           └── Suggest.tsx
├── .gitignore
├── PLAN.md              # Full project plan and phase breakdown
└── README.md
```

---

## Development Phases

See [PLAN.md](PLAN.md) for the full breakdown. Current progress:

- [x] Phase 1 — Project scaffolding
- [ ] Phase 2 — Database schema & file storage
- [ ] Phase 3 — Photo upload pipeline
- [ ] Phase 4 — AI clothing detection
- [ ] Phase 5 — Closet grid UI
- [ ] Phase 6 — Outfit suggestion chat
- [ ] Phase 7 — Polish
- [ ] Phase 8 — Cloud deployment
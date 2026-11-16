# HRIDYA AI (हृदय)

Mental-wellness screening, support and therapist matching.

| Layer | Stack | Folder |
|---|---|---|
| Frontend | React 19 + Vite | `frontend/` |
| Backend | FastAPI + SQLAlchemy | `backend/` |
| Database | MySQL 8, 12 tables | `database/` |
| ML | XGBoost (91.95 % accuracy) | `ml/` |

## Run it

```bat
:: 1. backend
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload          :: http://127.0.0.1:8000/docs

:: 2. frontend (new terminal)
cd frontend
npm install
npm run dev                        :: http://localhost:5173
```

Demo accounts (seeded on first start): `aditi@hridya.ai`, `ananya@hridya.ai`,
password `Hridya@123`.

Configuration lives in `backend/.env` (copy `.env.example`). The checked-in
`.env` points at SQLite so the API runs immediately; switch
`DATABASE_URL` to MySQL for the real schema.

**Full walkthrough, architecture and viva notes: [`backend/README.md`](backend/README.md).**

## What works end to end

* Register / login (bcrypt + JWT), patients and therapists
* Five-question screening → XGBoost prediction → stored result + explanation
* Therapist directory served from MySQL (verified profiles only)
* Chat companion through Gemini, with crisis detection and offline fallback
* 12-table schema created automatically, plus demo seed data

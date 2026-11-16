# HRIDYA AI — Backend Guide (FastAPI)

This README is written for someone who has to **run it, explain it, and defend it**.
Every section maps to real code in this folder, so you can open the file and point at it.

---

## 1. What the backend actually does

One process, four jobs:

```
React (Vite :5173)
        │  JSON over HTTP + JWT
        ▼
┌──────────────────────────────────────────────────────────────┐
│ FastAPI (:8000)                                              │
│                                                              │
│  routers/          thin HTTP layer: validate → call → return  │
│  services/         the thinking: auth, ML, explanations, AI   │
│  models/           SQLAlchemy ORM = the 12 MySQL tables       │
│  schemas/          Pydantic = request/response contracts      │
│  database/         engine, session per request, seed data     │
└──────────────────────────────────────────────────────────────┘
        │                    │                     │
        ▼                    ▼                     ▼
   MySQL (12 tables)   XGBoost .joblib      Gemini / MedGemma
```

Request lifecycle for `POST /screening/submit`:

1. **CORS middleware** checks the browser origin.
2. **Pydantic** validates the body → a typo or an age of 500 never reaches your code (422).
3. **Router** derives the model's 17 features from the 5 answers.
4. **MLService** encodes the row, calls XGBoost, returns class + probabilities.
5. **MedGemmaService** writes the explanation (or the local rule-based writer).
6. **SQLAlchemy** stores session, responses and result in one transaction.
7. A typed `PredictionResponse` goes back to React.

---

## 2. Setup from zero (Windows)

### 2.1 Python environment

```bat
cd hridya-ai\hridya-ai\backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

> The repo already contains a working `.venv` on this machine. Create your own
> if you move the project — a venv is not meant to be committed.

### 2.2 MySQL

MySQL 8 is already installed as the `MySQL80` service. Create the database and a
dedicated user (never ship an app on `root`):

```sql
-- mysql -u root -p
CREATE DATABASE IF NOT EXISTS mental_health_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'hridya'@'localhost' IDENTIFIED BY 'ChangeMe_123!';
GRANT ALL PRIVILEGES ON mental_health_db.* TO 'hridya'@'localhost';
FLUSH PRIVILEGES;
```

You do **not** have to run `database/schema.sql` by hand: the app creates the
tables from the ORM on startup. Running the SQL file is still fine — the ORM
uses the same table and column names, so both agree.

### 2.3 Configure

```bat
copy .env.example .env
```

Then edit `.env`:

```ini
DATABASE_URL=mysql+pymysql://hridya:ChangeMe_123%21@127.0.0.1:3306/mental_health_db
JWT_SECRET_KEY=<paste a random 64-char hex string>
```

Two things that trip people up:

* **Special characters in the password must be URL-encoded** (`!` → `%21`, `@` → `%40`).
* If you leave `DATABASE_URL` empty, the app builds one from `DB_USER`, `DB_PASSWORD`,
  `DB_HOST`, `DB_PORT`, `DB_NAME` — either style works.

For a quick demo without MySQL, keep `DATABASE_URL=sqlite:///./hridya_dev.sqlite3`.
The ORM is portable; only the SQL dialect changes.

### 2.4 Run

```bat
uvicorn main:app --reload
```

* API: <http://127.0.0.1:8000>
* Swagger UI (click and test every endpoint): <http://127.0.0.1:8000/docs>
* Health check: <http://127.0.0.1:8000/health>

On first start the log shows the model loading and the seed data being inserted.
Seeded accounts (password `Hridya@123`):

| Role | Email |
|---|---|
| patient | `aditi@hridya.ai` (phone `9876543210`) |
| therapist | `ananya@hridya.ai` |
| therapist | `vikram@hridya.ai` |

Three therapists are `verified`; one (`meera@hridya.ai`) is `pending`, which is
how the directory filter is proven to work.

### 2.5 Frontend

```bat
cd ..\frontend
npm install
npm run dev
```

Vite runs on <http://localhost:5173>; the app calls `http://127.0.0.1:8000`.
Both origins are already in `CORS_ORIGINS`.

---

## 3. The folder map

| Path | Responsibility | Open it when… |
|---|---|---|
| `main.py` | app object, lifespan, CORS, `/health` | the server will not start |
| `config.py` | every setting, `.env` parsing, DB URL | changing ports/keys/paths |
| `database/session.py` | engine + one session per request | DB connection errors |
| `database/init_db.py` | `create_all` + idempotent seed | adding seed data |
| `models/` | 12 ORM tables + enums | adding a column |
| `schemas/` | Pydantic in/out contracts | a 422 response |
| `routers/` | endpoints | adding a route |
| `services/` | auth, ML, MedGemma, Gemini | changing behaviour |
| `ml_models/` | model + feature schema | model questions |

The 12 tables are split across three modules on purpose:
`models/user.py` (1–4), `models/questionnaire.py` (5–7, 10–12), `models/chat.py` (8–9).
`models/__init__.py` imports them all so `Base.metadata` knows the full schema.

---

## 4. Authentication, explained in one screen

```python
# 1. register: password -> bcrypt hash (never stored in plain text)
user.password_hash = hash_password(payload.password)

# 2. login: constant-time comparison
verify_password(payload.password, user.password_hash)

# 3. issue a signed token
create_access_token(user.user_id, user.role.value)
#    payload = {"sub": "7", "role": "user", "iat": ..., "exp": ...}
#    signature = HMAC-SHA256(payload, JWT_SECRET_KEY)
```

Any protected route declares `user: CurrentUser`. FastAPI resolves the
`HTTPBearer` credentials, `decode_access_token` verifies the signature and
expiry, then `db.get(User, id)` loads the row. A tampered token fails the
signature check → 401. No session table is needed.

Why bcrypt and not SHA-256? SHA-256 is fast, which is exactly wrong for
passwords: an attacker can try billions per second. bcrypt is deliberately slow
and salted, so the same password produces a different hash per user.

**Authorisation**, not just authentication: every chat session and assessment
route compares `row.user_id` with `user.user_id` and returns 403 otherwise.
Therapist listing additionally filters `verification_status = 'verified'` in SQL.

---

## 5. The ML layer

### 5.1 The contract

`ml_models/hridya_screening_model.joblib` is an `XGBClassifier` trained on
143,256 merged survey records. It reports **91.95 %** test accuracy.

Because it was trained on a pandas DataFrame, it stored the exact feature names
and their order. `MLService` reads `feature_names_in_` at load time and always
rebuilds rows in that order — passing columns in another order raises an
XGBoost feature-name error.

| # | Model column | API field | Type | Model importance |
|---|---|---|---|---|
| 1 | Family History of Mental Illness | `family_history` | No/Yes | 0.004 |
| 2 | Work/Study Hours | `work_study_hours` | 0–24 | 0.021 |
| 3 | Academic Pressure | `academic_pressure` | 0–5 | 0.076 |
| 4 | Dietary Habits | `dietary_habits` | Healthy/Moderate/Unhealthy | 0.026 |
| 5 | Work Pressure | `work_pressure` | 0–5 | 0.041 |
| 6 | Sleep Duration | `sleep_duration` | 5 bands | 0.014 |
| 7 | Financial Stress | `financial_stress` | 0–10 | 0.040 |
| 8 | Study Satisfaction | `study_satisfaction` | 0–5 | 0.015 |
| 9 | CGPA | `cgpa` | 0–10 | 0.004 |
| 10 | Job Satisfaction | `job_satisfaction` | 0–5 | 0.032 |
| 11 | Gender | `gender` | Female/Male/Other | 0.003 |
| 12 | Working Professional or Student | `working_status` | Student/Working Professional | 0.118 |
| 13 | Age | `age` | 10–100 | **0.381** |
| 14 | City | `city` | text | 0.003 |
| 15 | Profession | `profession` | text | 0.008 |
| 16 | Have you ever had suicidal thoughts ? | `suicidal_thoughts` | No/Yes | **0.212** |
| 17 | Degree | `degree` | text | 0.005 |

### 5.2 Encoding — and the honest caveat

Categorical columns were label-encoded at training time. `LabelEncoder` sorts
categories alphabetically and assigns 0, 1, 2…, so `MLService` rebuilds the same
mapping from `feature_schema.json` (`sorted(categories)`), and unknown values
fall back to the schema default instead of crashing.

**The original notebook did not save its encoders**, so codes for the
free-text identity columns (City, Profession, Degree — together 1.6 % of model
importance) are a best-effort reconstruction. Everything that drives the
prediction (age, suicidal thoughts, working status, pressures, sleep) is exact.
`ml/src/train.py` now writes `hridya_encoders.joblib`; drop it into
`backend/ml_models/` and the service uses the real encoders automatically
(`/health` reports `"encoding_source": "training-bundle"`). That is the fix, and
it is a good thing to mention in a viva: *known limitation + concrete remedy*.

### 5.3 From probabilities to a risk level

```
probabilities = model.predict_proba(row)        # e.g. [0.80, 0.18, 0.01, 0.004]
predicted     = argmax                          # class 0
severity      = Σ (class_index × probability) / 3   # 0.07 on a 0..1 scale
risk_level    = severity < 0.35 ? low : severity < 0.65 ? moderate : high
```

Why not just use the winning class? Because 60/40 between "mild" and "moderate"
is still real distress that argmax would hide. The expected-severity number uses
the whole distribution.

Two product safety rules sit on top of the model:

1. **Suicidal ideation** (`suicidal_thoughts = "Yes"`) always yields at least
   `high` risk and returns crisis helplines. Configurable via
   `ESCALATE_ON_SUICIDAL_IDEATION`.
2. **The 5-item screener can outrank the model.** Five answers cannot fill 17
   survey fields, so `/screening/submit` also totals the answers themselves
   (0–15) and takes the more severe of the two signals. Without this, someone
   answering "nearly every day" five times could get `low`, because the derived
   profile looks like a typical student.

### 5.4 The response, field by field

| Field | Meaning |
|---|---|
| `scores.predicted_class` | 0–3 class index from XGBoost |
| `scores.predicted_category` | readable label for that class |
| `scores.confidence` | probability of the winning class |
| `scores.probabilities` | full distribution, all four classes |
| `risk_level` / `risk_score` | final label / model severity 0–1 |
| `drivers` | which answers differed most from a balanced profile, weighted by importance |
| `questionnaire` | rule-based total of the 5 answers (quick screening only) |
| `safety` | escalation flag + helplines |
| `explanation` + `explanation_source` | MedGemma text, or `local` fallback |
| `disclaimer` | non-diagnostic notice |

`drivers` is a transparent heuristic (distance from reference × feature
importance), **not** SHAP. Say that out loud if you present it.

---

## 6. MedGemma and Gemini

They have different jobs, and keeping them separate is the design point:

| Model | Input | Output | Where |
|---|---|---|---|
| XGBoost | 17 structured features | class + probabilities | `services/ml_service.py` |
| MedGemma | the finished score + drivers | plain-language explanation | `services/medgemma.py` |
| Gemini | conversation turns | empathetic chat reply | `services/gemini.py` |

**MedGemma** is served by your own inference server (HF TGI, vLLM, Ollama).
Set `MEDGEMMA_ENDPOINT` (e.g. `http://127.0.0.1:8080/generate`) and the service
POSTs `{"inputs": prompt, "parameters": {...}}`. With no endpoint configured it
falls back to a deterministic writer, so screenshots, demos and tests never
depend on a GPU.

**Gemini** is a hosted API. Put the key in `.env` (`GEMINI_API_KEY=`), never in
React. Without a key the chat still works through safe canned replies. Crisis
keywords are detected **before** any network call, so a provider outage cannot
swallow a helpline message.

---

## 7. Endpoint reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | model loaded? DB reachable? |
| POST | `/auth/register` | – | create user/therapist, returns JWT |
| POST | `/auth/login` | – | email **or** phone + password → JWT |
| GET | `/auth/me` | JWT | current profile |
| GET | `/questionnaires` | – | active questionnaires + questions |
| GET | `/questionnaires/{id}` | – | one questionnaire |
| POST | `/assessments` | JWT | start a session |
| POST | `/assessments/{id}/submit` | JWT | submit answers → prediction |
| GET | `/assessments` | JWT | my screening history |
| POST | `/prediction` | JWT | full 17-feature prediction |
| POST | `/screening/submit` | optional | 5-question flow (guests allowed) |
| POST | `/results/{id}/explanation` | JWT | regenerate the MedGemma text |
| GET | `/therapists` | – | filters: `specialization_id`, `session_mode`, `max_fee`, `min_experience`, `search` |
| GET | `/therapists/specializations` | – | filter options |
| GET | `/therapists/{id}` | – | one profile |
| POST | `/chat/sessions` | JWT | start a conversation |
| GET | `/chat/sessions` | JWT | my conversations |
| GET | `/chat/sessions/{id}/messages` | JWT | history |
| POST | `/chat/sessions/{id}/messages` | JWT | send + receive a reply |
| POST | `/chat/sessions/{id}/close` | JWT | close it |

Quick test with curl:

```bat
curl -X POST http://127.0.0.1:8000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"identifier\":\"aditi@hridya.ai\",\"password\":\"Hridya@123\"}"

curl -X POST http://127.0.0.1:8000/screening/submit ^
  -H "Content-Type: application/json" ^
  -d "{\"answers\":[{\"question_id\":1,\"answer_text\":\"Nearly every day\",\"answer_score\":3},{\"question_id\":2,\"answer_text\":\"Nearly every day\",\"answer_score\":3},{\"question_id\":3,\"answer_text\":\"Nearly every day\",\"answer_score\":3},{\"question_id\":4,\"answer_text\":\"More than half the days\",\"answer_score\":2},{\"question_id\":5,\"answer_text\":\"Several days\",\"answer_score\":1}]}"
```

---

## 8. How it was verified

Run `python scripts/smoke_test.py` from `backend/` (TestClient, no server needed):

* `/health` → `model_loaded: true`, `database: connected`
* register → 201 + JWT; login → 200; `/auth/me` with and without a token → 200/401
* bad token → 401; invalid payload (age 500, gender "Alien") → 422
* `/screening/submit` as guest → 200, no DB row; as user → stored assessment
* `/prediction` with 17 features → class, probabilities, drivers, explanation
* `/therapists` → only the 3 verified profiles, Meera excluded
* chat: session + message, crisis keyword → helplines, history persisted
* `python -m compileall` clean

What was **not** verified here: a live MySQL connection (the local server
requires a password only you have), a real Gemini key, and a running MedGemma
endpoint. Those paths degrade gracefully by design; set the values in `.env`
and check `/health` plus one request when you do.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Access denied for user 'root'@'localhost'` | no MySQL password in `.env` | set `DATABASE_URL` or `DB_PASSWORD` |
| `Can't connect to MySQL server` | service stopped | `net start MySQL80` (elevated prompt) |
| `/prediction` → 503 | model file missing/failed | check the startup log, `ml_models/hridya_screening_model.joblib` |
| XGBoost "older version" warning | model saved by an older XGBoost | harmless; or re-run `ml/src/train.py` |
| `blocked by CORS policy` | origin not allowed | add it to `CORS_ORIGINS` |
| `[Errno 10048]` on start | port 8000 busy | `uvicorn main:app --port 8001` |
| Login says invalid credentials | seed only runs on an empty DB | use `aditi@hridya.ai` / `Hridya@123`, or register |
| 422 on register | weak password (< 8 chars) or missing licence for therapist | read the `detail` array |

---

## 10. How to explain this project in 60 seconds

> "HRIDYA screens for mental-health risk. The React app collects five
> PHQ/GAD-style answers and sends them to a FastAPI backend. The backend derives
> the 17 features an XGBoost model was trained on, runs inference locally, and
> stores the answer set, the prediction and its explanation in MySQL across a
> 12-table schema. A separate medical language layer, MedGemma, turns the score
> into plain language, and Gemini powers the chat companion. Auth is JWT with
> bcrypt hashes; every result is scoped to its owner. Risk is the expected
> severity across all four class probabilities, with safety floors for suicidal
> ideation and for high screener totals. Everything degrades gracefully if the
> LLM providers are unavailable."

Follow-up answers you should be ready for:

* **Why a model at all?** It generalises across 143k records and gives calibrated
  probabilities instead of five hand-written thresholds.
* **Why store the model in memory?** A 1 MB joblib plus 100 trees takes real time
  to deserialise; loading once in `lifespan` makes request latency flat.
* **Why not call Gemini to make the prediction?** Structured tabular data is
  better served by a tree model: deterministic, auditable, cheap, offline.
* **What is the biggest limitation?** The encoder bundle was lost and the 5-item
  screener only approximates the survey; both are documented and both have a fix
  (`train.py` now exports encoders; a longer intake form closes the second).

---

## 11. Git workflow used here

```bat
git checkout -b feature/backend-fastapi
git add backend/
git commit -m "feat(backend): FastAPI service with XGBoost prediction and JWT auth"
git push -u origin feature/backend-fastapi
```

Then open a pull request into `main`. Keep the model file and `.env` out of
commits (see `.gitignore`); share the model through a release asset or DVC if
the repository grows.

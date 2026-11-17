from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from models import Therapist
from routers import auth, chat, screening, therapists

# Tables are created automatically on the first run, no migrations needed
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hridaya API")

# The React dev server (5173) calls this API, so CORS is kept open
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(screening.router)
app.include_router(chat.router)
app.include_router(therapists.router)


@app.get("/")
def home():
    return {"message": "Hridaya backend chal raha hai"}


# Adding 3 demo therapists, but only when the table is empty
def seed_therapists():
    db = SessionLocal()
    if db.query(Therapist).count() == 0:
        db.add_all([
            Therapist(name="Dr. Ananya Sharma", specialty="Student Exam Anxiety",
                      fee="₹750 / session", languages="Hindi, English", mode="Video Call"),
            Therapist(name="Dr. Vikramaditya Rao", specialty="Mood & Sleep Issues",
                      fee="₹900 / session", languages="English, Hindi, Kannada", mode="Video Call"),
            Therapist(name="Meera Deshmukh", specialty="Relationships & Stress",
                      fee="₹700 / session", languages="Hindi, Marathi, English", mode="Audio Call"),
        ])
        db.commit()
    db.close()


seed_therapists()

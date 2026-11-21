from pathlib import Path
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Hridaya AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)  # Creates the FastAPI app and enables CORS so the frontend on another port can call this API.

# Load XGBoost screening model once at startup from hridya-ai/ml/models/
PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "hridya_screening_model.joblib"

try:
    ml_model = joblib.load(MODEL_PATH)
except Exception as e:
    ml_model = None
    print(f"Failed to load ML model from {MODEL_PATH}: {e}")


class ChatRequest(BaseModel):
    message: str
    language: str = "hi"


class ScreeningRequest(BaseModel):
    answers: list[int]


class MLScreeningIn(BaseModel):
    family_history: int              # Family History of Mental Illness (0 or 1)
    work_study_hours: float          # Work/Study Hours
    academic_pressure: float         # Academic Pressure (0-5)
    dietary_habits: int              # Dietary Habits (encoded number)
    work_pressure: float             # Work Pressure (0-5)
    sleep_duration: float            # Sleep Duration (encoded or hours)
    financial_stress: float          # Financial Stress (1-5)
    study_satisfaction: float        # Study Satisfaction (0-5)
    cgpa: float                      # CGPA
    job_satisfaction: float          # Job Satisfaction (0-5)
    gender: int                      # Gender (encoded number)
    working_or_student: int          # Working Professional or Student (0 or 1)
    age: float                       # Age
    city: int                        # City (encoded number)
    profession: int                  # Profession (encoded number)
    suicidal_thoughts: int           # Have you ever had suicidal thoughts ? (0 or 1)
    degree: int                      # Degree (encoded number)


class MLScreeningOut(BaseModel):
    prediction: int
    risk_probability: float
    severity: str


class BookingRequest(BaseModel):
    therapist_id: int
    slot: str
    share_screening: bool = False


CRISIS_WORDS = [
    "suicide", "kill myself", "end my life", "self harm",
    "आत्महत्या", "मरना चाहता", "खुद को मार",
]
CHAT_REPLIES = {
    "hi": {
        "crisis": "मैं आपकी बात बहुत गंभीरता से सुन रही हूँ और आप अकेले नहीं हैं। कृपया अभी Tele-MANAS (14416) पर कॉल करें या किसी भरोसेमंद व्यक्ति को तुरंत बताएं। मैं यहाँ आपके साथ हूँ।",
        "sleep": "नींद की कमी मन और मस्तिष्क को और थका देती है। क्या आप 4-7-8 शांत सांस लेने की तकनीक आजमाना चाहेंगे, या हम एक छोटा तनाव मूल्यांकन करें?",
        "exam": "परीक्षा और भविष्य का दबाव स्वाभाविक है। अपनी भावनाओं को शब्दों में कहना ही सुधार का पहला कदम है। आप हमारे 2-मिनट के कल्याण मूल्यांकन से अपना तनाव स्तर समझ सकते हैं।",
        "general": "मैं आपकी बात पूरी संवेदनशीलता से सुन रही हूँ। आपकी भावनाएं महत्वपूर्ण हैं। क्या आप चाहेंगे कि हम आपके कल्याण स्तर की जांच करें ताकि सही मार्गदर्शन मिल सके?",
    },
    "en": {
        "crisis": "I hear you, and you are not alone. Please call Tele-MANAS (14416) right now or tell someone you trust immediately. I am here with you.",
        "sleep": "Disrupted sleep amplifies emotional fatigue. Would you like to try a calming 4-7-8 breathing exercise together, or do a brief stress screening?",
        "exam": "Academic and future pressure is heavy to carry alone, and naming it is the first step. A 2-minute screening can help clarify your stress level.",
        "general": "I hear you with complete empathy, and your emotions are valid. Would you like us to do a 2-minute wellness screening to chart your next steps?",
    },
}


@app.get("/")
def root():
    return {"message": "Hridaya AI API is running. Visit /docs for interactive API documentation."}


@app.get("/health")
def health():
    return {"status": "ok", "ml_model_loaded": ml_model is not None}


SLEEP_WORDS = ["neend", "sleep", "insomnia", "नींद"]
EXAM_WORDS = ["exam", "pariksha", "परीक्षा", "future", "anxiety", "चिंता"]


@app.post("/api/chat")
def chat(data: ChatRequest):
    msg = data.message.strip().lower()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    lang = data.language if data.language in CHAT_REPLIES else "en"
    for word in CRISIS_WORDS:
        if word in msg:
            return {"reply": CHAT_REPLIES[lang]["crisis"], "language": lang, "crisis": True}
    for word in SLEEP_WORDS:
        if word in msg:
            return {"reply": CHAT_REPLIES[lang]["sleep"], "language": lang, "crisis": False}
    for word in EXAM_WORDS:
        if word in msg:
            return {"reply": CHAT_REPLIES[lang]["exam"], "language": lang, "crisis": False}
    return {"reply": CHAT_REPLIES[lang]["general"], "language": lang, "crisis": False}


@app.post("/api/screening/submit")
def submit_screening(data: ScreeningRequest):
    if len(data.answers) != 5:
        raise HTTPException(status_code=400, detail="Please submit 5 answers")
    for ans in data.answers:
        if ans < 0 or ans > 3:
            raise HTTPException(status_code=400, detail="Answers must be between 0 and 3")
    total = sum(data.answers)
    max_score = 15
    wellness = max(10, round((1 - total / max_score) * 100))
    if total >= 10:
        risk_level = "severe"
        result_state = "urgent"
    elif total >= 5:
        risk_level = "moderate"
        result_state = "therapist"
    else:
        risk_level = "minimal"
        result_state = "self-care"
    return {
        "total_score": total,
        "max_score": max_score,
        "wellness_score": wellness,
        "risk_level": risk_level,
        "result_state": result_state,
    }


@app.post("/api/screening/predict", response_model=MLScreeningOut)
def predict_ml_screening(data: MLScreeningIn):
    if ml_model is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded.")

    row = {
        "Family History of Mental Illness": data.family_history,
        "Work/Study Hours": data.work_study_hours,
        "Academic Pressure": data.academic_pressure,
        "Dietary Habits": data.dietary_habits,
        "Work Pressure": data.work_pressure,
        "Sleep Duration": data.sleep_duration,
        "Financial Stress": data.financial_stress,
        "Study Satisfaction": data.study_satisfaction,
        "CGPA": data.cgpa,
        "Job Satisfaction": data.job_satisfaction,
        "Gender": data.gender,
        "Working Professional or Student": data.working_or_student,
        "Age": data.age,
        "City": data.city,
        "Profession": data.profession,
        "Have you ever had suicidal thoughts ?": data.suicidal_thoughts,
        "Degree": data.degree,
    }
    input_df = pd.DataFrame([row])

    pred = int(ml_model.predict(input_df)[0])
    prob = float(ml_model.predict_proba(input_df)[0][1])

    if prob >= 0.70:
        severity = "Elevated Strain (Support Needed)"
    elif prob >= 0.40:
        severity = "Moderate Stress Indication"
    else:
        severity = "Minimal to Mild Strain"

    return {
        "prediction": pred,
        "risk_probability": round(prob, 4),
        "severity": severity,
    }


THERAPISTS = [
    {
        "id": 1,
        "name": "Dr. Ananya Sharma",
        "credentials": "Ph.D., M.Phil (NIMHANS)",
        "role_title": "Consultant Clinical Psychologist",
        "experience": "9+ Years Clinical Practice",
        "rating": 4.9,
        "category": "student",
        "languages": ["Hindi", "English"],
        "specialties": ["Student Exam Anxiety", "Academic Burnout", "CBT"],
        "fee": 750,
        "initials": "AS",
        "next_slot": "Available Today, 4:00 PM",
    },
    {
        "id": 2,
        "name": "Dr. Vikramaditya Rao",
        "credentials": "Psy.D., Licensed Psychotherapist",
        "role_title": "Senior Neuropsychologist",
        "experience": "12+ Years Experience",
        "rating": 5.0,
        "category": "mood",
        "languages": ["English", "Hindi", "Kannada"],
        "specialties": ["Depressive Episodes", "Mindfulness (MBSR)", "Sleep & Somatic Health"],
        "fee": 900,
        "initials": "VR",
        "next_slot": "Available Tomorrow, 11:30 AM",
    },
    {
        "id": 3,
        "name": "Meera Deshmukh, LMFT",
        "credentials": "M.Sc. Counseling Psychology, RCI Registered",
        "role_title": "Counseling Psychologist & Family Specialist",
        "experience": "7+ Years Experience",
        "rating": 4.9,
        "category": "relationships",
        "languages": ["Hindi", "Marathi", "English"],
        "specialties": ["Young Adult Transitions", "Interpersonal Conflict", "ACT"],
        "fee": 700,
        "initials": "MD",
        "next_slot": "Available Thursday, 2:00 PM",
    },
]


@app.get("/api/therapists")
def list_therapists(category: str = "all"):
    try:
        if category == "all":
            return THERAPISTS
        return [t for t in THERAPISTS if t["category"] == category]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


BOOKINGS: list[dict] = []


@app.post("/api/bookings")
def create_booking(payload: BookingRequest):
    try:
        therapist = next((t for t in THERAPISTS if t["id"] == payload.therapist_id), None)
        if therapist is None:
            raise HTTPException(status_code=404, detail="Therapist not found")
        booking = {
            "id": len(BOOKINGS) + 1,
            "therapist_id": therapist["id"],
            "therapist_name": therapist["name"],
            "slot": payload.slot,
            "share_screening": payload.share_screening,
            "status": "confirmed",
        }
        BOOKINGS.append(booking)
        return booking
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    USERS: dict[str, dict] = {}

@app.post("/auth/register")
def register(payload: dict):
    mobile = str(payload.get("mobile", "")).strip()
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required")
    USERS[mobile] = {
        "id": len(USERS) + 1,
        "name": payload.get("name", "Student"),
        "mobile": mobile,
        "password": payload.get("password", ""),
    }
    return USERS[mobile]

@app.post("/auth/login")
def login(payload: dict):
    mobile = str(payload.get("mobile", "")).strip()
    user = USERS.get(mobile)
    if not user:
        # Auto-create demo user if not registered yet so live demo never blocks
        user = {"id": len(USERS) + 1, "name": "Demo User", "mobile": mobile}
        USERS[mobile] = user
    return user
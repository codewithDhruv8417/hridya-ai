from pydantic import BaseModel


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    mobile: str
    password: str
    role: str = "patient"
    license_no: str | None = None


class UserLogin(BaseModel):
    mobile: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    mobile: str
    role: str

    model_config = {"from_attributes": True}  # lets us return SQLAlchemy objects directly


# ---------- Screening ----------
class ScreeningIn(BaseModel):
    user_id: int | None = None
    answers: list[int]  # score for each question (0 to 3)


class ScreeningOut(BaseModel):
    total_score: int
    wellness_score: int
    severity: str


# ---------- Chat ----------
class ChatIn(BaseModel):
    user_id: int | None = None
    text: str
    language: str = "en"


class ChatOut(BaseModel):
    reply: str


# ---------- Appointment ----------
class AppointmentIn(BaseModel):
    user_id: int | None = None
    therapist_id: int
    therapist_name: str
    slot: str
    share_screening: bool = False
#------------ML model----------------
class MLScreeningIn(BaseModel):
    family_history: int              # Family History of Mental Illness (e.g., 0 or 1)
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
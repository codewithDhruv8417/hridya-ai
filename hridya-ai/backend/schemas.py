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

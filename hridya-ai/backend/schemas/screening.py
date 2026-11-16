"""Pydantic schemas for the screening / prediction pipeline."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Gender = Literal["Female", "Male", "Other"]
WorkingStatus = Literal["Student", "Working Professional"]
YesNo = Literal["No", "Yes"]
SleepDuration = Literal["Less than 5 hours", "5-6 hours", "7-8 hours", "More than 8 hours", "Others"]
DietaryHabits = Literal["Healthy", "Moderate", "Unhealthy"]


class ModelFeatureInput(BaseModel):
    """The 17 features the XGBoost model was trained on, in API-friendly form.

    The field names are ours; the mapping to the model's exact column names
    lives in ``ml_models/feature_schema.json``. Keeping the API names readable
    means the frontend never has to send a column called
    "Have you ever had suicidal thoughts ?".
    """

    model_config = ConfigDict(extra="forbid")

    gender: Gender = "Female"
    age: int = Field(default=22, ge=10, le=100)
    city: str = Field(default="Mumbai", max_length=100)
    working_status: WorkingStatus = "Student"
    profession: str = Field(default="Student", max_length=100)

    academic_pressure: float = Field(default=2.0, ge=0, le=5, description="0 = none, 5 = extreme")
    work_pressure: float = Field(default=0.0, ge=0, le=5, description="0 = none, 5 = extreme")
    study_satisfaction: float = Field(default=3.5, ge=0, le=5)
    job_satisfaction: float = Field(default=3.5, ge=0, le=5)
    financial_stress: float = Field(default=2.0, ge=0, le=10)
    work_study_hours: float = Field(default=8.0, ge=0, le=24)
    cgpa: float = Field(default=7.5, ge=0, le=10)

    sleep_duration: SleepDuration = "7-8 hours"
    dietary_habits: DietaryHabits = "Moderate"
    degree: str = Field(default="B.Tech", max_length=100)
    suicidal_thoughts: YesNo = "No"
    family_history: YesNo = "No"


class PredictionRequest(ModelFeatureInput):
    """POST /prediction - full, explicit 17-feature payload."""

    questionnaire_id: int | None = Field(
        default=None, description="Optional questionnaire to attach this assessment to"
    )


class PredictionScores(BaseModel):
    """Raw model output, kept separate so it is easy to log or snapshot."""

    predicted_class: int
    predicted_category: str
    confidence: float = Field(ge=0, le=1)
    probabilities: dict[str, float]
    expected_severity: float = Field(ge=0, le=1)


class FeatureDriver(BaseModel):
    """One human-readable reason behind the score (heuristic attribution)."""

    feature: str
    label: str
    value: str | int | float
    direction: Literal["elevated", "reduced", "neutral"]
    importance: float


class ModelInfo(BaseModel):
    name: str
    version: str
    algorithm: str
    accuracy: float | None = None
    features_used: list[str]


class QuestionnaireScore(BaseModel):
    """Rule-based severity of the 5 answers themselves, independent of the model.

    The short screener cannot fill the model's 17 survey fields, so its own
    total is shown next to the ML result and can raise the final risk level.
    """

    total: float
    max_score: float
    severity: Literal["low", "moderate", "high"]


class SafetyNotice(BaseModel):
    """Returned whenever product safety rules override or accompany the model."""

    escalated: bool
    reason: str | None = None
    crisis_resources: list[str] = Field(default_factory=list)


class PredictionResponse(BaseModel):
    """Response of /prediction and /screening/submit."""

    assessment_id: int | None = None
    result_id: int | None = None
    scores: PredictionScores
    risk_level: Literal["low", "moderate", "high", "unknown"]
    risk_score: float = Field(ge=0, le=1)
    explanation: str
    explanation_source: Literal["medgemma", "local", "none"]
    drivers: list[FeatureDriver] = Field(default_factory=list)
    questionnaire: QuestionnaireScore | None = None
    model: ModelInfo
    safety: SafetyNotice
    disclaimer: str


class ScreeningAnswer(BaseModel):
    """One answer from the 5-item wellness check."""

    question_id: int = Field(ge=1)
    answer_text: str = Field(min_length=1, max_length=2000)
    answer_score: float = Field(ge=0, le=3)


class QuickScreeningProfile(BaseModel):
    """Optional demographics; anything omitted is derived from the answers."""

    age: int | None = Field(default=None, ge=10, le=100)
    gender: Gender | None = None
    city: str | None = Field(default=None, max_length=100)
    working_status: WorkingStatus | None = None
    profession: str | None = Field(default=None, max_length=100)
    degree: str | None = Field(default=None, max_length=100)
    sleep_duration: SleepDuration | None = None
    dietary_habits: DietaryHabits | None = None
    work_study_hours: float | None = Field(default=None, ge=0, le=24)
    cgpa: float | None = Field(default=None, ge=0, le=10)
    financial_stress: float | None = Field(default=None, ge=0, le=10)
    suicidal_thoughts: YesNo | None = None
    family_history: YesNo | None = None


class QuickScreeningRequest(BaseModel):
    """POST /screening/submit - the 5-question flow used by the React app."""

    answers: list[ScreeningAnswer] = Field(min_length=1, max_length=20)
    questionnaire_id: int = 1
    profile: QuickScreeningProfile = Field(default_factory=QuickScreeningProfile)
    language: str = "English"


class AssessmentStartRequest(BaseModel):
    questionnaire_id: int = 1


class AssessmentStartResponse(BaseModel):
    assessment_id: int
    questionnaire_id: int
    status: str
    question_count: int


class AssessmentSubmitRequest(BaseModel):
    answers: list[ScreeningAnswer] = Field(min_length=1, max_length=50)
    profile: QuickScreeningProfile = Field(default_factory=QuickScreeningProfile)
    language: str = "English"


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    questionnaire_id: int
    question_text: str
    question_type: str
    display_order: int
    is_required: bool


class QuestionnaireOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    questionnaire_id: int
    title: str
    description: str | None
    version: str
    is_active: bool
    questions: list[QuestionOut] = Field(default_factory=list)


class AssessmentHistoryItem(BaseModel):
    """One row of GET /assessments - the user's screening history."""

    assessment_id: int
    questionnaire_id: int
    status: str
    started_at: str | None = None
    completed_at: str | None = None
    predicted_category: str | None = None
    risk_level: str | None = None
    risk_score: float | None = None


class ExplanationResponse(BaseModel):
    result_id: int
    risk_level: str
    explanation: str
    explanation_source: Literal["medgemma", "local"]

from pathlib import Path
import joblib
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Screening
from schemas import ScreeningIn, ScreeningOut, MLScreeningIn, MLScreeningOut

router = APIRouter(prefix="/screening", tags=["screening"])

# Load XGBoost model once at startup from hridya-ai/ml/models/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "hridya_screening_model.joblib"

try:
    ml_model = joblib.load(MODEL_PATH)
except Exception as e:
    ml_model = None
    print(f"Failed to load ML model from {MODEL_PATH}: {e}")


# Existing quiz-based endpoint (kept intact for your frontend)
@router.post("/submit", response_model=ScreeningOut)
def submit_screening(data: ScreeningIn, db: Session = Depends(get_db)):
    total = sum(data.answers)
    max_score = len(data.answers) * 3 or 1
    wellness = max(10, round((1 - total / max_score) * 100))

    if total >= 10:
        severity = "Elevated Strain (Support Needed)"
    elif total >= 5:
        severity = "Moderate Stress Indication"
    else:
        severity = "Minimal to Mild Strain"

    db.add(Screening(user_id=data.user_id, total_score=total,
                     wellness_score=wellness, severity=severity))
    db.commit()

    return {"total_score": total, "wellness_score": wellness, "severity": severity}


# New ML-powered prediction endpoint
@router.post("/predict", response_model=MLScreeningOut)
def predict_ml_screening(data: MLScreeningIn):
    if ml_model is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded.")

    # Map fields to the exact 17 column names & order expected by XGBClassifier
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
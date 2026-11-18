from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Screening
from schemas import ScreeningIn, ScreeningOut

router = APIRouter(prefix="/screening", tags=["screening"])


# Add up the answers, then decide the wellness score and severity
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

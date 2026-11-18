from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Appointment, Therapist
from schemas import AppointmentIn

router = APIRouter(tags=["therapists"])


# All therapists for the directory page
@router.get("/therapists")
def list_therapists(db: Session = Depends(get_db)):
    return db.query(Therapist).all()


# Save the booking - this is called from the frontend booking modal
@router.post("/appointments")
def book_appointment(data: AppointmentIn, db: Session = Depends(get_db)):
    appt = Appointment(**data.model_dump())
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {"message": "Appointment booked", "appointment_id": appt.id}

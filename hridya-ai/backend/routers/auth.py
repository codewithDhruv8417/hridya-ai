from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


# Create a new account - error if the mobile number is already registered
@router.post("/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=400, detail="Ye mobile number already registered hai")

    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)  # id lene ke liye refresh zaroori hai
    return user


# Simple login - if the password matches, send the user back
@router.post("/login", response_model=UserOut)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == data.mobile).first()
    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Mobile number ya password galat hai")
    return user

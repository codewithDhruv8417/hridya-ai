import os
from sqlalchemy import Boolean, Column, DateTime, Integer, String, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///./hridaya_proto.db"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True)
    role = Column(String(20), nullable=False, default="user")  # user | therapist | admin
    created_at = Column(DateTime, server_default=func.now())

class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    therapist_id = Column(Integer, nullable=False)
    therapist_name = Column(String(150), nullable=False)
    slot = Column(String(100), nullable=False)
    share_screening = Column(Boolean, default=False)
    status = Column(String(20), default="confirmed")
    created_at = Column(DateTime, server_default=func.now())

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    result_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    answers = Column(String(50), nullable=False)  # "2,2,2,1,2"
    total_score = Column(Integer, nullable=False)
    wellness_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

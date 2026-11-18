from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base


# Users table - both patients and therapists, the role column tells them apart
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    mobile = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)  # plain text for now, will hash it in the real project
    role = Column(String, default="patient")
    license_no = Column(String, nullable=True)


# The final screening score is saved here
class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    total_score = Column(Integer)
    wellness_score = Column(Integer)
    severity = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


# Chat history with Nurse Ananya
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    sender = Column(String)  # either 'user' or 'assistant'
    message_text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


# Therapist directory data
class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    specialty = Column(String)
    fee = Column(String)
    languages = Column(String)
    mode = Column(String)


# Appointment / booking table
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    therapist_id = Column(Integer)
    therapist_name = Column(String)
    slot = Column(String)
    share_screening = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

"""Database bootstrap: create the schema and seed demo data.

Run it directly ...

    cd backend
    python -m database.init_db

... or let the FastAPI lifespan call it on startup (`AUTO_INIT_DB=true`).

It is idempotent: existing rows are left untouched, so restarting never
duplicates seed data or overwrites a real admin's changes.
"""

from __future__ import annotations

import logging
import re

from sqlalchemy import create_engine, func, select, text
from sqlalchemy.engine import make_url

from config import settings
from database.base import Base
from database.session import SessionLocal, engine

# Importing the models package registers all 12 tables on Base.metadata.
import models  # noqa: F401,E402  (import order matters here)
from models.enums import (
    AccountStatus,
    QuestionType,
    Role,
    SessionMode,
    VerificationStatus,
)
from models.questionnaire import ModelVersion, Question, Questionnaire
from models.user import Specialization, TherapistProfile, TherapistSpecialization, User
from services.security import hash_password

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "Hridya@123"

QUESTIONS = [
    (
        1,
        "Over the past two weeks, how often have you felt little interest, pleasure, or motivation "
        "in doing everyday activities?",
    ),
    (
        2,
        "How frequently have you experienced persistent nervousness, worry, or feeling unable to "
        "stop your thoughts from racing?",
    ),
    (
        3,
        "How often have you struggled with falling asleep, restless mid-night awakening, or waking "
        "up completely exhausted?",
    ),
    (
        4,
        "How often have you felt physical fatigue, heaviness in the body, or tension in your neck, "
        "chest, or shoulders?",
    ),
    (
        5,
        "How often has emotional stress made it difficult to focus on studies, work, or relationships "
        "with close ones?",
    ),
]

SPECIALIZATIONS = [
    ("Anxiety Disorders", "Generalized anxiety, panic attacks and social anxiety management."),
    ("Depression", "Persistent low mood, emotional fatigue and loss of interest."),
    ("Stress & Burnout", "Workplace pressure, academic stress and coping strategies."),
    ("Trauma & PTSD", "Recovery support after emotional or psychological trauma."),
    ("Sleep Disorders", "Insomnia and stress-related sleep disturbance."),
]

THERAPISTS = [
    {
        "full_name": "Dr. Ananya Sharma",
        "email": "ananya@hridya.ai",
        "qualification": "M.Phil in Clinical Psychology (NIMHANS)",
        "license_number": "RCI-A10293",
        "experience_years": 9,
        "bio": "CBT-focused clinical psychologist working with student anxiety and academic burnout.",
        "consultation_fee": 1200,
        "session_mode": SessionMode.both,
        "verification_status": VerificationStatus.verified,
        "specializations": ["Anxiety Disorders", "Stress & Burnout"],
    },
    {
        "full_name": "Dr. Vikram Rao",
        "email": "vikram@hridya.ai",
        "qualification": "MD Psychiatry",
        "license_number": "MCI-B48291",
        "experience_years": 12,
        "bio": "Psychiatrist focused on mood disorders, depression and sleep problems.",
        "consultation_fee": 1500,
        "session_mode": SessionMode.online,
        "verification_status": VerificationStatus.verified,
        "specializations": ["Depression", "Sleep Disorders"],
    },
    {
        "full_name": "Dr. Kabir Menon",
        "email": "kabir@hridya.ai",
        "qualification": "Psy.D., Licensed Psychotherapist",
        "license_number": "RCI-D11842",
        "experience_years": 6,
        "bio": "Trauma-informed therapist using ACT and mindfulness-based approaches.",
        "consultation_fee": 900,
        "session_mode": SessionMode.both,
        "verification_status": VerificationStatus.verified,
        "specializations": ["Trauma & PTSD", "Stress & Burnout"],
    },
    {
        "full_name": "Meera Deshmukh",
        "email": "meera@hridya.ai",
        "qualification": "MA in Counseling Psychology",
        "license_number": "RCI-C99301",
        "experience_years": 4,
        "bio": "Helps young adults with transitions, relationships and self-esteem. Awaiting verification.",
        "consultation_fee": 800,
        "session_mode": SessionMode.online,
        "verification_status": VerificationStatus.pending,
        "specializations": ["Anxiety Disorders"],
    },
]


def _create_mysql_database_if_missing() -> None:
    """`CREATE DATABASE` cannot run inside a connection to that same database."""
    if not re.fullmatch(r"[A-Za-z0-9_]+", settings.db_name):
        raise ValueError("DB_NAME may only contain letters, digits and underscores")

    url = make_url(settings.sqlalchemy_url)
    server_engine = create_engine(url.set(database=""), pool_pre_ping=True)
    with server_engine.connect() as connection:
        connection.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        connection.commit()
    server_engine.dispose()
    logger.info("MySQL database %s is ready", settings.db_name)


def _seed_questionnaire(db) -> None:
    if db.scalar(select(func.count(Questionnaire.questionnaire_id))) > 0:
        return

    questionnaire = Questionnaire(
        title="Hridaya Wellness Check",
        description=(
            "Five-item screening covering mood, anxiety, sleep, somatic fatigue and coping, "
            "informed by PHQ-9 and GAD-7 domains."
        ),
        version="1.0",
        is_active=True,
    )
    db.add(questionnaire)
    db.flush()

    for order, question_text in QUESTIONS:
        db.add(
            Question(
                questionnaire_id=questionnaire.questionnaire_id,
                question_text=question_text,
                question_type=QuestionType.multiple_choice,
                display_order=order,
                is_required=True,
            )
        )
    logger.info("Seeded questionnaire + %d questions", len(QUESTIONS))


def _seed_model_version(db) -> None:
    existing = db.scalar(select(ModelVersion).where(ModelVersion.model_name == settings.model_name))
    if existing:
        return

    db.add(
        ModelVersion(
            model_name=settings.model_name,
            model_version=settings.model_version,
            algorithm="XGBoost (multi:softprob)",
            accuracy=settings.model_accuracy,
            model_path=settings.model_path,
            is_active=True,
        )
    )
    logger.info("Registered model version %s %s", settings.model_name, settings.model_version)


def _seed_specializations(db) -> dict[str, Specialization]:
    if db.scalar(select(func.count(Specialization.specialization_id))) == 0:
        for name, description in SPECIALIZATIONS:
            db.add(Specialization(specialization_name=name, description=description))
        db.flush()

    return {spec.specialization_name: spec for spec in db.scalars(select(Specialization)).all()}


def _seed_users(db, specializations: dict[str, Specialization]) -> None:
    if db.scalar(select(func.count(User.user_id))) > 0:
        return  # never overwrite an existing installation

    password_hash = hash_password(DEMO_PASSWORD)

    db.add(
        User(
            full_name="Aditi Verma",
            email="aditi@hridya.ai",
            password_hash=password_hash,
            phone="9876543210",
            role=Role.user,
            preferred_language="Hindi",
            account_status=AccountStatus.active,
        )
    )
    db.flush()

    for entry in THERAPISTS:
        therapist_user = User(
            full_name=entry["full_name"],
            email=entry["email"],
            password_hash=password_hash,
            phone=None,
            role=Role.therapist,
            preferred_language="English",
            account_status=AccountStatus.active,
        )
        db.add(therapist_user)
        db.flush()

        profile = TherapistProfile(
            user_id=therapist_user.user_id,
            qualification=entry["qualification"],
            license_number=entry["license_number"],
            experience_years=entry["experience_years"],
            bio=entry["bio"],
            consultation_fee=entry["consultation_fee"],
            session_mode=entry["session_mode"],
            verification_status=entry["verification_status"],
        )
        db.add(profile)
        db.flush()

        for specialization_name in entry["specializations"]:
            specialization = specializations.get(specialization_name)
            if specialization:
                db.add(
                    TherapistSpecialization(
                        therapist_id=profile.therapist_id,
                        specialization_id=specialization.specialization_id,
                    )
                )

    logger.info("Seeded %d demo therapists + 1 demo patient", len(THERAPISTS))


def init_database() -> None:
    """Create the database, schema and seed rows. Safe to call repeatedly."""
    if not settings.is_sqlite:
        _create_mysql_database_if_missing()

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        _seed_questionnaire(db)
        _seed_model_version(db)
        specializations = _seed_specializations(db)
        _seed_users(db, specializations)
        db.commit()

    logger.info("Database ready at %s", settings.sqlalchemy_url)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    init_database()
    print(f"\nDone. Demo accounts use the password: {DEMO_PASSWORD}")
    print("  patient   : aditi@hridya.ai")
    print("  therapist : ananya@hridya.ai")

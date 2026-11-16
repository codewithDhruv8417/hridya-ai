"""Assessment pipeline tables 5, 6, 7, 10, 11, 12.

The flow recorded by these tables is:

    questionnaire -> questions
    user starts assessment_session -> answers create assessment_responses
    ML model -> assessment_results (linked to model_versions)
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import AssessmentStatus, QuestionType, RiskLevel
from models.types import enum_column
from models.user import User


class Questionnaire(Base):
    """Table 5 - `questionnaires`: an assessment definition."""

    __tablename__ = "questionnaires"

    questionnaire_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    questions: Mapped[list[Question]] = relationship(
        back_populates="questionnaire", cascade="all, delete-orphan", order_by="Question.display_order"
    )


class Question(Base):
    """Table 6 - `questions`: one item inside a questionnaire."""

    __tablename__ = "questions"

    question_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id: Mapped[int] = mapped_column(
        ForeignKey("questionnaires.questionnaire_id"), nullable=False, index=True
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        enum_column(QuestionType, "question_type_enum"), default=QuestionType.multiple_choice
    )
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    questionnaire: Mapped[Questionnaire] = relationship(back_populates="questions")


class ModelVersion(Base):
    """Table 7 - `model_versions`: which model produced a result, and how good it was."""

    __tablename__ = "model_versions"
    __table_args__ = (UniqueConstraint("model_name", "model_version", name="uq_model_name_version"),)

    model_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_name: Mapped[str] = mapped_column(String(150), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    algorithm: Mapped[str | None] = mapped_column(String(100))
    accuracy: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    model_path: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    results: Mapped[list[AssessmentResult]] = relationship(back_populates="model")


class AssessmentSession(Base):
    """Table 10 - `assessment_sessions`: one run through a questionnaire."""

    __tablename__ = "assessment_sessions"

    assessment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    questionnaire_id: Mapped[int] = mapped_column(
        ForeignKey("questionnaires.questionnaire_id"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[AssessmentStatus] = mapped_column(
        enum_column(AssessmentStatus, "assessment_status_enum"), default=AssessmentStatus.in_progress
    )

    user: Mapped["User"] = relationship(back_populates="assessments")
    questionnaire: Mapped[Questionnaire] = relationship()
    responses: Mapped[list[AssessmentResponse]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    result: Mapped[AssessmentResult | None] = relationship(
        back_populates="assessment", uselist=False, cascade="all, delete-orphan"
    )


class AssessmentResult(Base):
    """Table 11 - `assessment_results`: the ML verdict + MedGemma explanation."""

    __tablename__ = "assessment_results"

    result_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_sessions.assessment_id"), nullable=False, unique=True
    )
    model_id: Mapped[int] = mapped_column(ForeignKey("model_versions.model_id"), nullable=False, index=True)
    predicted_category: Mapped[str | None] = mapped_column(String(100))
    prediction_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))
    risk_level: Mapped[RiskLevel] = mapped_column(
        enum_column(RiskLevel, "risk_level_enum"), default=RiskLevel.unknown
    )
    medgemma_explanation: Mapped[str | None] = mapped_column(Text)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    assessment: Mapped[AssessmentSession] = relationship(back_populates="result")
    model: Mapped[ModelVersion] = relationship(back_populates="results")


class AssessmentResponse(Base):
    """Table 12 - `assessment_responses`: one answer to one question."""

    __tablename__ = "assessment_responses"
    __table_args__ = (UniqueConstraint("assessment_id", "question_id", name="uq_assessment_question"),)

    response_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_sessions.assessment_id"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.question_id"), nullable=False, index=True)
    answer_text: Mapped[str | None] = mapped_column(Text)
    answer_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    answered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    assessment: Mapped[AssessmentSession] = relationship(back_populates="responses")
    question: Mapped[Question] = relationship()

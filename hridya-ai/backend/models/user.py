"""People and clinicians: users, therapist_profiles, specializations, junction.

Tables 1-4 of the 12-table schema.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import AccountStatus, Role, SessionMode, VerificationStatus
from models.types import enum_column

if TYPE_CHECKING:  # pragma: no cover - typing only, avoids circular imports
    from models.chat import ChatSession
    from models.questionnaire import AssessmentSession


class User(Base):
    """Table 1 - `users`: every account, whatever its role."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), index=True)
    role: Mapped[Role] = mapped_column(enum_column(Role, "role_enum"), default=Role.user, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(50), default="English")
    account_status: Mapped[AccountStatus] = mapped_column(
        enum_column(AccountStatus, "account_status_enum"), default=AccountStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # One user has at most one therapist profile (only for role == therapist).
    therapist_profile: Mapped[TherapistProfile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    # Targets are given as strings so this module never imports models.chat or
    # models.questionnaire at runtime (those modules import User, not the other
    # way round, which is what keeps the import graph acyclic).
    chat_sessions: Mapped[list] = relationship("ChatSession", back_populates="user")
    assessments: Mapped[list] = relationship("AssessmentSession", back_populates="user")

    @property
    def is_active(self) -> bool:
        return self.account_status == AccountStatus.active


class TherapistProfile(Base):
    """Table 2 - `therapist_profiles`: clinical credentials for a therapist user."""

    __tablename__ = "therapist_profiles"

    therapist_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    qualification: Mapped[str | None] = mapped_column(String(255))
    license_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    bio: Mapped[str | None] = mapped_column(Text)
    consultation_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    session_mode: Mapped[SessionMode] = mapped_column(
        enum_column(SessionMode, "session_mode_enum"), default=SessionMode.both
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        enum_column(VerificationStatus, "verification_status_enum"), default=VerificationStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="therapist_profile")
    specializations: Mapped[list[Specialization]] = relationship(
        secondary="therapist_specializations", back_populates="therapists", lazy="selectin"
    )


class Specialization(Base):
    """Table 3 - `specializations`: the clinical focus areas."""

    __tablename__ = "specializations"

    specialization_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    specialization_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    therapists: Mapped[list[TherapistProfile]] = relationship(
        secondary="therapist_specializations", back_populates="specializations"
    )


class TherapistSpecialization(Base):
    """Table 4 - `therapist_specializations`: many-to-many junction table.

    A therapist has many specializations and a specialization belongs to many
    therapists, so the relationship needs its own table. The composite primary
    key makes duplicate pairs impossible.
    """

    __tablename__ = "therapist_specializations"

    therapist_id: Mapped[int] = mapped_column(
        ForeignKey("therapist_profiles.therapist_id", ondelete="CASCADE"), primary_key=True
    )
    specialization_id: Mapped[int] = mapped_column(
        ForeignKey("specializations.specialization_id", ondelete="CASCADE"), primary_key=True
    )

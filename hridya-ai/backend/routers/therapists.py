"""Therapist directory.

Only verified therapists whose account is active are ever returned. Filtering
happens in SQL (not in Python) so it stays fast as the directory grows.
"""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.enums import AccountStatus, SessionMode, VerificationStatus
from models.user import Specialization, TherapistProfile, TherapistSpecialization, User
from schemas.therapist import SpecializationOut, TherapistListResponse, TherapistOut
from services.deps import DbSession

router = APIRouter(prefix="/therapists", tags=["Therapists"])


def _to_out(profile: TherapistProfile) -> TherapistOut:
    user = profile.user
    return TherapistOut(
        therapist_id=profile.therapist_id,
        user_id=profile.user_id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        qualification=profile.qualification,
        license_number=profile.license_number,
        experience_years=profile.experience_years or 0,
        bio=profile.bio,
        consultation_fee=float(profile.consultation_fee) if profile.consultation_fee is not None else None,
        session_mode=profile.session_mode.value if hasattr(profile.session_mode, "value") else str(profile.session_mode),
        verification_status=profile.verification_status.value
        if hasattr(profile.verification_status, "value")
        else str(profile.verification_status),
        specializations=[spec.specialization_name for spec in profile.specializations],
    )


@router.get("/specializations", response_model=list[SpecializationOut], summary="All focus areas")
def list_specializations(db: DbSession) -> list[SpecializationOut]:
    rows = db.scalars(select(Specialization).order_by(Specialization.specialization_name)).all()
    return [
        SpecializationOut(
            specialization_id=row.specialization_id,
            specialization_name=row.specialization_name,
            description=row.description,
        )
        for row in rows
    ]


@router.get("", response_model=TherapistListResponse, summary="Verified therapists with filters")
def list_therapists(
    db: DbSession,
    specialization_id: int | None = Query(default=None, description="Filter by clinical focus area"),
    session_mode: SessionMode | None = Query(default=None, description="online, offline or both"),
    max_fee: float | None = Query(default=None, ge=0, description="Maximum consultation fee"),
    min_experience: int | None = Query(default=None, ge=0, description="Minimum years of experience"),
    search: str | None = Query(default=None, max_length=100, description="Match therapist name"),
    limit: int = Query(default=50, ge=1, le=200),
) -> TherapistListResponse:
    stmt = (
        select(TherapistProfile)
        .join(User, User.user_id == TherapistProfile.user_id)
        .where(
            TherapistProfile.verification_status == VerificationStatus.verified,
            User.account_status == AccountStatus.active,
        )
        .options(selectinload(TherapistProfile.specializations), selectinload(TherapistProfile.user))
    )

    if specialization_id is not None:
        stmt = stmt.join(
            TherapistSpecialization,
            TherapistSpecialization.therapist_id == TherapistProfile.therapist_id,
        ).where(TherapistSpecialization.specialization_id == specialization_id)

    if session_mode is not None:
        # "online" should also surface therapists who offer both formats.
        allowed = [session_mode]
        if session_mode in (SessionMode.online, SessionMode.offline):
            allowed.append(SessionMode.both)
        stmt = stmt.where(TherapistProfile.session_mode.in_(allowed))

    if max_fee is not None:
        stmt = stmt.where(TherapistProfile.consultation_fee <= max_fee)
    if min_experience is not None:
        stmt = stmt.where(TherapistProfile.experience_years >= min_experience)
    if search:
        stmt = stmt.where(User.full_name.ilike(f"%{search}%"))

    stmt = stmt.order_by(TherapistProfile.experience_years.desc(), TherapistProfile.therapist_id).limit(limit)

    profiles = db.scalars(stmt).unique().all()
    therapists = [_to_out(profile) for profile in profiles]
    return TherapistListResponse(count=len(therapists), therapists=therapists)


@router.get("/{therapist_id}", response_model=TherapistOut, summary="One therapist profile")
def get_therapist(therapist_id: int, db: DbSession) -> TherapistOut:
    profile = db.scalar(
        select(TherapistProfile)
        .where(TherapistProfile.therapist_id == therapist_id)
        .options(selectinload(TherapistProfile.specializations), selectinload(TherapistProfile.user))
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")
    return _to_out(profile)

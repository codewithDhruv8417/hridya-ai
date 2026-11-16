"""Authentication and account endpoints.

    POST /auth/register  -> create an account, return a JWT
    POST /auth/login     -> exchange email/phone + password for a JWT
    GET  /auth/me        -> the profile behind the current token

The password is never stored or returned. Only its bcrypt hash goes into the
database, and `UserResponse` has no field that could expose it.
"""

import logging

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError

from config import settings
from database.session import get_db
from models.enums import AccountStatus, Role, SessionMode, VerificationStatus
from models.user import TherapistProfile, User
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from services.deps import CurrentUser, DbSession
from services.security import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.user_id, user.role.value),
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a patient or therapist account",
)
def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    email = payload.email.lower()
    duplicate = db.scalar(select(User).where(func.lower(User.email) == email))
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    if payload.phone:
        phone_taken = db.scalar(select(User).where(User.phone == payload.phone))
        if phone_taken:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This phone number is already registered")

    user = User(
        full_name=payload.full_name,
        email=email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role=Role.therapist if payload.role == "therapist" else Role.user,
        preferred_language=payload.preferred_language,
        account_status=AccountStatus.active,
    )

    if user.role == Role.therapist:
        # A therapist starts unverified: an admin must approve the licence.
        user.therapist_profile = TherapistProfile(
            qualification=payload.qualification,
            license_number=payload.license_number,
            experience_years=payload.experience_years or 0,
            bio=payload.bio,
            consultation_fee=payload.consultation_fee,
            session_mode=payload.session_mode or SessionMode.both,
            verification_status=VerificationStatus.pending,
        )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:  # unique email/licence race, or bad data
        db.rollback()
        logger.warning("Registration failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or licence number is already in use",
        ) from exc

    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse, summary="Sign in with email or phone")
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    identifier = payload.identifier.strip()
    digits = "".join(ch for ch in identifier if ch.isdigit() or ch == "+")

    user = db.scalar(
        select(User).where(
            or_(
                func.lower(User.email) == identifier.lower(),
                User.phone == digits if digits else User.phone == identifier,
            )
        )
    )

    # Same message for "no such user" and "wrong password" so the endpoint
    # cannot be used to discover which emails exist.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.account_status == AccountStatus.blocked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been blocked")
    if user.account_status == AccountStatus.inactive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")

    return _token_response(user)


@router.get("/me", response_model=UserResponse, summary="Profile of the signed-in user")
def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)

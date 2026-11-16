"""Pydantic schemas for the therapist directory."""

from pydantic import BaseModel


class SpecializationOut(BaseModel):
    specialization_id: int
    specialization_name: str
    description: str | None = None


class TherapistOut(BaseModel):
    """A verified therapist, flattened for the React directory cards."""

    therapist_id: int
    user_id: int
    full_name: str
    email: str
    phone: str | None = None
    qualification: str | None = None
    license_number: str | None = None
    experience_years: int
    bio: str | None = None
    consultation_fee: float | None = None
    session_mode: str
    verification_status: str
    specializations: list[str] = []


class TherapistListResponse(BaseModel):
    count: int
    therapists: list[TherapistOut]

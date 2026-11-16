"""Pydantic schemas for authentication and user accounts.

Pydantic models are the contract at the edge of the app. FastAPI validates the
JSON body against these classes before a single line of our business logic
runs, so routers can trust their inputs. They also shape what goes *out*:
`UserResponse` intentionally has no `password_hash` field, so a hash can never
leak into a JSON response.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from models.enums import Role, SessionMode

RoleLiteral = Literal["user", "therapist"]


class RegisterRequest(BaseModel):
    """Body of POST /auth/register."""

    full_name: str = Field(min_length=2, max_length=100, examples=["Aditi Sharma"])
    email: EmailStr = Field(examples=["aditi@example.com"])
    password: str = Field(min_length=8, max_length=72, examples=["Hridya@123"])
    phone: str | None = Field(default=None, max_length=20, examples=["9876543210"])
    role: RoleLiteral = "user"
    preferred_language: str = Field(default="English", max_length=50)

    # Only used when role == "therapist".
    qualification: str | None = Field(default=None, max_length=255)
    license_number: str | None = Field(default=None, max_length=100)
    experience_years: int | None = Field(default=0, ge=0, le=60)
    bio: str | None = Field(default=None, max_length=2000)
    consultation_fee: float | None = Field(default=None, ge=0, le=1_000_000)
    session_mode: SessionMode = SessionMode.both

    @field_validator("full_name", "preferred_language")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit() or ch == "+")
        return digits or None

    @model_validator(mode="after")
    def therapist_needs_credentials(self) -> "RegisterRequest":
        # A therapist account without a licence cannot be verified later, so we
        # reject it at the API edge instead of storing an unusable profile.
        if self.role == "therapist" and not self.license_number:
            raise ValueError("license_number is required when registering as a therapist")
        return self


class LoginRequest(BaseModel):
    """Body of POST /auth/login. `identifier` is an email OR a phone number."""

    identifier: str = Field(min_length=3, max_length=150, examples=["aditi@example.com"])
    password: str = Field(min_length=1, max_length=72)


class UserResponse(BaseModel):
    """Public view of a user. Note: no password_hash."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: Role
    preferred_language: str | None = None
    account_status: str
    created_at: datetime | None = None

    @field_validator("role", mode="before")
    @classmethod
    def role_as_string(cls, value):
        return value.value if isinstance(value, Role) else value


class TokenResponse(BaseModel):
    """What a successful login/register returns."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

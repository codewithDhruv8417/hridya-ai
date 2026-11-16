"""Controlled vocabularies shared by the database, Pydantic and the ML layer.

Storing these as Python ``str`` enums means one typo becomes an ImportError or a
422 response instead of a corrupt row. The values match ``database/schema.sql``
exactly, so the ORM and the hand-written SQL agree.
"""

from enum import Enum


class Role(str, Enum):
    user = "user"
    therapist = "therapist"
    admin = "admin"


class AccountStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    blocked = "blocked"


class SessionMode(str, Enum):
    online = "online"
    offline = "offline"
    both = "both"


class VerificationStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class QuestionType(str, Enum):
    multiple_choice = "multiple_choice"
    scale = "scale"
    text = "text"


class ChatStatus(str, Enum):
    active = "active"
    closed = "closed"


class Sender(str, Enum):
    user = "user"
    assistant = "assistant"


class AssessmentStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class RiskLevel(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    unknown = "unknown"

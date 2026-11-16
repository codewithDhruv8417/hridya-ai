"""Import every model so `Base.metadata` knows all 12 tables.

SQLAlchemy only registers a table when its class is imported. Importing this
package (e.g. `import models` in main.py) is what makes `create_all()` see the
whole schema.
"""

from models.chat import ChatMessage, ChatSession
from models.questionnaire import (
    AssessmentResponse,
    AssessmentResult,
    AssessmentSession,
    ModelVersion,
    Question,
    Questionnaire,
)
from models.user import Specialization, TherapistProfile, TherapistSpecialization, User

__all__ = [
    "User",
    "TherapistProfile",
    "Specialization",
    "TherapistSpecialization",
    "Questionnaire",
    "Question",
    "ModelVersion",
    "ChatSession",
    "ChatMessage",
    "AssessmentSession",
    "AssessmentResult",
    "AssessmentResponse",
]

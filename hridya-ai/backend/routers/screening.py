"""Questionnaires, assessments and ML prediction.

    GET  /questionnaires                    -> catalogue of active questionnaires
    GET  /questionnaires/{id}               -> questionnaire with ordered questions
    POST /assessments                       -> start a session (signed in)
    POST /assessments/{id}/submit           -> answer it, run the model, store result
    GET  /assessments                       -> my screening history
    POST /prediction                        -> full 17-feature prediction (signed in)
    POST /screening/submit                  -> 5-question quick screening (guests allowed)
    POST /results/{id}/explanation          -> re-run the MedGemma explanation

Every prediction path funnels into `_run_inference`, so the model is called in
exactly one place and every stored result has the same shape.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Sequence

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from config import settings
from database.session import get_db
from models.enums import AssessmentStatus, RiskLevel
from models.questionnaire import (
    AssessmentResponse,
    AssessmentResult,
    AssessmentSession,
    ModelVersion,
    Question,
    Questionnaire,
)
from models.user import User
from schemas.screening import (
    AssessmentHistoryItem,
    QuestionnaireScore,
    AssessmentStartRequest,
    AssessmentStartResponse,
    AssessmentSubmitRequest,
    ExplanationResponse,
    ModelInfo,
    PredictionRequest,
    PredictionResponse,
    PredictionScores,
    QuickScreeningRequest,
    SafetyNotice,
    ScreeningAnswer,
    QuestionnaireOut,
)
from services.derivation import derive_model_features, score_questionnaire
from services.deps import CurrentUser, DbSession, OptionalUser
from services.medgemma import CRISIS_RESOURCES, DISCLAIMER, explain
from services.ml_service import ModelNotLoadedError, PredictionResult, get_ml_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Screening & Prediction"])

DEFAULT_QUESTIONNAIRE_ID = 1


# --------------------------------------------------------------------------- helpers
def _ml_service():
    service = get_ml_service()
    if not service.is_loaded:
        try:
            service.load()
        except Exception as exc:  # noqa: BLE001
            logger.error("Screening model unavailable: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The screening model is not available on the server",
            ) from exc
    return service


def _ensure_default_questionnaire(db: DbSession) -> Questionnaire:
    """Fetch questionnaire 1, creating a minimal one if the DB is empty."""
    questionnaire = db.get(Questionnaire, DEFAULT_QUESTIONNAIRE_ID)
    if questionnaire:
        return questionnaire

    questionnaire = Questionnaire(
        title="Hridaya Wellness Check",
        description="Five-item screening informed by PHQ-9 and GAD-7 domains.",
        version="1.0",
        is_active=True,
    )
    db.add(questionnaire)
    db.commit()
    db.refresh(questionnaire)
    return questionnaire


def _active_model(db: DbSession) -> ModelVersion:
    model = db.scalar(
        select(ModelVersion)
        .where(ModelVersion.is_active.is_(True))
        .order_by(ModelVersion.model_id.desc())
    )
    if model:
        return model

    model = ModelVersion(
        model_name=settings.model_name,
        model_version=settings.model_version,
        algorithm="XGBoost",
        accuracy=settings.model_accuracy,
        model_path=settings.model_path,
        is_active=True,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def _resolve_answers(
    db: DbSession, questionnaire_id: int, answers: Sequence[ScreeningAnswer]
) -> list[tuple[int, str, float]]:
    """Map submitted answers to real question ids.

    The React flow numbers its questions 1-5 locally. If those ids do not match
    the database (for example after importing seed_data.sql), fall back to
    positional mapping so a demo never fails on an id mismatch.
    """
    questions = db.scalars(
        select(Question).where(Question.questionnaire_id == questionnaire_id).order_by(Question.display_order)
    ).all()
    by_id = {question.question_id: question for question in questions}

    resolved: list[tuple[int, str, float]] = []
    seen: set[int] = set()
    for index, answer in enumerate(answers):
        question = by_id.get(answer.question_id)
        if question is None and index < len(questions):
            question = questions[index]
        if question is None or question.question_id in seen:
            continue
        seen.add(question.question_id)
        resolved.append((question.question_id, answer.answer_text, answer.answer_score))
    return resolved


def _persist(
    db: DbSession,
    *,
    user_id: int,
    questionnaire_id: int,
    resolved_answers: list[tuple[int, str, float]],
    prediction: PredictionResult,
    explanation: str,
) -> tuple[int, int]:
    """Store session + responses + result in one transaction."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    session = AssessmentSession(
        user_id=user_id,
        questionnaire_id=questionnaire_id,
        status=AssessmentStatus.completed,
        completed_at=now,
    )
    db.add(session)
    db.flush()  # assigns assessment_id without committing yet

    for question_id, answer_text, answer_score in resolved_answers:
        db.add(
            AssessmentResponse(
                assessment_id=session.assessment_id,
                question_id=question_id,
                answer_text=answer_text,
                answer_score=answer_score,
            )
        )

    model = _active_model(db)
    result = AssessmentResult(
        assessment_id=session.assessment_id,
        model_id=model.model_id,
        predicted_category=prediction.predicted_category,
        prediction_score=round(prediction.confidence, 3),
        risk_level=RiskLevel(prediction.risk_level),
        medgemma_explanation=explanation,
    )
    db.add(result)
    db.commit()
    db.refresh(session)
    db.refresh(result)
    return session.assessment_id, result.result_id


RISK_ORDER = {"low": 0, "moderate": 1, "high": 2, "unknown": 0}


def _raise_risk_to(prediction: PredictionResult, floor: str) -> None:
    """Apply a safety floor (the screener said worse than the model did)."""
    if RISK_ORDER.get(floor, 0) > RISK_ORDER.get(prediction.risk_level, 0):
        prediction.risk_level = floor


def _build_response(
    prediction: PredictionResult,
    explanation: str,
    explanation_source: str,
    features: dict[str, Any],
    *,
    assessment_id: int | None = None,
    result_id: int | None = None,
    questionnaire_score: QuestionnaireScore | None = None,
) -> PredictionResponse:
    ideation = str(features.get("suicidal_thoughts", "No")).strip().lower() == "yes"
    escalated = bool(settings.escalate_on_suicidal_ideation and ideation and prediction.risk_level == "high")

    reason = None
    if ideation:
        reason = "Self-reported suicidal thoughts always trigger crisis resources, regardless of the model score."

    return PredictionResponse(
        assessment_id=assessment_id,
        result_id=result_id,
        scores=PredictionScores(
            predicted_class=prediction.predicted_class,
            predicted_category=prediction.predicted_category,
            confidence=round(prediction.confidence, 4),
            probabilities={k: round(v, 4) for k, v in prediction.probabilities.items()},
            expected_severity=round(prediction.expected_severity, 4),
        ),
        risk_level=prediction.risk_level,
        risk_score=round(prediction.risk_score, 4),
        explanation=explanation,
        explanation_source=explanation_source,
        drivers=prediction.drivers,
        questionnaire=questionnaire_score,
        model=ModelInfo(**_ml_service().model_info()),
        safety=SafetyNotice(
            escalated=escalated or prediction.risk_level == "high",
            reason=reason,
            crisis_resources=CRISIS_RESOURCES if prediction.risk_level == "high" else [],
        ),
        disclaimer=DISCLAIMER,
    )


async def _run_inference(
    features: dict[str, Any],
    language: str,
    questionnaire: QuestionnaireScore | None = None,
) -> tuple[PredictionResult, str, str]:
    service = _ml_service()
    try:
        prediction = service.predict(features)
    except ModelNotLoadedError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    # The short screener measures distress directly; the model only sees a
    # profile inferred from it. Trust whichever signal is more severe.
    if questionnaire is not None:
        _raise_risk_to(prediction, questionnaire.severity)

    explanation, source = await explain(
        prediction, features, language, questionnaire.model_dump() if questionnaire else None
    )
    return prediction, explanation, source


# --------------------------------------------------------------------------- routes
@router.get("/questionnaires", response_model=list[QuestionnaireOut], tags=["Questionnaires"])
def list_questionnaires(db: DbSession) -> list[Questionnaire]:
    return list(
        db.scalars(
            select(Questionnaire)
            .where(Questionnaire.is_active.is_(True))
            .options(selectinload(Questionnaire.questions))
            .order_by(Questionnaire.questionnaire_id)
        ).all()
    )


@router.get("/questionnaires/{questionnaire_id}", response_model=QuestionnaireOut, tags=["Questionnaires"])
def get_questionnaire(questionnaire_id: int, db: DbSession) -> Questionnaire:
    questionnaire = db.scalar(
        select(Questionnaire)
        .where(Questionnaire.questionnaire_id == questionnaire_id)
        .options(selectinload(Questionnaire.questions))
    )
    if questionnaire is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found")
    return questionnaire


@router.post("/assessments", response_model=AssessmentStartResponse, status_code=status.HTTP_201_CREATED)
def start_assessment(payload: AssessmentStartRequest, db: DbSession, user: CurrentUser) -> AssessmentStartResponse:
    questionnaire = db.get(Questionnaire, payload.questionnaire_id)
    if questionnaire is None or not questionnaire.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active questionnaire not found")

    session = AssessmentSession(
        user_id=user.user_id,
        questionnaire_id=questionnaire.questionnaire_id,
        status=AssessmentStatus.in_progress,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return AssessmentStartResponse(
        assessment_id=session.assessment_id,
        questionnaire_id=questionnaire.questionnaire_id,
        status=session.status.value,
        question_count=len(questionnaire.questions),
    )


@router.post("/assessments/{assessment_id}/submit", response_model=PredictionResponse)
async def submit_assessment(
    assessment_id: int,
    payload: AssessmentSubmitRequest,
    db: DbSession,
    user: CurrentUser,
) -> PredictionResponse:
    session = db.get(AssessmentSession, assessment_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    if session.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This assessment belongs to another user")
    if session.status == AssessmentStatus.completed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Assessment already submitted")

    resolved = _resolve_answers(db, session.questionnaire_id, payload.answers)
    features, _notes = derive_model_features(payload.answers, payload.profile)
    total, max_score, severity = score_questionnaire(payload.answers)
    questionnaire_score = QuestionnaireScore(total=total, max_score=max_score, severity=severity)
    prediction, explanation, source = await _run_inference(features, payload.language, questionnaire_score)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    session.status = AssessmentStatus.completed
    session.completed_at = now

    for question_id, answer_text, answer_score in resolved:
        existing = db.scalar(
            select(AssessmentResponse).where(
                AssessmentResponse.assessment_id == assessment_id,
                AssessmentResponse.question_id == question_id,
            )
        )
        if existing:
            existing.answer_text = answer_text
            existing.answer_score = answer_score
        else:
            db.add(
                AssessmentResponse(
                    assessment_id=assessment_id,
                    question_id=question_id,
                    answer_text=answer_text,
                    answer_score=answer_score,
                )
            )

    model = _active_model(db)
    stored = AssessmentResult(
        assessment_id=assessment_id,
        model_id=model.model_id,
        predicted_category=prediction.predicted_category,
        prediction_score=round(prediction.confidence, 3),
        risk_level=RiskLevel(prediction.risk_level),
        medgemma_explanation=explanation,
    )
    db.add(stored)
    db.commit()
    db.refresh(stored)

    return _build_response(
        prediction,
        explanation,
        source,
        features,
        assessment_id=assessment_id,
        result_id=stored.result_id,
        questionnaire_score=questionnaire_score,
    )


@router.get("/assessments", response_model=list[AssessmentHistoryItem])
def my_assessments(db: DbSession, user: CurrentUser, limit: int = 20) -> list[AssessmentHistoryItem]:
    sessions = db.scalars(
        select(AssessmentSession)
        .where(AssessmentSession.user_id == user.user_id)
        .options(selectinload(AssessmentSession.result))
        .order_by(AssessmentSession.assessment_id.desc())
        .limit(max(1, min(limit, 100)))
    ).all()

    items: list[AssessmentHistoryItem] = []
    for session in sessions:
        result = session.result
        items.append(
            AssessmentHistoryItem(
                assessment_id=session.assessment_id,
                questionnaire_id=session.questionnaire_id,
                status=session.status.value,
                started_at=session.started_at.isoformat() if session.started_at else None,
                completed_at=session.completed_at.isoformat() if session.completed_at else None,
                predicted_category=result.predicted_category if result else None,
                risk_level=result.risk_level.value if result else None,
                risk_score=float(result.prediction_score) if result and result.prediction_score is not None else None,
            )
        )
    return items


@router.post("/prediction", response_model=PredictionResponse, summary="Full 17-feature ML prediction")
async def predict(payload: PredictionRequest, db: DbSession, user: CurrentUser) -> PredictionResponse:
    questionnaire = (
        db.get(Questionnaire, payload.questionnaire_id)
        if payload.questionnaire_id
        else _ensure_default_questionnaire(db)
    )
    if questionnaire is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found")

    features = payload.model_dump(exclude={"questionnaire_id"})
    prediction, explanation, source = await _run_inference(features, "English")

    assessment_id, result_id = _persist(
        db,
        user_id=user.user_id,
        questionnaire_id=questionnaire.questionnaire_id,
        resolved_answers=[],
        prediction=prediction,
        explanation=explanation,
    )
    return _build_response(
        prediction,
        explanation,
        source,
        features,
        assessment_id=assessment_id,
        result_id=result_id,
    )


@router.post("/screening/submit", response_model=PredictionResponse, summary="Quick 5-question screening")
async def quick_screening(
    payload: QuickScreeningRequest, db: DbSession, user: OptionalUser
) -> PredictionResponse:
    questionnaire = db.get(Questionnaire, payload.questionnaire_id) or _ensure_default_questionnaire(db)

    features, _notes = derive_model_features(payload.answers, payload.profile)
    total, max_score, severity = score_questionnaire(payload.answers)
    questionnaire_score = QuestionnaireScore(total=total, max_score=max_score, severity=severity)
    prediction, explanation, source = await _run_inference(features, payload.language, questionnaire_score)

    assessment_id: int | None = None
    result_id: int | None = None
    if user is not None:
        # Guests still get their result; it is only stored for signed-in users.
        resolved = _resolve_answers(db, questionnaire.questionnaire_id, payload.answers)
        assessment_id, result_id = _persist(
            db,
            user_id=user.user_id,
            questionnaire_id=questionnaire.questionnaire_id,
            resolved_answers=resolved,
            prediction=prediction,
            explanation=explanation,
        )

    return _build_response(
        prediction,
        explanation,
        source,
        features,
        assessment_id=assessment_id,
        result_id=result_id,
        questionnaire_score=questionnaire_score,
    )


@router.post("/results/{result_id}/explanation", response_model=ExplanationResponse)
async def regenerate_explanation(
    result_id: int, db: DbSession, user: CurrentUser, language: str = "English"
) -> ExplanationResponse:
    stored = db.get(AssessmentResult, result_id)
    if stored is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    session = db.get(AssessmentSession, stored.assessment_id)
    if session is None or session.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This result belongs to another user")

    responses = db.scalars(
        select(AssessmentResponse).where(AssessmentResponse.assessment_id == session.assessment_id)
    ).all()
    answers = [
        ScreeningAnswer(question_id=r.question_id, answer_text=r.answer_text or "", answer_score=float(r.answer_score or 0))
        for r in responses
    ]
    if answers:
        features, _ = derive_model_features(answers)
    else:
        features = {}

    service = _ml_service()
    prediction = service.predict(features)
    questionnaire = None
    if answers:
        total, max_score, severity = score_questionnaire(answers)
        questionnaire = QuestionnaireScore(total=total, max_score=max_score, severity=severity).model_dump()
    text, source = await explain(prediction, features, language, questionnaire)

    stored.medgemma_explanation = text
    db.commit()

    return ExplanationResponse(
        result_id=result_id,
        risk_level=stored.risk_level.value,
        explanation=text,
        explanation_source=source,
    )

"""Risk explanations: MedGemma when available, a deterministic writer otherwise.

MedGemma is a medical-domain language model. It is used **only** to put the
already-computed numeric risk into plain language; it never sees raw model
weights and never changes the prediction. That separation is deliberate: the
classifier decides, the language model explains.

If no MedGemma endpoint is configured the service produces a structured,
rule-based explanation from the same drivers. The app therefore always returns
something useful, and tests never depend on a GPU being available.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from config import settings
from services.ml_service import PredictionResult

logger = logging.getLogger(__name__)

CRISIS_RESOURCES = [
    "Tele-MANAS (India, 24x7 toll-free): 14416 or 1800-891-4416",
    "KIRAN Mental Health Helpline (India, 24x7): 1800-599-0019",
    "If you are in immediate danger, call 112 or go to the nearest emergency department.",
]

DISCLAIMER = (
    "This is an assistive screening summary produced by a statistical model. It is not a medical "
    "diagnosis, and it cannot replace an assessment by a qualified mental health professional."
)

_RISK_GUIDANCE = {
    "low": (
        "Your responses sit in a manageable range right now. Protecting sleep, movement and "
        "regular contact with people you trust keeps that stability in place."
    ),
    "moderate": (
        "Your responses point to a level of strain that deserves attention. A short course of "
        "structured support, such as a counsellor or a guided stress programme, tends to help "
        "before things get heavier."
    ),
    "high": (
        "Your responses suggest a high level of distress. Please treat this as a signal to speak "
        "with a qualified professional soon rather than waiting for it to pass on its own."
    ),
}


def _driver_sentence(drivers: list[dict]) -> str:
    if not drivers:
        return "No single answer stood out; your responses were close to a typical low-risk profile."

    parts = []
    for driver in drivers[:3]:
        direction = "higher than" if driver["direction"] == "elevated" else "lower than"
        parts.append(f"{driver['label'].lower()} ({driver['value']}) is {direction} a typical balanced profile")
    return "The strongest signals were: " + "; ".join(parts) + "."


def build_local_explanation(
    result: PredictionResult,
    language: str = "English",
    questionnaire: dict[str, Any] | None = None,
) -> str:
    """Deterministic explanation built from the prediction, no external call."""
    risk = result.risk_level
    confidence_pct = round(result.confidence * 100)
    parts: list[str] = []

    # The 5-item screener and the model can disagree, because only a handful of
    # the model's features can be derived from five answers. Say so plainly
    # instead of printing two contradictory sentences.
    disagrees = (
        questionnaire is not None
        and questionnaire.get("severity") in {"moderate", "high"}
        and result.predicted_class == 0
    )
    if disagrees:
        parts.append(
            f"Your answers total {questionnaire['total']:g} out of {questionnaire['max_score']:g}, "
            f"which is in the {questionnaire['severity']} range."
        )
        parts.append(
            f"The statistical model reads {result.predicted_category.lower()} with "
            f"{confidence_pct}% confidence, but it only receives a profile inferred from five "
            f"answers, so the overall risk level follows the stronger of the two signals ({risk})."
        )
    else:
        parts.append(
            f"The screening model placed your responses in the '{result.predicted_category}' band "
            f"with {confidence_pct}% confidence, which maps to an overall {risk} risk level."
        )

    parts.append(_driver_sentence(result.drivers))
    parts.append(_RISK_GUIDANCE.get(risk, _RISK_GUIDANCE["moderate"]))
    if risk == "high":
        parts.append("If you have thoughts of harming yourself, please contact one of the helplines below today.")
    if language.lower().startswith("hindi"):
        parts.append("(यह सारांश सांख्यिकीय मॉडल पर आधारित है, कोई चिकित्सीय निदान नहीं।)")
    return " ".join(parts)


def _build_prompt(
    result: PredictionResult, language: str, questionnaire: dict[str, Any] | None = None
) -> str:
    drivers = "\n".join(
        f"- {d['label']}: {d['value']} ({d['direction']}, model importance {d['importance']})"
        for d in result.drivers
    ) or "- no single dominant driver"
    probabilities = ", ".join(f"class {k}: {round(v * 100, 1)}%" for k, v in result.probabilities.items())

    screener_line = ""
    if questionnaire:
        screener_line = (
            f"Self-reported screener total: {questionnaire['total']:g}/"
            f"{questionnaire['max_score']:g} ({questionnaire['severity']})\n"
        )

    return (
        "You are a medical text interpreter supporting a mental-health screening tool.\n"
        "Write a short explanation (120-170 words) of the risk score below for the person who "
        "completed the screening.\n\n"
        "Rules:\n"
        "1. Never diagnose, never prescribe, never mention medication.\n"
        "2. Explain what the score means and which reported factors drove it.\n"
        "3. Give 2-3 concrete, low-risk next steps.\n"
        "4. If the risk level is high, advise contacting a professional promptly.\n"
        "5. Use plain, warm language. Do not mention model names, probabilities arrays, or SHAP.\n"
        "6. Do not add a disclaimer; the application appends one.\n\n"
        f"Language: {language}\n"
        f"Predicted band: {result.predicted_category}\n"
        f"Risk level: {result.risk_level} (severity score {result.risk_score:.2f} on a 0-1 scale)\n"
        f"{screener_line}"
        f"Class probabilities: {probabilities}\n"
        f"Driving factors:\n{drivers}\n"
    )


def _extract_generated_text(payload: dict[str, Any]) -> str | None:
    """Accept the common inference-server response shapes."""
    if isinstance(payload.get("generated_text"), str):
        return payload["generated_text"]
    if isinstance(payload.get("choices"), list) and payload["choices"]:
        choice = payload["choices"][0]
        if isinstance(choice.get("message"), dict):
            return choice["message"].get("content")
        if isinstance(choice.get("text"), str):
            return choice["text"]
    return None


async def explain(
    result: PredictionResult,
    features: dict[str, Any],
    language: str = "English",
    questionnaire: dict[str, Any] | None = None,
) -> tuple[str, str]:
    """Return (explanation, source) where source is 'medgemma' or 'local'.

    Never raises: a language-model outage must not break a screening result.
    """
    if not settings.medgemma_endpoint:
        return build_local_explanation(result, language, questionnaire), "local"

    body = {
        "inputs": _build_prompt(result, language, questionnaire),
        "parameters": {
            "max_new_tokens": settings.medgemma_max_new_tokens,
            "temperature": 0.3,
            "return_full_text": False,
        },
    }
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=settings.medgemma_timeout_seconds) as client:
            response = await client.post(settings.medgemma_endpoint, json=body, headers=headers)
            response.raise_for_status()
            text = _extract_generated_text(response.json())
            if text and text.strip():
                return text.strip(), "medgemma"
            logger.warning("MedGemma returned an empty completion; using local explanation")
    except Exception as exc:  # noqa: BLE001 - graceful degradation is the point
        logger.warning("MedGemma request failed (%s); using local explanation", exc)

    return build_local_explanation(result, language, questionnaire), "local"

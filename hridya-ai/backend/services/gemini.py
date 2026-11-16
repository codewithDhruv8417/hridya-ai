"""Empathetic conversational replies via the Gemini API.

Design rules that matter for a wellness product:

* The API key stays on the server. The browser never sees it.
* A system instruction pins the persona ("Nurse Ananya") and forbids diagnosis,
  medication advice and emergency substitution.
* Crisis language is detected locally and answered with real helplines *before*
  the model is called, so a model outage can never swallow a safety message.
* If Gemini is unavailable the caller still gets a warm, useful fallback reply.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from config import settings
from services.medgemma import CRISIS_RESOURCES

logger = logging.getLogger(__name__)

CRISIS_KEYWORDS = (
    "suicide", "kill myself", "end my life", "want to die", "self harm", "self-harm",
    "hurt myself", "no reason to live", "आत्महत्या", "मरना चाहता", "जीना नहीं",
)

SYSTEM_INSTRUCTION = (
    "You are Nurse Ananya, an empathetic mental-wellness companion inside the HRIDYA AI app. "
    "You are warm, calm and specific; you never sound clinical or rushed. "
    "Rules you must always follow:\n"
    "1. Never diagnose a condition, never name medication, never adjust a dose.\n"
    "2. Reflect what the person said in one sentence before responding, and validate the feeling.\n"
    "3. Keep replies under 120 words, ask at most one question, and offer one concrete coping step "
    "(breathing, grounding, sleep hygiene, journaling, a walk, or talking to a professional).\n"
    "4. If the person mentions self-harm, suicide or immediate danger, encourage them to contact "
    "emergency services or a helpline right now and give the numbers.\n"
    "5. Never claim to be a human. Never promise confidentiality beyond the app's real policy.\n"
    "6. Reply in the language the user writes in. Keep the tone gentle, never cheerful about pain."
)

FALLBACK_REPLIES = {
    "crisis": (
        "I'm really glad you told me this. What you're carrying sounds extremely heavy, and you "
        "deserve support right now, not later. Please reach out to a crisis line this moment — "
        + "; ".join(CRISIS_RESOURCES)
    ),
    "sleep": (
        "That sounds exhausting, and sleepless nights make everything else harder to hold. "
        "One thing that often helps is a slow 4-7-8 breath: in for 4, hold for 7, out for 8, six "
        "rounds. Would you like to try a short screening afterwards to see how much strain you're under?"
    ),
    "anxiety": (
        "Thank you for putting that into words. Constant worry is genuinely draining, and it makes "
        "sense that you're tired. Try grounding your feet and naming five things you can see around "
        "you for 60 seconds. What feels most urgent about it today?"
    ),
    "default": (
        "I hear you, and what you're feeling matters. You don't have to explain it perfectly here. "
        "If it feels okay, tell me what has been weighing on you the most this week, and we can find "
        "one small step together."
    ),
}


def detect_crisis(text: str) -> bool:
    lowered = text.casefold()
    return any(keyword in lowered for keyword in CRISIS_KEYWORDS)


def fallback_reply(message: str) -> tuple[str, bool]:
    """Deterministic safe reply. Returns (text, crisis_detected)."""
    if detect_crisis(message):
        return FALLBACK_REPLIES["crisis"], True

    lowered = message.casefold()
    if any(word in lowered for word in ("sleep", "insomnia", "नींद", "neend")):
        return FALLBACK_REPLIES["sleep"], False
    if any(word in lowered for word in ("anxious", "anxiety", "panic", "worry", "चिंता", "घबराहट")):
        return FALLBACK_REPLIES["anxiety"], False
    return FALLBACK_REPLIES["default"], False


def _extract_text(payload: dict[str, Any]) -> str | None:
    candidates = payload.get("candidates") or []
    if not candidates:
        return None
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
    return text.strip() or None


async def generate_reply(
    message: str,
    history: list[dict[str, str]] | None = None,
    language: str = "English",
) -> tuple[str, str, bool]:
    """Return (reply, source, crisis_detected).

    `history` is [{"sender": "user"|"assistant", "message_text": "..."}].
    """
    crisis = detect_crisis(message)
    if crisis:
        # Safety first: answer without depending on any external service.
        return FALLBACK_REPLIES["crisis"], "fallback", True

    if not settings.gemini_api_key:
        reply, _ = fallback_reply(message)
        return reply, "fallback", False

    contents: list[dict[str, Any]] = []
    for item in (history or [])[-10:]:
        role = "user" if item.get("sender") == "user" else "model"
        text = item.get("message_text", "")
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    body = {
        "system_instruction": {"parts": [{"text": f"{SYSTEM_INSTRUCTION}\nReply in: {language}."}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "topP": 0.9, "maxOutputTokens": 400},
        "safetySettings": [
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
        ],
    }
    url = f"{settings.gemini_base_url}/models/{settings.gemini_model}:generateContent"

    try:
        async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
            response = await client.post(
                url,
                json=body,
                headers={"x-goog-api-key": settings.gemini_api_key, "Content-Type": "application/json"},
            )
            response.raise_for_status()
            text = _extract_text(response.json())
            if text:
                return text, "gemini", False
            logger.warning("Gemini returned no text (possibly blocked); using fallback")
    except Exception as exc:  # noqa: BLE001 - never fail a chat request on provider issues
        logger.warning("Gemini request failed (%s); using fallback reply", exc)

    reply, _ = fallback_reply(message)
    return reply, "fallback", False

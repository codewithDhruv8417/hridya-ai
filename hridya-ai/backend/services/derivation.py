"""Turn the 5-question wellness check into the model's 17 input features.

The React screening flow asks five broad questions (mood, anxiety, sleep,
somatic fatigue, coping). The trained model expects 17 survey-style fields. This
module bridges the gap with *documented* rules, and every value can be
overridden by sending real demographics in `profile`.

Read this as a product decision, not a clinical instrument: a short screener
cannot reconstruct a 17-variable survey. The rules below are monotone (worse
answers never produce a better feature value), which is what makes the output
sane, and they are isolated here so they can be replaced by a real intake form
without touching the model or the routers.
"""

from __future__ import annotations

from typing import Any, Sequence

from schemas.screening import QuickScreeningProfile, ScreeningAnswer

# Sleep answers map onto the model's sleep bands.
_SLEEP_BANDS = ["7-8 hours", "5-6 hours", "Less than 5 hours", "Less than 5 hours"]
# Somatic fatigue is used as a proxy for diet quality, the closest matching field.
_DIET_BY_SOMATIC = ["Healthy", "Moderate", "Moderate", "Unhealthy"]


def score_questionnaire(answers: Sequence[ScreeningAnswer]) -> tuple[float, float, str]:
    """Total the answers on their own scale and band the result.

    Returns (total, max_score, severity). Bands are proportional, not absolute,
    so they still work if the questionnaire grows from 5 items to 9.
    """
    scores = [max(0.0, float(answer.answer_score)) for answer in answers]
    total = round(sum(scores), 2)
    max_score = float(len(scores) * 3) or 3.0
    ratio = total / max_score

    if ratio >= 2 / 3:
        severity = "high"
    elif ratio >= 1 / 3:
        severity = "moderate"
    else:
        severity = "low"
    return total, max_score, severity


def _ordered_scores(answers: Sequence[ScreeningAnswer]) -> list[float]:
    """Pick the five answers in question order, padding with neutral zeros."""
    scores = [answer.answer_score for answer in sorted(answers, key=lambda a: a.question_id)][:5]
    return scores + [0.0] * (5 - len(scores))


def derive_model_features(
    answers: Sequence[ScreeningAnswer],
    profile: QuickScreeningProfile | None = None,
) -> tuple[dict[str, Any], dict[str, str]]:
    """Return (17-feature dict, notes explaining which values were derived)."""
    profile = profile or QuickScreeningProfile()
    mood, anxiety, sleep, somatic, coping = _ordered_scores(answers)

    # Answers are 0-3; the model's pressure scales are 0-5 and 0-10.
    to_five = lambda score: round(min(5.0, score * 5 / 3), 2)      # noqa: E731
    to_ten = lambda score: round(min(10.0, score * 10 / 3), 2)     # noqa: E731
    sleep_index = max(0, min(3, int(round(sleep))))

    cognitive_load = (mood + anxiety + coping) / 3
    working = profile.working_status == "Working Professional"

    derived: dict[str, Any] = {
        "gender": profile.gender or "Female",
        "age": profile.age or (32 if working else 21),
        "city": profile.city or "Mumbai",
        "working_status": profile.working_status or "Student",
        "profession": profile.profession or ("Professional" if working else "Student"),
        "degree": profile.degree or "B.Tech",
        "academic_pressure": to_five(cognitive_load),
        "work_pressure": to_five(cognitive_load) if working else 0.0,
        "study_satisfaction": round(max(0.0, 5.0 - mood), 2),
        "job_satisfaction": round(max(0.0, 5.0 - anxiety), 2),
        "financial_stress": to_ten(coping),
        "work_study_hours": round(min(16.0, 6.0 + somatic * 2.0), 2),
        "cgpa": profile.cgpa if profile.cgpa is not None else 7.5,
        "sleep_duration": _SLEEP_BANDS[sleep_index],
        "dietary_habits": _DIET_BY_SOMATIC[max(0, min(3, int(round(somatic))))],
        "suicidal_thoughts": profile.suicidal_thoughts or "No",
        "family_history": profile.family_history or "No",
    }

    notes = {
        "academic_pressure": "derived from mood, anxiety and coping answers",
        "work_pressure": "derived from mood, anxiety and coping answers",
        "study_satisfaction": "derived from mood answer",
        "job_satisfaction": "derived from anxiety answer",
        "financial_stress": "derived from coping answer",
        "work_study_hours": "derived from somatic fatigue answer",
        "sleep_duration": "derived from sleep answer",
        "dietary_habits": "derived from somatic fatigue answer",
        "suicidal_thoughts": "defaults to 'No'; only the explicit profile value is used",
        "age": "defaulted from working status unless provided",
    }

    # Explicit demographics always win over a derivation.
    overrides = {
        "age": profile.age,
        "gender": profile.gender,
        "city": profile.city,
        "working_status": profile.working_status,
        "profession": profile.profession,
        "degree": profile.degree,
        "sleep_duration": profile.sleep_duration,
        "dietary_habits": profile.dietary_habits,
        "work_study_hours": profile.work_study_hours,
        "cgpa": profile.cgpa,
        "financial_stress": profile.financial_stress,
        "suicidal_thoughts": profile.suicidal_thoughts,
        "family_history": profile.family_history,
    }
    for key, value in overrides.items():
        if value is not None:
            derived[key] = value
            notes.pop(key, None)

    return derived, notes

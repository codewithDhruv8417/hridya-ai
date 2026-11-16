"""End-to-end smoke test for the HRIDYA API.

Run from the backend folder:

    python scripts/smoke_test.py

It uses FastAPI's TestClient, so the app (and its lifespan) starts exactly as it
does under uvicorn, but no server needs to be running. It talks to whatever
database backend/.env points at and writes a few rows, so point it at a
development database, not production.
"""

import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

failures: list[str] = []


def check(label: str, response, expected: int):
    ok = response.status_code == expected
    print(f"{'PASS' if ok else 'FAIL'}  {label:<48} {response.status_code}")
    if not ok:
        failures.append(f"{label}: expected {expected}, got {response.status_code} — {response.text[:300]}")
    return response


def main() -> int:
    email = f"smoke-{uuid.uuid4().hex[:8]}@hridya.ai"

    with TestClient(app) as client:
        health = check("GET /health", client.get("/health"), 200).json()
        print("      ", health)

        register = check(
            "POST /auth/register",
            client.post(
                "/auth/register",
                json={"full_name": "Smoke Test", "email": email, "password": "Hridya@123", "role": "user"},
            ),
            201,
        )
        token = register.json().get("access_token", "")
        auth = {"Authorization": f"Bearer {token}"}

        check("POST /auth/login", client.post("/auth/login", json={"identifier": email, "password": "Hridya@123"}), 200)
        check("GET /auth/me", client.get("/auth/me", headers=auth), 200)
        check("GET /auth/me without token", client.get("/auth/me"), 401)
        check("GET /auth/me with bad token", client.get("/auth/me", headers={"Authorization": "Bearer nope"}), 401)

        questionnaires = check("GET /questionnaires", client.get("/questionnaires"), 200).json()
        print(f"       questionnaire: {questionnaires[0]['title']} ({len(questionnaires[0]['questions'])} questions)")

        answers = [
            {"question_id": 1, "answer_text": "Nearly every day", "answer_score": 3},
            {"question_id": 2, "answer_text": "More than half the days", "answer_score": 2},
            {"question_id": 3, "answer_text": "Nearly every day", "answer_score": 3},
            {"question_id": 4, "answer_text": "More than half the days", "answer_score": 2},
            {"question_id": 5, "answer_text": "Several days", "answer_score": 1},
        ]

        guest = check("POST /screening/submit (guest)", client.post("/screening/submit", json={"answers": answers}), 200)
        print("       risk:", guest.json()["risk_level"], "| explanation:", guest.json()["explanation"][:90], "...")

        authed = check(
            "POST /screening/submit (signed in)",
            client.post("/screening/submit", headers=auth, json={"answers": answers}),
            200,
        )
        print("       stored assessment_id:", authed.json()["assessment_id"])

        check(
            "POST /prediction (17 features)",
            client.post(
                "/prediction",
                headers=auth,
                json={
                    "gender": "Male",
                    "age": 34,
                    "city": "Pune",
                    "working_status": "Working Professional",
                    "profession": "Software Engineer",
                    "academic_pressure": 1,
                    "work_pressure": 5,
                    "study_satisfaction": 1,
                    "job_satisfaction": 0.5,
                    "financial_stress": 9,
                    "work_study_hours": 14,
                    "cgpa": 6.0,
                    "sleep_duration": "Less than 5 hours",
                    "dietary_habits": "Unhealthy",
                    "degree": "B.Tech",
                    "suicidal_thoughts": "Yes",
                    "family_history": "Yes",
                },
            ),
            200,
        )
        check("POST /prediction rejects invalid input", client.post("/prediction", headers=auth, json={"age": 500}), 422)
        check("GET /assessments", client.get("/assessments", headers=auth), 200)

        directory = check("GET /therapists", client.get("/therapists"), 200).json()
        print("       verified therapists:", [t["full_name"] for t in directory["therapists"]])
        check("GET /therapists filters", client.get("/therapists?session_mode=online&max_fee=1000"), 200)
        check("GET /therapists/specializations", client.get("/therapists/specializations"), 200)

        session = check("POST /chat/sessions", client.post("/chat/sessions", headers=auth, json={}), 201).json()
        session_id = session["chat_session_id"]

        reply = check(
            "POST /chat/sessions/{id}/messages",
            client.post(
                f"/chat/sessions/{session_id}/messages",
                headers=auth,
                json={"message_text": "I cannot sleep before my exams", "language": "English"},
            ),
            200,
        )
        print("       reply source:", reply.json()["source"])

        crisis = check(
            "POST crisis message",
            client.post(
                f"/chat/sessions/{session_id}/messages",
                headers=auth,
                json={"message_text": "I want to die", "language": "English"},
            ),
            200,
        )
        if not crisis.json()["crisis_detected"]:
            failures.append("Crisis detection did not fire for a suicidal message")

        check("GET /chat/sessions/{id}/messages", client.get(f"/chat/sessions/{session_id}/messages", headers=auth), 200)

    print()
    if failures:
        print(f"{len(failures)} check(s) failed:")
        for failure in failures:
            print(" -", failure)
        return 1

    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

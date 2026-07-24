"""Backend regression tests for PassMate FastAPI backend.
Endpoints tested: GET /api/health, POST /api/ai-explanation
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://a84d9224-c5f7-4586-b07f-c6eb61db1d55.preview.emergentagent.com").rstrip("/")


# Health endpoint
class TestHealth:
    def test_health_ok(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data == {"status": "ok"}


# AI explanation endpoint (Claude via emergentintegrations)
class TestAIExplanation:
    def test_ai_explanation_success(self):
        payload = {
            "question_text": "What should you do at a red traffic light?",
            "category": "Rules of the Road",
            "wrong_answer_text": "Slow down and proceed with caution",
            "correct_answer_text": "Stop and wait for green",
            "official_explanation": "You must always stop at a red light.",
        }
        r = requests.post(f"{BASE_URL}/api/ai-explanation", json=payload, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert "explanation" in data
        assert isinstance(data["explanation"], str)
        # Ensure it returned a non-trivial answer (2-3 paragraphs => >200 chars)
        assert len(data["explanation"]) > 200

    def test_ai_explanation_validation_error(self):
        # Missing required fields -> 422
        r = requests.post(f"{BASE_URL}/api/ai-explanation", json={"question_text": "x"}, timeout=10)
        assert r.status_code == 422

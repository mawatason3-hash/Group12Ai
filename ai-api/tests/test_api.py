import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app  # noqa: E402

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_members_returns_six_members():
    response = client.get("/members")
    assert response.status_code == 200
    assert len(response.json()) == 6


def test_get_member_by_id():
    response = client.get("/members/hamody")
    assert response.status_code == 200
    assert response.json()["fullName"] == "Hamody"


def test_get_unknown_member_returns_404():
    assert client.get("/members/missing").status_code == 404


def test_ask_name_query_returns_match():
    response = client.post("/ask", json={"query": "Hamody"})
    assert response.status_code == 200
    assert response.json()["matched"] is True
    assert response.json()["member"]["id"] == "hamody"
    assert response.json()["score"] >= 0.45


def test_ask_role_query_returns_match():
    response = client.post("/ask", json={"query": "Who built the FastAPI service and TF-IDF matcher?"})
    assert response.status_code == 200
    assert response.json()["matched"] is True
    assert response.json()["member"]["id"] == "alain"


def test_ask_no_match_query():
    response = client.post("/ask", json={"query": "quantum astrophysics and deep space galaxies"})
    assert response.status_code == 200
    assert response.json()["matched"] is False


def test_ask_rejects_empty_query():
    assert client.post("/ask", json={"query": ""}).status_code == 422


def test_model_info_reports_threshold_and_fingerprint():
    response = client.get("/model-info")
    assert response.status_code == 200
    assert response.json()["memberCount"] == 6
    assert response.json()["threshold"] == 0.45
    assert len(response.json()["fingerprint"]) == 64

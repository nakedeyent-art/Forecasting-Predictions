from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_operational_settings() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "maxBodyBytes" in payload


def test_analyze_validation_error_is_structured() -> None:
    response = client.post(
        "/api/decisions/analyze",
        json={
            "title": "No",
            "domain": "Strategy",
            "decision": "Too short",
            "constraints": [],
            "time_horizon": "90 days",
            "risk_tolerance": "Balanced",
            "success_metric": "Expected value",
        },
    )

    assert response.status_code == 422
    assert "detail" in response.json()

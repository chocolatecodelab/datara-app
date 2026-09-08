import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_start_conversation_sync_api():
    payload = {
        "goal_or_question": "Investigasi penurunan revenue di Jawa Timur",
        "user_id": "test_user",
    }
    res = client.post("/api/v1/conversations?sync=true", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "completed"
    assert "id" in data
    assert len(data["steps"]) >= 4
    assert len(data["insights"]) >= 1

    conv_id = data["id"]

    # Test GET /plan
    plan_res = client.get(f"/api/v1/conversations/{conv_id}/plan")
    assert plan_res.status_code == 200
    steps = plan_res.json()
    assert len(steps) >= 4
    assert steps[0]["status"] == "completed"

    # Test GET /insights
    insight_res = client.get(f"/api/v1/conversations/{conv_id}/insights")
    assert insight_res.status_code == 200
    insights = insight_res.json()
    assert len(insights) >= 1
    assert "finding" in insights[0]
    assert "confidence" in insights[0]
    assert len(insights[0]["main_drivers"]) >= 1

    # Test GET /audit
    audit_res = client.get(f"/api/v1/conversations/{conv_id}/audit")
    assert audit_res.status_code == 200
    audit = audit_res.json()
    assert audit["total_steps"] >= 4
    assert audit["total_tool_calls"] >= 3
    assert len(audit["steps"]) >= 4
    assert len(audit["steps"][0]["tool_calls"]) >= 1
    assert audit["steps"][0]["tool_calls"][0]["executed_sql"] is not None


def test_list_conversations_api():
    res = client.get("/api/v1/conversations")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

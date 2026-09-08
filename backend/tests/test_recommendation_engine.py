import pytest
from app.analytics.recommendation_engine import generate_recommendations_from_variance
from app.models.conversation import Conversation, Recommendation
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

# Ensure all tables (including newly added recommendations) exist
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_recommendation_math_and_drivers():
    sample_drivers = [
        {
            "dimension": "region",
            "value": "East Java",
            "impact_pct": -54.2,
            "previous_val": 312400,
            "current_val": 247800,
        },
        {
            "dimension": "product",
            "value": "Product Alpha (Flagship)",
            "impact_pct": -48.1,
            "previous_val": 260000,
            "current_val": 202650,
        }
    ]

    recs = generate_recommendations_from_variance(
        finding="Revenue dropped by 18% in East Java.",
        main_drivers=sample_drivers,
        confidence_baseline=0.90
    )

    assert len(recs) >= 2
    # Primary driver check
    p0 = recs[0]
    assert "East Java" in p0["title"]
    assert p0["priority"] == "P0 - Critical"
    assert p0["estimated_impact_amount"] > 0
    assert p0["estimated_impact_pct"] > 0
    assert len(p0["action_steps"]) >= 3
    assert p0["status"] == "pending_approval"

    # Secondary driver check
    p1 = recs[1]
    assert "Product Alpha (Flagship)" in p1["title"]
    assert p1["priority"] == "P1 - High"
    assert len(p1["action_steps"]) >= 2


def test_recommendation_api_workflow():
    # 1. Start a full sync conversation
    payload = {
        "goal_or_question": "Kenapa penjualan turun 18% di Jawa Timur?",
        "user_id": "test_analyst",
    }
    create_res = client.post("/api/v1/conversations?sync=true", json=payload)
    assert create_res.status_code == 201
    conv_data = create_res.json()
    conv_id = conv_data["id"]

    # 2. Test GET recommendations
    res = client.get(f"/api/v1/conversations/{conv_id}/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) >= 1

    first_rec = recs[0]
    rec_id = first_rec["id"]
    assert first_rec["status"] == "pending_approval"
    assert first_rec["estimated_impact_amount"] > 0
    assert len(first_rec["action_steps"]) >= 2

    # 3. Test Approval Gate PATCH /status
    approve_res = client.patch(
        f"/api/v1/recommendations/{rec_id}/status",
        json={"status": "approved"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 4. Test Action Step toggle
    step_id_to_toggle = first_rec["action_steps"][0]["id"]
    toggle_res = client.patch(
        f"/api/v1/recommendations/{rec_id}/action-step",
        json={"step_id": step_id_to_toggle, "completed": True}
    )
    assert toggle_res.status_code == 200
    updated_steps = toggle_res.json()["action_steps"]
    assert updated_steps[0]["completed"] is True

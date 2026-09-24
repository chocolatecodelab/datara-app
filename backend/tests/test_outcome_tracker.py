import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.conversation import Conversation, Recommendation
from app.models.memory import AgentMemory
from app.analytics.outcome_tracker import OutcomeTracker


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def setup_test_recommendation(db_session):
    org = Organization(name="Test Outcome Org")
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    conv = Conversation(
        organization_id=org.id,
        user_id="test_user",
        goal_or_question="Test Outcome Goal",
        status="completed",
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    rec = Recommendation(
        conversation_id=conv.id,
        title="Expedite Surabaya Logistics Reallocation",
        rationale="Stock reallocation to mitigate East Java inventory deficit",
        target_dimension="region:East Java",
        estimated_impact_amount=40000.0,
        estimated_impact_pct=10.0,
        priority="P0 (URGENT)",
        difficulty="Medium",
        confidence=0.92,
        status="approved",
        action_steps=[
            {"step": "Dispatch 500 units to Surabaya Hub", "pic_role": "VP of Supply Chain"}
        ],
    )
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)

    return org, conv, rec


def test_outcome_evaluation_math_and_memory_insertion(db_session, setup_test_recommendation):
    org, conv, rec = setup_test_recommendation

    # Evaluate with actual recovered amount of $44,000 (110% realization)
    result = OutcomeTracker.evaluate_outcome(
        recommendation_id=rec.id,
        db=db_session,
        actual_recovery_amount=44000.0,
        evaluation_period="30-Day Post-Intervention",
    )

    assert result.recommendation_id == rec.id
    assert result.expected_recovery_amount == 40000.0
    assert result.actual_recovery_amount == 44000.0
    assert result.realization_rate_pct == 110.0
    assert result.variance_amount == 4000.0
    assert "A+" in result.effectiveness_grade
    assert "[LEARNED HEURISTIC]" in result.learned_heuristic_text
    assert result.memory_id is not None

    # Verify memory was persisted in the database
    persisted_mem = db_session.query(AgentMemory).filter(AgentMemory.id == result.memory_id).first()
    assert persisted_mem is not None
    assert persisted_mem.category == "learned_heuristic"
    assert persisted_mem.added_by == "outcome_tracker"
    assert "Surabaya Logistics" in persisted_mem.instruction_text


def test_outcome_api_endpoints(setup_test_recommendation):
    client = TestClient(app)
    org, conv, rec = setup_test_recommendation

    # 1. Test POST /api/v1/outcomes/evaluate/{id}
    res = client.post(
        f"/api/v1/outcomes/evaluate/{rec.id}",
        json={"actual_recovery_amount": 42000.0, "evaluation_period": "30-Day Post-Intervention"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["recommendation_id"] == rec.id
    assert data["realization_rate_pct"] == 105.0
    assert data["effectiveness_grade"].startswith("A+")
    assert "memory_id" in data

    # 2. Test GET /api/v1/outcomes/summary
    summary_res = client.get(f"/api/v1/outcomes/summary?org_id={org.id}")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert sum_data["total_actions_evaluated"] >= 1
    assert sum_data["overall_realization_rate_pct"] > 0
    assert len(sum_data["top_interventions"]) > 0

import pytest
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.conversation import Conversation
from app.agent.orchestrator import AgentOrchestrator


def test_agent_orchestrator_end_to_end():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None

        # 1. Create conversation with goal
        conv = Conversation(
            organization_id=org.id,
            user_id="analyst_test",
            goal_or_question="Cari tahu kenapa revenue bulan Agustus 2026 turun dibanding Juli 2026",
            status="planning",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

        # 2. Run investigation
        completed_conv = AgentOrchestrator.run_investigation_sync(conv.id, db)

        assert completed_conv.status == "completed"
        assert len(completed_conv.steps) >= 4

        # Verify steps and tool calls recorded
        for step in completed_conv.steps:
            assert step.status == "completed"
            assert step.duration_ms is not None
            assert step.duration_ms > 0

        # Verify at least one insight was synthesized with 5 pillars
        assert len(completed_conv.insights) >= 1
        insight = completed_conv.insights[0]
        assert len(insight.finding) > 20
        assert insight.evidence_rows > 0
        assert "SUM(order_items.amount)" in insight.calculation
        assert insight.confidence >= 0.80
        assert len(insight.main_drivers) >= 1

    finally:
        db.close()

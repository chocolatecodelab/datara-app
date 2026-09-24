import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.conversation import Conversation, Recommendation
from app.analytics.proactive_monitor import ProactiveMonitor
from app.agent.action_dispatcher import ActionDispatcher

client = TestClient(app)


def test_proactive_anomaly_detection_and_investigation():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None

        # 1. Scan metrics for anomalies
        anomalies = ProactiveMonitor.scan_metrics_for_anomalies(org.id, db)
        assert len(anomalies) >= 1
        critical = [a for a in anomalies if a.severity == "CRITICAL"]
        assert len(critical) >= 1
        assert "Revenue" in critical[0].metric_name

        # 2. Run proactive scan cycle which triggers autonomous investigation
        scan_result = ProactiveMonitor.run_proactive_scan(org.id, db)
        assert scan_result.autonomous_investigation_triggered is True
        assert scan_result.conversation_id is not None

        # Verify the created conversation
        conv = db.query(Conversation).filter(Conversation.id == scan_result.conversation_id).first()
        assert conv is not None
        assert "[PROACTIVE ALERT]" in conv.goal_or_question
        assert conv.status == "completed"
        assert len(conv.steps) >= 4
        assert len(conv.insights) >= 1

    finally:
        db.close()


def test_action_dispatcher_execution():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None

        # Create sample conversation and recommendation
        conv = Conversation(
            organization_id=org.id,
            user_id="test_actor",
            goal_or_question="Test Action Plan Dispatcher",
            status="completed",
        )
        db.add(conv)
        db.commit()

        rec = Recommendation(
            conversation_id=conv.id,
            title="Fast-Track Inventory Reallocation to Surabaya Hub",
            rationale="Deficit of -20.7% detected in East Java.",
            estimated_impact_amount=42500.0,
            priority="P0 - Critical",
            action_steps=[
                {"step": "Reallocate 500 units to Surabaya warehouse", "pic_role": "Supply Chain Operations"},
                {"step": "Authorize 5% distributor rebate", "pic_role": "Regional Sales Lead"},
            ],
            status="pending_approval",
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        # Dispatch action plan
        dispatch_res = ActionDispatcher.dispatch_action_plan(rec.id, db)
        assert dispatch_res.dispatched is True
        assert "200 OK" in dispatch_res.webhook_status
        assert len(dispatch_res.tickets_created) == 2
        assert dispatch_res.tickets_created[0].ticket_id.startswith("DATARA-TKT-")
        assert dispatch_res.tickets_created[0].pic_role == "Supply Chain Operations"

        # Verify DB status updated
        db.refresh(rec)
        assert rec.status == "approved"

    finally:
        db.close()


def test_proactive_and_action_api_endpoints():
    # 1. GET /api/v1/proactive/status
    res_status = client.get("/api/v1/proactive/status")
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["watcher_status"] == "ACTIVE"
    assert data["monitored_metrics_count"] >= 1

    # 2. POST /api/v1/proactive/scan
    res_scan = client.post("/api/v1/proactive/scan")
    assert res_scan.status_code == 200
    scan_data = res_scan.json()
    assert scan_data["autonomous_investigation_triggered"] is True
    conv_id = scan_data["conversation_id"]

    # 3. Fetch recommendation from the proactive investigation and dispatch it
    res_recs = client.get(f"/api/v1/conversations/{conv_id}/recommendations")
    assert res_recs.status_code == 200
    recs = res_recs.json()
    assert len(recs) >= 1
    target_rec_id = recs[0]["id"]

    # 4. POST /api/v1/proactive/dispatch/{rec_id}
    res_dispatch = client.post(f"/api/v1/proactive/dispatch/{target_rec_id}")
    assert res_dispatch.status_code == 200
    dispatch_data = res_dispatch.json()
    assert dispatch_data["dispatched"] is True
    assert len(dispatch_data["tickets_created"]) >= 1

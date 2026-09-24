import pytest
import asyncio
from app.agent.event_stream import event_stream_manager
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.conversation import Conversation
from app.agent.orchestrator import AgentOrchestrator


@pytest.mark.asyncio
async def test_event_stream_broadcast_and_history():
    conv_id = "test-conv-stream-1"
    queue = event_stream_manager.subscribe(conv_id)

    try:
        # Broadcast some events
        event_stream_manager.broadcast_sync(conv_id, "intent", {"primary_metric": "Revenue"})
        event_stream_manager.broadcast_sync(conv_id, "step_start", {"step_order": 1})

        # History should contain both
        history = event_stream_manager.get_history(conv_id)
        assert len(history) == 2
        assert history[0]["event"] == "intent"
        assert history[1]["event"] == "step_start"

        # Queue should receive both
        assert not queue.empty()
        item1 = await queue.get()
        assert item1["event"] == "intent"
        item2 = await queue.get()
        assert item2["event"] == "step_start"

    finally:
        event_stream_manager.unsubscribe(conv_id, queue)


@pytest.mark.asyncio
async def test_event_generator_history_replay():
    conv_id = "test-conv-stream-2"

    # Pre-populate history before subscription
    event_stream_manager.broadcast_sync(conv_id, "intent", {"primary_metric": "Revenue"})
    event_stream_manager.broadcast_sync(conv_id, "plan_ready", {"steps": []})
    event_stream_manager.broadcast_sync(conv_id, "complete", {"status": "completed"})

    # Generator should replay all 3 and terminate cleanly
    events_received = []
    async for sse_chunk in event_stream_manager.event_generator(conv_id):
        events_received.append(sse_chunk)

    assert len(events_received) == 3
    assert "event: intent" in events_received[0]
    assert "event: plan_ready" in events_received[1]
    assert "event: complete" in events_received[2]


def test_orchestrator_broadcasts_full_stream():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        assert org is not None

        conv = Conversation(
            organization_id=org.id,
            user_id="stream_tester",
            goal_or_question="Investigasi revenue drop stream test",
            status="planning",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

        # Run sync investigation
        completed_conv = AgentOrchestrator.run_investigation_sync(conv.id, db)
        assert completed_conv.status == "completed"

        # Verify event history recorded all milestone events
        history = event_stream_manager.get_history(conv.id)
        assert len(history) >= 8

        event_names = [h["event"] for h in history]
        assert "intent" in event_names
        assert "plan_ready" in event_names
        assert "step_start" in event_names
        assert "step_complete" in event_names
        assert "insight_ready" in event_names
        assert "recommendations_ready" in event_names
        assert "complete" in event_names

    finally:
        db.close()

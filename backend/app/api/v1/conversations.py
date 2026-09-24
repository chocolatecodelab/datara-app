from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.conversation import Conversation, AnalysisStep, ToolCall, Insight
from app.models.organization import Organization
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    AnalysisStepResponse,
    InsightResponse,
    ToolCallResponse,
    DriverItem,
)
from app.schemas.analytics import ForecastScenarioResponse
from app.agent.orchestrator import AgentOrchestrator
from app.agent.event_stream import event_stream_manager
from app.analytics.forecasting import ForecastingEngine

router = APIRouter()



def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


def run_investigation_in_background(conversation_id: str):
    """Background task runner with its own DB session."""
    db = SessionLocal()
    try:
        AgentOrchestrator.run_investigation_sync(conversation_id, db)
    finally:
        db.close()


@router.post("", response_model=ConversationResponse, status_code=201)
def start_conversation(
    payload: ConversationCreate,
    background_tasks: BackgroundTasks,
    sync: bool = Query(True, description="Run synchronously for immediate result, or false for background/SSE stream"),
    db: Session = Depends(get_db),
):
    """
    Initiates a new investigation conversation from a business goal or natural language question.
    """
    target_org_id = payload.organization_id or get_default_org_id(db)

    conv = Conversation(
        organization_id=target_org_id,
        user_id=payload.user_id or "default_user",
        goal_or_question=payload.goal_or_question,
        status="planning",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    if sync:
        conv = AgentOrchestrator.run_investigation_sync(conv.id, db)
    else:
        background_tasks.add_task(run_investigation_in_background, conv.id)

    return conv


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    return (
        db.query(Conversation)
        .filter(Conversation.organization_id == target_org_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


@router.get("/{conversation_id}/events")
async def stream_conversation_events(conversation_id: str):
    """
    Server-Sent Events (SSE) stream for live agent execution progress.
    """
    return StreamingResponse(
        event_stream_manager.event_generator(conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{conversation_id}/plan", response_model=List[AnalysisStepResponse])
def get_conversation_plan(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    steps = (
        db.query(AnalysisStep)
        .filter(AnalysisStep.conversation_id == conversation_id)
        .order_by(AnalysisStep.step_order.asc())
        .all()
    )
    return steps


@router.get("/{conversation_id}/insights", response_model=List[InsightResponse])
def get_conversation_insights(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    insights = (
        db.query(Insight)
        .filter(Insight.conversation_id == conversation_id)
        .order_by(Insight.created_at.desc())
        .all()
    )
    return insights


@router.get("/{conversation_id}/audit")
def get_conversation_audit(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns full audit trail: list of steps with real executed SQL, tool arguments, latency, and status.
    """
    steps = (
        db.query(AnalysisStep)
        .filter(AnalysisStep.conversation_id == conversation_id)
        .order_by(AnalysisStep.step_order.asc())
        .all()
    )

    audit_steps = []
    total_sql_latency = 0
    total_tool_calls = 0

    for s in steps:
        tool_call_list = []
        for tc in s.tool_calls:
            total_tool_calls += 1
            if tc.latency_ms:
                total_sql_latency += tc.latency_ms
            tool_call_list.append({
                "id": tc.id,
                "tool_name": tc.tool_name,
                "arguments": tc.arguments,
                "executed_sql": tc.executed_sql,
                "latency_ms": tc.latency_ms,
                "status": tc.status,
                "created_at": tc.created_at,
            })

        audit_steps.append({
            "step_order": s.step_order,
            "title": s.title,
            "description": s.description,
            "status": s.status,
            "duration_ms": s.duration_ms,
            "result_summary": s.result_summary,
            "tool_calls": tool_call_list,
        })

    return {
        "conversation_id": conversation_id,
        "total_steps": len(steps),
        "total_tool_calls": total_tool_calls,
        "total_sql_latency_ms": total_sql_latency,
        "steps": audit_steps,
    }


@router.get("/{conversation_id}/forecast", response_model=ForecastScenarioResponse)
def get_conversation_forecast(
    conversation_id: str,
    months_ahead: int = Query(3, ge=1, le=6),
    db: Session = Depends(get_db),
):
    """
    Computes Level 5 What-If forecast based on conversation's active insight and root cause drivers.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    insight = db.query(Insight).filter(Insight.conversation_id == conversation_id).first()

    baseline_val = 769930.0
    current_val = 650690.0
    metric_name = "Revenue"
    drivers: List[DriverItem] = []

    if insight and insight.main_drivers:
        for d in insight.main_drivers:
            drivers.append(DriverItem(**d))

    return ForecastingEngine.predict_scenario(
        metric_name=metric_name,
        baseline_value=baseline_val,
        current_value=current_val,
        drivers=drivers,
        months_ahead=months_ahead,
    )


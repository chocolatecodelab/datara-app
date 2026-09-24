from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization
from app.schemas.proactive import (
    ProactiveStatusResponse,
    ProactiveScanResult,
    ActionDispatchResult,
)
from app.analytics.proactive_monitor import ProactiveMonitor
from app.agent.action_dispatcher import ActionDispatcher

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.get("/status", response_model=ProactiveStatusResponse)
def get_proactive_status(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Returns live state of the Level 7 Proactive Metric Watcher,
    including monitored metrics and cached anomalies.
    """
    target_org_id = org_id or get_default_org_id(db)
    return ProactiveMonitor.get_status(target_org_id, db)


@router.post("/scan", response_model=ProactiveScanResult)
def trigger_proactive_scan(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Triggers an immediate proactive health scan across semantic metrics.
    If a critical anomaly is detected, an autonomous investigation is automatically initiated.
    """
    target_org_id = org_id or get_default_org_id(db)
    return ProactiveMonitor.run_proactive_scan(target_org_id, db)


@router.post("/dispatch/{recommendation_id}", response_model=ActionDispatchResult)
def dispatch_action_plan(
    recommendation_id: str,
    webhook_url: Optional[str] = Query(None, description="Optional custom webhook URL"),
    db: Session = Depends(get_db),
):
    """
    Level 8 Action Agent Execution:
    Dispatches an approved action plan to external webhooks (Slack/ERP)
    and generates department task tickets with role assignments.
    """
    try:
        return ActionDispatcher.dispatch_action_plan(
            recommendation_id=recommendation_id,
            db=db,
            custom_webhook_url=webhook_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

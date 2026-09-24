from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization
from app.schemas.outcome import (
    OutcomeEvaluationRequest,
    OutcomeEvaluationResult,
    OutcomeAnalyticsSummary,
)
from app.analytics.outcome_tracker import OutcomeTracker

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.post("/evaluate/{recommendation_id}", response_model=OutcomeEvaluationResult)
def evaluate_recommendation_outcome(
    recommendation_id: str,
    payload: Optional[OutcomeEvaluationRequest] = Body(None),
    db: Session = Depends(get_db),
):
    """
    Level 9: Closed-Loop Outcome Evaluation.
    Evaluates real-world results against projected recovery targets,
    grades execution efficacy, and automatically saves learned heuristics
    into Agent Memory for continuous self-learning.
    """
    actual_amount = payload.actual_recovery_amount if payload else None
    period = payload.evaluation_period if (payload and payload.evaluation_period) else "30-Day Post-Intervention"
    notes = payload.notes if payload else None

    try:
        return OutcomeTracker.evaluate_outcome(
            recommendation_id=recommendation_id,
            db=db,
            actual_recovery_amount=actual_amount,
            evaluation_period=period,
            notes=notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/summary", response_model=OutcomeAnalyticsSummary)
def get_outcome_summary(
    org_id: Optional[str] = Query(None, description="Optional Organization ID"),
    db: Session = Depends(get_db),
):
    """
    Returns organization-wide outcome analytics and closed-loop learning benchmarks.
    """
    target_org_id = org_id or get_default_org_id(db)
    return OutcomeTracker.get_org_summary(target_org_id, db)

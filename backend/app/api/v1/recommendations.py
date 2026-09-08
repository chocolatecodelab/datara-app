from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.conversation import Recommendation, Conversation
from app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationStatusUpdate,
    ActionStepToggle,
)

router = APIRouter()


@router.get("/conversations/{conversation_id}/recommendations", response_model=List[RecommendationResponse])
def get_conversation_recommendations(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """Fetches all prescriptive recommendations & action plans for a conversation."""
    recs = db.query(Recommendation).filter(Recommendation.conversation_id == conversation_id).all()
    return recs


@router.patch("/recommendations/{rec_id}/status", response_model=RecommendationResponse)
def update_recommendation_status(
    rec_id: str,
    payload: RecommendationStatusUpdate,
    db: Session = Depends(get_db),
):
    """
    Human Approval Gate:
    Approve, reject, or mark action plans as in progress.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    rec.status = payload.status
    db.commit()
    db.refresh(rec)
    return rec


@router.patch("/recommendations/{rec_id}/action-step", response_model=RecommendationResponse)
def toggle_action_step_status(
    rec_id: str,
    payload: ActionStepToggle,
    db: Session = Depends(get_db),
):
    """Toggles checklist status for a specific action step item."""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    steps = list(rec.action_steps or [])
    for item in steps:
        if item.get("id") == payload.step_id:
            item["completed"] = payload.completed
            break

    rec.action_steps = steps
    # Flag modification for SQLAlchemy JSON column
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(rec, "action_steps")

    db.commit()
    db.refresh(rec)
    return rec

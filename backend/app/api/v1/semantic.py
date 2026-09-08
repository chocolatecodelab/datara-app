from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.semantic import SemanticMetric
from app.models.organization import Organization
from app.schemas.semantic import (
    SemanticMetricCreate,
    SemanticMetricUpdate,
    SemanticMetricResponse,
    MetricLookupResponse,
)
from app.semantic.engine import SemanticEngine

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.get("/metrics", response_model=List[SemanticMetricResponse])
def list_metrics(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    return db.query(SemanticMetric).filter(SemanticMetric.organization_id == target_org_id).all()


@router.post("/metrics", response_model=SemanticMetricResponse, status_code=201)
def create_metric(
    payload: SemanticMetricCreate,
    db: Session = Depends(get_db),
):
    target_org_id = payload.organization_id or get_default_org_id(db)
    metric = SemanticMetric(
        organization_id=target_org_id,
        name=payload.name,
        formula=payload.formula,
        source_table=payload.source_table,
        owner=payload.owner or "data_team",
        refresh_frequency=payload.refresh_frequency or "daily",
        allowed_dimensions=payload.allowed_dimensions,
        business_terms=payload.business_terms,
        business_rules=payload.business_rules,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


@router.get("/metrics/lookup", response_model=MetricLookupResponse)
def lookup_metric(
    term: str = Query(..., description="Business term to resolve, e.g., 'omzet' or 'sales'"),
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    result = SemanticEngine.lookup_metric(term, target_org_id, db)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Metric not found for term '{term}' in semantic layer.",
        )
    metric, confidence = result
    return MetricLookupResponse(
        matched_term=term,
        metric=SemanticMetricResponse.model_validate(metric),
        confidence=confidence,
    )


@router.get("/metrics/{metric_id}", response_model=SemanticMetricResponse)
def get_metric(
    metric_id: str,
    db: Session = Depends(get_db),
):
    metric = db.query(SemanticMetric).filter(SemanticMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Semantic metric not found.")
    return metric


@router.put("/metrics/{metric_id}", response_model=SemanticMetricResponse)
def update_metric(
    metric_id: str,
    payload: SemanticMetricUpdate,
    db: Session = Depends(get_db),
):
    metric = db.query(SemanticMetric).filter(SemanticMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Semantic metric not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(metric, key, value)

    db.commit()
    db.refresh(metric)
    return metric


@router.delete("/metrics/{metric_id}", status_code=204)
def delete_metric(
    metric_id: str,
    db: Session = Depends(get_db),
):
    metric = db.query(SemanticMetric).filter(SemanticMetric.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Semantic metric not found.")
    db.delete(metric)
    db.commit()
    return None

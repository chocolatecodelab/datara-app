from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.data_quality import (
    DataSourceQualityReport,
    DataQualitySummary,
)
from app.analytics.data_quality_agent import DataQualityAgent

router = APIRouter()


@router.get("/summary", response_model=DataQualitySummary)
def get_data_quality_summary(db: Session = Depends(get_db)):
    """
    Returns organization-wide data health index, monitored sources, and SLA status.
    """
    return DataQualityAgent.get_summary(db)


@router.get("/{ds_id}", response_model=DataSourceQualityReport)
def get_data_source_quality(ds_id: str, db: Session = Depends(get_db)):
    """
    Retrieves latest data quality profile and schema audit for a data source.
    """
    return DataQualityAgent.run_quality_audit(ds_id, db)


@router.post("/{ds_id}/scan", response_model=DataSourceQualityReport)
def run_data_source_quality_scan(ds_id: str, db: Session = Depends(get_db)):
    """
    Triggers an immediate live data quality profiling scan and schema audit.
    """
    return DataQualityAgent.run_quality_audit(ds_id, db)

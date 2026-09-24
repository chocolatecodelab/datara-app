from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ColumnQualityProfile(BaseModel):
    column_name: str
    data_type: str
    total_count: int
    null_count: int
    null_pct: float
    distinct_count: int
    is_clean: bool

    model_config = ConfigDict(from_attributes=True)


class TableQualityReport(BaseModel):
    table_name: str
    total_rows: int
    duplicates_count: int
    freshness_timestamp: str
    freshness_status: str  # "FRESH", "ACCEPTABLE", "STALE"
    table_score: float  # 0.0 - 100.0
    columns: List[ColumnQualityProfile] = []

    model_config = ConfigDict(from_attributes=True)


class DataSourceQualityReport(BaseModel):
    data_source_id: str
    data_source_name: str
    data_source_type: str
    overall_score: float  # 0.0 - 100.0
    status: str  # "PASSED", "WARNING", "CRITICAL"
    scanned_at: str
    tables_count: int
    tables: List[TableQualityReport] = []
    quality_warnings: List[str] = []
    agent_recommendations: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class DataQualitySummary(BaseModel):
    monitored_sources_count: int
    overall_health_score: float
    total_tables_profiled: int
    total_rows_inspected: int
    freshness_sla_met_pct: float
    critical_alerts_count: int

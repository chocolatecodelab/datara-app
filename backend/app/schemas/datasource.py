from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class DataSourceBase(BaseModel):
    name: str
    type: str  # postgres, sqlite, csv_upload
    connection_meta: Dict[str, Any] = {}


class DataSourceCreate(DataSourceBase):
    organization_id: Optional[str] = None


class DataSourceResponse(DataSourceBase):
    id: str
    organization_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DataSourceTestRequest(BaseModel):
    type: str  # postgres, mysql, sqlite, csv_upload, supabase
    connection_meta: Dict[str, Any] = {}


class DataSourceTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float] = None
    tables: Optional[list[str]] = None

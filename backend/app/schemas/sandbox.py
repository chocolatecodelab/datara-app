from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class SqlValidationRequest(BaseModel):
    sql: str
    role_name: Optional[str] = "Analyst"
    restricted_fields: Optional[List[str]] = []


class SqlValidationResponse(BaseModel):
    is_valid: bool
    is_read_only: bool
    is_rbac_clean: bool
    sanitized_sql: str
    violations: List[str] = []
    injected_limit: Optional[int] = None


class QueryExecuteRequest(BaseModel):
    sql: str
    data_source_id: Optional[str] = None
    role_name: Optional[str] = "Analyst"
    restricted_fields: Optional[List[str]] = []
    max_rows: Optional[int] = 1000


class QueryExecuteResponse(BaseModel):
    success: bool
    sql_executed: str
    latency_ms: int
    row_count: int
    columns: List[str] = []
    data: List[Dict[str, Any]] = []
    is_rbac_clean: bool = True
    error_message: Optional[str] = None

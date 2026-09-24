from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FederatedSourceQuery(BaseModel):
    alias: str = Field(..., description="Unique alias representing this dataset in the join, e.g. 'warehouse' or 'crm'")
    data_source_id: Optional[str] = Field(None, description="Registered DataSource ID. Defaults to demo database if omitted.")
    sql: str = Field(..., description="AST-validated SQL to execute against this specific data source")
    restricted_fields: Optional[List[str]] = Field(default_factory=list, description="Fields restricted by RBAC for this source")


class FederatedJoinClause(BaseModel):
    left_alias: str = Field(..., description="Alias of the left source table in the join")
    right_alias: str = Field(..., description="Alias of the right source table in the join")
    left_on: str = Field(..., description="Joining key column name in left source")
    right_on: str = Field(..., description="Joining key column name in right source")
    how: str = Field("inner", description="Join type: 'inner', 'left', 'right', 'outer'")


class FederatedJoinRequest(BaseModel):
    sources: List[FederatedSourceQuery] = Field(..., min_length=2, description="At least two distinct source queries to federate")
    joins: List[FederatedJoinClause] = Field(..., min_length=1, description="One or more join specifications connecting the sources")
    max_rows: Optional[int] = Field(500, description="Max rows to return after joining")
    order_by_column: Optional[str] = Field(None, description="Column to order result by")
    order_ascending: bool = Field(False, description="Ascending sort order flag")


class FederatedSourceLineage(BaseModel):
    alias: str
    source_name: str
    source_type: str
    rows_extracted: int
    latency_ms: int
    columns_extracted: List[str]


class FederatedQueryResult(BaseModel):
    success: bool
    total_rows: int
    columns: List[str]
    data: List[Dict[str, Any]]
    execution_latency_ms: int
    join_latency_ms: int
    lineage: List[FederatedSourceLineage]
    join_summary: str
    error_message: Optional[str] = None

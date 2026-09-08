from fastapi import APIRouter, HTTPException
from app.sandbox.ast_validator import AstSqlValidator
from app.sandbox.executor import SandboxExecutor
from app.schemas.sandbox import (
    SqlValidationRequest,
    SqlValidationResponse,
    QueryExecuteRequest,
    QueryExecuteResponse,
)

router = APIRouter()


@router.post("/validate-sql", response_model=SqlValidationResponse)
def validate_sql(payload: SqlValidationRequest):
    """
    Validates SQL query against AST security rules and role-based field-level security.
    """
    result = AstSqlValidator.validate_and_sanitize(
        sql=payload.sql,
        restricted_fields=payload.restricted_fields,
    )
    return SqlValidationResponse(
        is_valid=result.is_valid,
        is_read_only=result.is_read_only,
        is_rbac_clean=result.is_rbac_clean,
        sanitized_sql=result.sanitized_sql,
        violations=result.violations,
        injected_limit=result.injected_limit,
    )


@router.post("/execute", response_model=QueryExecuteResponse)
def execute_query(payload: QueryExecuteRequest):
    """
    Executes a validated read-only SQL query inside the isolated sandbox.
    """
    result = SandboxExecutor.execute(
        sql=payload.sql,
        restricted_fields=payload.restricted_fields,
        max_rows=payload.max_rows,
    )
    if not result.success and not result.is_rbac_clean:
        raise HTTPException(
            status_code=403,
            detail=f"Security Violation: {result.error_message}",
        )
    return result

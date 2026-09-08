import time
from typing import List, Optional
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.sandbox.ast_validator import AstSqlValidator
from app.schemas.sandbox import QueryExecuteResponse


class SandboxExecutor:
    """
    Isolated Read-Only Query Sandbox Executor.
    Executes AST-validated queries against customer data sources with timeout and row-caps.
    """

    @classmethod
    def execute(
        cls,
        sql: str,
        db_url: Optional[str] = None,
        restricted_fields: Optional[List[str]] = None,
        max_rows: Optional[int] = None,
    ) -> QueryExecuteResponse:
        effective_db_url = db_url or settings.DEMO_DATABASE_URL
        effective_max_rows = max_rows or settings.QUERY_MAX_ROWS

        # 1. AST Security Validation & Sanitization
        dialect = "sqlite" if effective_db_url.startswith("sqlite") else "postgres"
        validation = AstSqlValidator.validate_and_sanitize(
            sql=sql,
            restricted_fields=restricted_fields,
            max_rows=effective_max_rows,
            dialect=dialect,
        )

        if not validation.is_valid:
            return QueryExecuteResponse(
                success=False,
                sql_executed=sql,
                latency_ms=0,
                row_count=0,
                columns=[],
                data=[],
                is_rbac_clean=validation.is_rbac_clean,
                error_message="; ".join(validation.violations),
            )

        # 2. Execute within sandbox engine
        start_time = time.perf_counter()
        try:
            connect_args = {}
            if effective_db_url.startswith("sqlite"):
                connect_args = {"check_same_thread": False, "timeout": settings.QUERY_TIMEOUT_SECONDS}

            sandbox_engine = create_engine(
                effective_db_url,
                connect_args=connect_args,
                execution_options={"timeout": settings.QUERY_TIMEOUT_SECONDS},
            )

            with sandbox_engine.connect() as conn:
                result = conn.execute(text(validation.sanitized_sql))
                columns = list(result.keys()) if result.returns_rows else []
                rows = [dict(zip(columns, row)) for row in result.fetchmany(effective_max_rows)] if result.returns_rows else []

            duration_ms = int((time.perf_counter() - start_time) * 1000)

            return QueryExecuteResponse(
                success=True,
                sql_executed=validation.sanitized_sql,
                latency_ms=duration_ms,
                row_count=len(rows),
                columns=columns,
                data=rows,
                is_rbac_clean=True,
                error_message=None,
            )
        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return QueryExecuteResponse(
                success=False,
                sql_executed=validation.sanitized_sql,
                latency_ms=duration_ms,
                row_count=0,
                columns=[],
                data=[],
                is_rbac_clean=True,
                error_message=f"Execution error: {str(e)}",
            )

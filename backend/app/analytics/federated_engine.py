import time
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.datasource import DataSource
from app.sandbox.executor import SandboxExecutor
from app.schemas.federation import (
    FederatedJoinRequest,
    FederatedQueryResult,
    FederatedSourceLineage,
    FederatedSourceQuery,
    FederatedJoinClause,
)


class FederatedQueryEngine:
    """
    Federated Relational Query Engine for Datara.
    Executes distributed read-only queries across heterogeneous customer data sources,
    enforces AST/RBAC security isolation on sub-queries, and merges results in-memory.
    """

    @classmethod
    def execute_federated_join(
        cls,
        request: FederatedJoinRequest,
        db: Optional[Session] = None,
    ) -> FederatedQueryResult:
        start_total = time.perf_counter()
        lineages: List[FederatedSourceLineage] = []
        dfs: Dict[str, pd.DataFrame] = {}
        total_exec_latency = 0

        # Step 1: Execute each source sub-query within isolated sandbox
        for src in request.sources:
            target_url = settings.DEMO_DATABASE_URL
            source_name = "Primary Demo Warehouse"
            source_type = "sqlite"

            if src.data_source_id and db:
                ds = db.query(DataSource).filter(DataSource.id == src.data_source_id).first()
                if ds:
                    source_name = ds.name
                    source_type = ds.type
                    meta = ds.connection_meta or {}
                    if ds.type == "sqlite":
                        target_url = meta.get("database_url") or "sqlite:///./datara_demo.db"
                    elif ds.type in ("postgres", "postgresql"):
                        if meta.get("database_url"):
                            target_url = meta.get("database_url")
                        else:
                            host = meta.get("host", "localhost")
                            port = meta.get("port", 5432)
                            db_name = meta.get("database", "postgres")
                            user = meta.get("username", "postgres")
                            pw = meta.get("password", "")
                            target_url = f"postgresql://{user}:{pw}@{host}:{port}/{db_name}"

            # Run via SandboxExecutor
            exec_res = SandboxExecutor.execute(
                sql=src.sql,
                db_url=target_url,
                restricted_fields=src.restricted_fields,
                max_rows=max(request.max_rows * 2, 500),
            )

            total_exec_latency += exec_res.latency_ms

            if not exec_res.success:
                return FederatedQueryResult(
                    success=False,
                    total_rows=0,
                    columns=[],
                    data=[],
                    execution_latency_ms=total_exec_latency,
                    join_latency_ms=0,
                    lineage=[],
                    join_summary=f"Sub-query execution failed for source '{src.alias}'",
                    error_message=exec_res.error_message or f"Execution failed on source {src.alias}",
                )

            # Convert to DataFrame
            df = pd.DataFrame(exec_res.data) if exec_res.data else pd.DataFrame(columns=exec_res.columns)
            dfs[src.alias] = df

            lineages.append(
                FederatedSourceLineage(
                    alias=src.alias,
                    source_name=source_name,
                    source_type=source_type,
                    rows_extracted=len(df),
                    latency_ms=exec_res.latency_ms,
                    columns_extracted=list(df.columns),
                )
            )

        # Step 2: In-Memory Relational Joins
        start_join = time.perf_counter()
        try:
            merged_df: Optional[pd.DataFrame] = None

            for idx, join in enumerate(request.joins):
                if idx == 0:
                    left_df = dfs.get(join.left_alias)
                    right_df = dfs.get(join.right_alias)

                    if left_df is None:
                        raise ValueError(f"Source alias '{join.left_alias}' not found in query sources.")
                    if right_df is None:
                        raise ValueError(f"Source alias '{join.right_alias}' not found in query sources.")

                    if join.left_on not in left_df.columns:
                        raise ValueError(f"Join key '{join.left_on}' missing from source '{join.left_alias}'. Available: {list(left_df.columns)}")
                    if join.right_on not in right_df.columns:
                        raise ValueError(f"Join key '{join.right_on}' missing from source '{join.right_alias}'. Available: {list(right_df.columns)}")

                    # Ensure join key types match (e.g. cast string/int alignment)
                    left_df_copy = left_df.copy()
                    right_df_copy = right_df.copy()
                    left_df_copy[join.left_on] = left_df_copy[join.left_on].astype(str)
                    right_df_copy[join.right_on] = right_df_copy[join.right_on].astype(str)

                    merged_df = pd.merge(
                        left_df_copy,
                        right_df_copy,
                        left_on=join.left_on,
                        right_on=join.right_on,
                        how=join.how,
                        suffixes=(f"_{join.left_alias}", f"_{join.right_alias}"),
                    )
                else:
                    right_df = dfs.get(join.right_alias)
                    if right_df is None:
                        raise ValueError(f"Source alias '{join.right_alias}' not found in query sources.")
                    if join.right_on not in right_df.columns:
                        raise ValueError(f"Join key '{join.right_on}' missing from source '{join.right_alias}'.")
                    if join.left_on not in merged_df.columns:
                        raise ValueError(f"Join key '{join.left_on}' missing from current merged dataset.")

                    right_df_copy = right_df.copy()
                    merged_df[join.left_on] = merged_df[join.left_on].astype(str)
                    right_df_copy[join.right_on] = right_df_copy[join.right_on].astype(str)

                    merged_df = pd.merge(
                        merged_df,
                        right_df_copy,
                        left_on=join.left_on,
                        right_on=join.right_on,
                        how=join.how,
                        suffixes=("", f"_{join.right_alias}"),
                    )

            if merged_df is None:
                merged_df = pd.DataFrame()

            # Optional sorting
            if request.order_by_column and request.order_by_column in merged_df.columns:
                merged_df = merged_df.sort_values(by=request.order_by_column, ascending=request.order_ascending)

            # Cap rows to max_rows
            if request.max_rows and len(merged_df) > request.max_rows:
                merged_df = merged_df.head(request.max_rows)

            # Null sanitization for JSON
            cleaned_df = merged_df.where(pd.notnull(merged_df), None)
            data_records = cleaned_df.to_dict(orient="records")
            final_columns = list(cleaned_df.columns)

            join_duration_ms = int((time.perf_counter() - start_join) * 1000)
            total_duration_ms = int((time.perf_counter() - start_total) * 1000)

            # Build readable lineage join summary
            join_descriptors = [
                f"[{j.left_alias}.{j.left_on} ⨝ ({j.how.upper()}) {j.right_alias}.{j.right_on}]"
                for j in request.joins
            ]
            summary_text = (
                f"Federated {len(request.sources)} heterogeneous sources via "
                f"{', '.join(join_descriptors)} → {len(data_records)} merged rows in {total_duration_ms}ms "
                f"(Sub-query fetch: {total_exec_latency}ms, Join engine: {join_duration_ms}ms)."
            )

            return FederatedQueryResult(
                success=True,
                total_rows=len(data_records),
                columns=final_columns,
                data=data_records,
                execution_latency_ms=total_exec_latency,
                join_latency_ms=join_duration_ms,
                lineage=lineages,
                join_summary=summary_text,
                error_message=None,
            )

        except Exception as e:
            join_duration_ms = int((time.perf_counter() - start_join) * 1000)
            return FederatedQueryResult(
                success=False,
                total_rows=0,
                columns=[],
                data=[],
                execution_latency_ms=total_exec_latency,
                join_latency_ms=join_duration_ms,
                lineage=lineages,
                join_summary="Join execution encountered an error",
                error_message=f"In-memory join error: {str(e)}",
            )

    @classmethod
    def get_sample_federation_scenario(cls, db: Optional[Session] = None) -> FederatedJoinRequest:
        """
        Provides a pre-configured, valid cross-source federated join scenario:
        Joins transaction records from Sales Warehouse (orders) with CRM customer profiles (customers).
        """
        return FederatedJoinRequest(
            sources=[
                FederatedSourceQuery(
                    alias="sales_warehouse",
                    sql="SELECT o.id AS order_id, o.customer_id, o.month, o.status FROM orders o WHERE o.month = '2026-08' LIMIT 100",
                ),
                FederatedSourceQuery(
                    alias="crm_customers",
                    sql="SELECT c.id AS customer_ref_id, c.name AS customer_name, c.region, c.segment FROM customers c",
                ),
            ],
            joins=[
                FederatedJoinClause(
                    left_alias="sales_warehouse",
                    right_alias="crm_customers",
                    left_on="customer_id",
                    right_on="customer_ref_id",
                    how="inner",
                ),
            ],
            max_rows=50,
            order_by_column="order_id",
            order_ascending=False,
        )

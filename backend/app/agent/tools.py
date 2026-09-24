from typing import Dict, Any, List, Optional
import sqlite3
from sqlalchemy.orm import Session
from app.core.config import settings
from app.semantic.engine import SemanticEngine
from app.sandbox.executor import SandboxExecutor
from app.analytics.variance import VarianceEngine
from app.schemas.analytics import VarianceAnalysisResponse
from app.schemas.sandbox import QueryExecuteResponse


class AgentTools:
    """
    Modular Tool Dispatcher for Datara Agent Engine.
    Provides verified analytical actions bounded by governance and sandboxing.
    """

    @staticmethod
    def lookup_metric(term: str, org_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """Tool 1: Looks up metric definition in Semantic Layer."""
        res = SemanticEngine.lookup_metric(term, org_id, db)
        if not res:
            return None
        metric, confidence = res
        return {
            "name": metric.name,
            "formula": metric.formula,
            "source_table": metric.source_table,
            "allowed_dimensions": metric.allowed_dimensions,
            "business_terms": metric.business_terms,
            "business_rules": metric.business_rules,
            "confidence": confidence,
        }

    @staticmethod
    def search_schema(db_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tool 2: Discovers available tables and columns in target database."""
        effective_db_url = db_url or settings.DEMO_DATABASE_URL
        if "sqlite" in effective_db_url:
            db_path = effective_db_url.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cur.fetchall() if not row[0].startswith("sqlite_")]
            schema_info = []
            for t in tables:
                cur.execute(f"PRAGMA table_info({t});")
                cols = [c[1] for c in cur.fetchall()]
                schema_info.append({"table": t, "columns": cols})
            conn.close()
            return schema_info
        return []

    @staticmethod
    def generate_sql(
        metric_name: str,
        dimension: Optional[str] = None,
        month_filter: Optional[str] = None,
    ) -> str:
        """Tool 3: Deterministically synthesizes sanitized SQL for the demo retail warehouse."""
        if dimension == "region":
            where_clause = f"WHERE o.month = '{month_filter}'" if month_filter else ""
            return f"""
            SELECT c.region AS dimension_value, SUM(oi.amount) AS total_value, COUNT(DISTINCT o.id) AS order_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN order_items oi ON o.id = oi.order_id
            {where_clause}
            GROUP BY c.region
            ORDER BY total_value DESC
            """.strip()
        elif dimension in ("product", "product_name"):
            where_clause = f"WHERE o.month = '{month_filter}'" if month_filter else ""
            return f"""
            SELECT p.name AS dimension_value, SUM(oi.amount) AS total_value, COUNT(DISTINCT o.id) AS order_count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            {where_clause}
            GROUP BY p.name
            ORDER BY total_value DESC
            """.strip()
        elif dimension == "product_category":
            where_clause = f"WHERE o.month = '{month_filter}'" if month_filter else ""
            return f"""
            SELECT p.category AS dimension_value, SUM(oi.amount) AS total_value, COUNT(DISTINCT o.id) AS order_count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            {where_clause}
            GROUP BY p.category
            ORDER BY total_value DESC
            """.strip()
        elif dimension == "cross_product_region":
            where_clause = f"WHERE o.month = '{month_filter}'" if month_filter else ""
            return f"""
            SELECT c.region || ' - ' || p.name AS dimension_value, SUM(oi.amount) AS total_value, COUNT(DISTINCT o.id) AS order_count
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            {where_clause}
            GROUP BY c.region, p.name
            ORDER BY total_value DESC
            """.strip()
        else:
            where_clause = f"WHERE o.month = '{month_filter}'" if month_filter else ""
            return f"""
            SELECT o.month, SUM(oi.amount) AS total_value, COUNT(DISTINCT o.id) AS order_count
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            {where_clause}
            GROUP BY o.month
            """.strip()

    @staticmethod
    def execute_query(
        sql: str,
        db_url: Optional[str] = None,
        restricted_fields: Optional[List[str]] = None,
        max_rows: Optional[int] = None,
    ) -> QueryExecuteResponse:
        """Tool 4: Executes query via isolated read-only AST-validated sandbox."""
        return SandboxExecutor.execute(
            sql=sql,
            db_url=db_url,
            restricted_fields=restricted_fields,
            max_rows=max_rows,
        )

    @staticmethod
    def run_variance_analysis(
        metric_name: str,
        baseline_data: List[Dict[str, Any]],
        current_data: List[Dict[str, Any]],
        dimension_name: str,
    ) -> VarianceAnalysisResponse:
        """Tool 5: Computes variance decomposition and driver impacts from query results."""
        prev_map = {row["dimension_value"]: float(row["total_value"]) for row in baseline_data if "dimension_value" in row}
        curr_map = {row["dimension_value"]: float(row["total_value"]) for row in current_data if "dimension_value" in row}

        all_keys = set(prev_map.keys()).union(set(curr_map.keys()))
        items = []
        for k in all_keys:
            items.append({
                "value": k,
                "previous_val": prev_map.get(k, 0.0),
                "current_val": curr_map.get(k, 0.0),
            })

        prev_total = sum(prev_map.values())
        curr_total = sum(curr_map.values())

        breakdowns = {dimension_name: items}
        total_records = len(baseline_data) + len(current_data)

        return VarianceEngine.calculate_variance(
            metric_name=metric_name,
            previous_val=prev_total,
            current_val=curr_total,
            breakdowns=breakdowns,
            total_records_analyzed=total_records,
        )

    @staticmethod
    def execute_federated_join(
        request: Any,
        db: Optional[Session] = None,
    ) -> Any:
        """Tool 6: Executes heterogeneous cross-source federated join with lineage tracking."""
        from app.analytics.federated_engine import FederatedQueryEngine
        return FederatedQueryEngine.execute_federated_join(request=request, db=db)


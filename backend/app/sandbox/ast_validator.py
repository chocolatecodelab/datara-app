from typing import List, Optional, Set
from pydantic import BaseModel
import sqlglot
from sqlglot import exp


class SqlValidationResult(BaseModel):
    is_valid: bool
    is_read_only: bool
    is_rbac_clean: bool
    sanitized_sql: str
    violations: List[str] = []
    injected_limit: Optional[int] = None


class AstSqlValidator:
    """
    AST-based SQL Security Validator using SQLGlot.
    Enforces strict read-only execution, field-level RBAC restrictions, and max row limits.
    """

    FORBIDDEN_EXPRESSIONS = (
        exp.Insert,
        exp.Update,
        exp.Delete,
        exp.Drop,
        exp.Alter,
        exp.Create,
        exp.Command,
        exp.TruncateTable,
        exp.Pragma,
    )

    @classmethod
    def validate_and_sanitize(
        cls,
        sql: str,
        restricted_fields: Optional[List[str]] = None,
        max_rows: int = 1000,
        dialect: str = "postgres",
    ) -> SqlValidationResult:
        """
        Parses, validates and sanitizes SQL query using AST.
        """
        violations: List[str] = []
        is_read_only = True
        is_rbac_clean = True
        injected_limit = None
        restricted_set: Set[str] = {f.strip().lower() for f in (restricted_fields or []) if f.strip()}

        # Clean string
        clean_sql = sql.strip().rstrip(";")
        if not clean_sql:
            return SqlValidationResult(
                is_valid=False,
                is_read_only=False,
                is_rbac_clean=False,
                sanitized_sql="",
                violations=["SQL query cannot be empty."],
            )

        # 1. Parse AST
        try:
            parsed_trees = sqlglot.parse(clean_sql, read=dialect)
        except Exception as e:
            # Fallback to generic sql if dialect fails
            try:
                parsed_trees = sqlglot.parse(clean_sql)
            except Exception as e2:
                return SqlValidationResult(
                    is_valid=False,
                    is_read_only=False,
                    is_rbac_clean=False,
                    sanitized_sql="",
                    violations=[f"SQL Syntax / Parsing Error: {str(e2)}"],
                )

        # Check single statement
        if len(parsed_trees) != 1 or parsed_trees[0] is None:
            return SqlValidationResult(
                is_valid=False,
                is_read_only=False,
                is_rbac_clean=False,
                sanitized_sql="",
                violations=["Multiple SQL statements or empty statement detected. Only single queries are allowed."],
            )

        ast = parsed_trees[0]

        # 2. Check for DDL / DML / Non-Read-Only nodes
        for node in ast.walk():
            if isinstance(node, cls.FORBIDDEN_EXPRESSIONS):
                is_read_only = False
                violations.append(f"Security Violation: Non-read-only operation detected ({node.__class__.__name__}).")

        # Top-level expression must be a Select or Union
        if not isinstance(ast, (exp.Select, exp.Union)):
            # Check if it wraps a select (e.g. Subquery or CTE)
            if not ast.find(exp.Select):
                is_read_only = False
                violations.append("Security Violation: Only SELECT queries are permitted.")

        # 3. Field-Level RBAC Security Check
        if restricted_set:
            accessed_columns: Set[str] = set()
            for col_node in ast.find_all(exp.Column):
                col_name = col_node.name.lower()
                accessed_columns.add(col_name)
                if col_name in restricted_set:
                    is_rbac_clean = False
                    violations.append(
                        f"RBAC Violation: Access to restricted sensitive column '{col_node.name}' is prohibited."
                    )

        # 4. Limit Enforcement
        sanitized_ast = ast
        if isinstance(ast, exp.Select):
            limit_node = ast.args.get("limit")
            if limit_node is None:
                sanitized_ast = ast.limit(max_rows)
                injected_limit = max_rows
            else:
                try:
                    current_limit = int(limit_node.expression.this)
                    if current_limit > max_rows:
                        sanitized_ast = ast.limit(max_rows)
                        injected_limit = max_rows
                except Exception:
                    sanitized_ast = ast.limit(max_rows)
                    injected_limit = max_rows

        sanitized_sql = sanitized_ast.sql(dialect=dialect)
        is_valid = is_read_only and is_rbac_clean and len(violations) == 0

        return SqlValidationResult(
            is_valid=is_valid,
            is_read_only=is_read_only,
            is_rbac_clean=is_rbac_clean,
            sanitized_sql=sanitized_sql if is_valid else clean_sql,
            violations=violations,
            injected_limit=injected_limit,
        )

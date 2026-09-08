import pytest
from app.sandbox.ast_validator import AstSqlValidator


def test_valid_select_query():
    sql = "SELECT id, name, category FROM products WHERE unit_price > 100"
    result = AstSqlValidator.validate_and_sanitize(sql, max_rows=500, dialect="sqlite")
    assert result.is_valid is True
    assert result.is_read_only is True
    assert result.is_rbac_clean is True
    assert "LIMIT 500" in result.sanitized_sql


def test_reject_drop_table():
    sql = "DROP TABLE customers;"
    result = AstSqlValidator.validate_and_sanitize(sql, dialect="sqlite")
    assert result.is_valid is False
    assert result.is_read_only is False
    assert any("Security Violation" in v for v in result.violations)


def test_reject_insert_update_delete():
    queries = [
        "INSERT INTO products (name) VALUES ('Hacked')",
        "UPDATE products SET unit_price = 0",
        "DELETE FROM orders WHERE id > 0",
    ]
    for q in queries:
        result = AstSqlValidator.validate_and_sanitize(q, dialect="sqlite")
        assert result.is_valid is False
        assert result.is_read_only is False


def test_reject_multi_statement():
    sql = "SELECT * FROM orders; DROP TABLE customers;"
    result = AstSqlValidator.validate_and_sanitize(sql, dialect="sqlite")
    assert result.is_valid is False
    assert any("Multiple SQL statements" in v for v in result.violations)


def test_field_level_rbac_restriction():
    sql = "SELECT id, name, customer_credit_card FROM customers"
    result = AstSqlValidator.validate_and_sanitize(
        sql,
        restricted_fields=["customer_credit_card", "employee_salary"],
        dialect="sqlite",
    )
    assert result.is_valid is False
    assert result.is_rbac_clean is False
    assert any("Access to restricted sensitive column 'customer_credit_card'" in v for v in result.violations)


def test_auto_cap_excessive_limit():
    sql = "SELECT id, amount FROM order_items LIMIT 50000"
    result = AstSqlValidator.validate_and_sanitize(sql, max_rows=1000, dialect="sqlite")
    assert result.is_valid is True
    assert "LIMIT 1000" in result.sanitized_sql

import pytest
import pandas as pd
from app.analytics.variance import VarianceEngine


def test_variance_decomposition_math():
    breakdowns = {
        "region": [
            {"value": "East Java", "previous_val": 100000.0, "current_val": 70000.0},   # delta: -30,000 (60% impact)
            {"value": "West Java", "previous_val": 150000.0, "current_val": 130000.0},  # delta: -20,000 (40% impact)
        ]
    }
    result = VarianceEngine.calculate_variance(
        metric_name="Revenue",
        previous_val=250000.0,
        current_val=200000.0,  # total delta: -50,000 (-20%)
        breakdowns=breakdowns,
        total_records_analyzed=1500,
    )

    assert result.metric_name == "Revenue"
    assert result.absolute_change == -50000.0
    assert result.percentage_change == -20.0
    assert result.direction == "decrease"
    assert len(result.top_drivers) == 2
    assert result.top_drivers[0].value == "East Java"
    assert result.top_drivers[0].impact_pct == 60.0
    assert result.top_drivers[1].value == "West Java"
    assert result.top_drivers[1].impact_pct == 40.0
    assert result.confidence_score >= 0.90


def test_variance_from_dataframes():
    df_prev = pd.DataFrame([
        {"product": "Alpha", "amount": 1000},
        {"product": "Beta", "amount": 500},
    ])
    df_curr = pd.DataFrame([
        {"product": "Alpha", "amount": 600},  # -400
        {"product": "Beta", "amount": 500},   # 0
    ])

    result = VarianceEngine.decompose_from_dataframes(
        metric_name="Revenue",
        df_previous=df_prev,
        df_current=df_curr,
        value_column="amount",
        dimension_columns=["product"],
    )

    assert result.previous_value == 1500.0
    assert result.current_value == 1100.0
    assert result.absolute_change == -400.0
    assert len(result.top_drivers) == 2
    alpha_driver = next(d for d in result.top_drivers if d.value == "Alpha")
    assert alpha_driver.impact_pct == 100.0

from typing import List, Dict, Any, Optional
import pandas as pd
from app.schemas.analytics import (
    VarianceAnalysisResponse,
    DimensionVarianceItem,
)
from app.schemas.conversation import DriverItem


class VarianceEngine:
    """
    Multidimensional Variance Decomposition & Root Cause Engine.
    Deterministically computes period-over-period variance and isolates key driver contributions.
    """

    @staticmethod
    def calculate_variance(
        metric_name: str,
        previous_val: float,
        current_val: float,
        breakdowns: Optional[Dict[str, List[Dict[str, Any]]]] = None,
        total_records_analyzed: int = 0,
    ) -> VarianceAnalysisResponse:
        """
        Computes overall variance and decomposes contribution percentages per dimension.
        breakdowns format:
        {
            "region": [
                {"value": "East Java", "previous_val": 100000, "current_val": 70000},
                {"value": "West Java", "previous_val": 150000, "current_val": 145000}
            ],
            "product": [ ... ]
        }
        """
        abs_change = current_val - previous_val
        pct_change = (abs_change / previous_val * 100.0) if previous_val != 0 else 0.0

        if abs_change > 0:
            direction = "increase"
        elif abs_change < 0:
            direction = "decrease"
        else:
            direction = "neutral"

        all_drivers: List[DriverItem] = []
        dimension_breakdowns: List[DimensionVarianceItem] = []

        if breakdowns:
            for dim_name, items in breakdowns.items():
                dim_drivers: List[DriverItem] = []
                dim_total_delta = 0.0

                for item in items:
                    val_name = str(item.get("value", "Unknown"))
                    prev = float(item.get("previous_val", 0.0))
                    curr = float(item.get("current_val", 0.0))
                    delta = curr - prev
                    dim_total_delta += delta

                    # Impact % relative to overall delta
                    if abs_change != 0:
                        impact_pct = round((delta / abs_change) * 100.0, 2)
                    else:
                        impact_pct = 0.0

                    driver = DriverItem(
                        dimension=dim_name,
                        value=val_name,
                        impact_pct=impact_pct,
                        previous_val=prev,
                        current_val=curr,
                    )
                    dim_drivers.append(driver)
                    all_drivers.append(driver)

                # Sort dimension drivers by impact magnitude descending
                dim_drivers.sort(key=lambda d: abs(d.impact_pct), reverse=True)
                dimension_breakdowns.append(
                    DimensionVarianceItem(
                        dimension_name=dim_name,
                        drivers=dim_drivers,
                        dimension_total_impact=round(dim_total_delta, 2),
                    )
                )

        # Sort all drivers across all dimensions by highest impact percentage
        all_drivers.sort(key=lambda d: abs(d.impact_pct), reverse=True)
        top_drivers = all_drivers[:5]  # Top 5 most influential root cause drivers

        # Confidence calculation
        confidence = 0.90 if total_records_analyzed > 500 else (0.85 if total_records_analyzed > 50 else 0.75)
        if len(top_drivers) >= 1 and top_drivers[0].impact_pct > 30.0:
            confidence = min(0.96, confidence + 0.05)

        evidence_text = f"Calculated from {total_records_analyzed:,} records comparing baseline ({previous_val:,.2f}) to current ({current_val:,.2f})."

        return VarianceAnalysisResponse(
            metric_name=metric_name,
            previous_value=round(previous_val, 2),
            current_value=round(current_val, 2),
            absolute_change=round(abs_change, 2),
            percentage_change=round(pct_change, 2),
            direction=direction,
            top_drivers=top_drivers,
            dimension_breakdowns=dimension_breakdowns,
            confidence_score=round(confidence, 2),
            evidence_summary=evidence_text,
        )

    @staticmethod
    def decompose_from_dataframes(
        metric_name: str,
        df_previous: pd.DataFrame,
        df_current: pd.DataFrame,
        value_column: str,
        dimension_columns: List[str],
    ) -> VarianceAnalysisResponse:
        """
        Decomposes variance directly from two Pandas DataFrames representing previous and current periods.
        """
        prev_total = float(df_previous[value_column].sum()) if not df_previous.empty else 0.0
        curr_total = float(df_current[value_column].sum()) if not df_current.empty else 0.0
        total_records = len(df_previous) + len(df_current)

        breakdowns: Dict[str, List[Dict[str, Any]]] = {}

        for dim in dimension_columns:
            if dim in df_previous.columns and dim in df_current.columns:
                prev_grp = df_previous.groupby(dim)[value_column].sum().to_dict()
                curr_grp = df_current.groupby(dim)[value_column].sum().to_dict()
                all_keys = set(prev_grp.keys()).union(set(curr_grp.keys()))

                dim_list = []
                for k in all_keys:
                    dim_list.append({
                        "value": str(k),
                        "previous_val": float(prev_grp.get(k, 0.0)),
                        "current_val": float(curr_grp.get(k, 0.0)),
                    })
                breakdowns[dim] = dim_list

        return VarianceEngine.calculate_variance(
            metric_name=metric_name,
            previous_val=prev_total,
            current_val=curr_total,
            breakdowns=breakdowns,
            total_records_analyzed=total_records,
        )

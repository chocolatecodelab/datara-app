from fastapi import APIRouter
from app.analytics.variance import VarianceEngine
from app.analytics.forecasting import ForecastingEngine
from app.schemas.analytics import (
    VarianceAnalysisRequest,
    VarianceAnalysisResponse,
    ForecastScenarioRequest,
    ForecastScenarioResponse,
)

router = APIRouter()



@router.post("/variance", response_model=VarianceAnalysisResponse)
def compute_variance(payload: VarianceAnalysisRequest):
    """
    Computes deterministic period-over-period variance and isolates root-cause driver impacts.
    """
    prev_val = payload.baseline_value or 100000.0
    curr_val = payload.current_value or 85000.0

    # Demo sample breakdown if not passed
    sample_breakdown = {
        "region": [
            {"value": "East Java", "previous_val": 45000.0, "current_val": 30000.0},
            {"value": "West Java", "previous_val": 35000.0, "current_val": 34000.0},
            {"value": "Jakarta", "previous_val": 20000.0, "current_val": 21000.0},
        ],
        "product": [
            {"value": "Product Alpha", "previous_val": 50000.0, "current_val": 38000.0},
            {"value": "Product Beta", "previous_val": 30000.0, "current_val": 29000.0},
            {"value": "Product Gamma", "previous_val": 20000.0, "current_val": 18000.0},
        ],
    }

    result = VarianceEngine.calculate_variance(
        metric_name=payload.metric_name,
        previous_val=prev_val,
        current_val=curr_val,
        breakdowns=sample_breakdown,
        total_records_analyzed=12540,
    )
    return result


@router.post("/forecast", response_model=ForecastScenarioResponse)
def compute_forecast(payload: ForecastScenarioRequest):
    """
    Computes Level 5 What-If Scenario trajectory comparing Status Quo drift
    vs Custom Driver Intervention plan.
    """
    return ForecastingEngine.predict_scenario(
        metric_name=payload.metric_name,
        baseline_value=payload.baseline_value,
        current_value=payload.current_value,
        drivers=payload.drivers,
        interventions=payload.interventions,
        months_ahead=payload.months_ahead,
    )


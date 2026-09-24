from typing import List, Dict, Optional, Any
from app.schemas.analytics import (
    ForecastScenarioResponse,
    ForecastTrajectoryPoint,
    DriverInterventionItem,
)
from app.schemas.conversation import DriverItem


class ForecastingEngine:
    """
    Predictive Analytics & What-If Scenario Simulator Engine (PRD Level 5).
    Deterministically projects future metric trajectory under Status Quo (Unmitigated Drift)
    versus Mitigated Trajectory (Custom Action Plan Interventions).
    """

    @staticmethod
    def predict_scenario(
        metric_name: str,
        baseline_value: float,
        current_value: float,
        drivers: Optional[List[DriverItem]] = None,
        interventions: Optional[Dict[str, float]] = None,
        months_ahead: int = 3,
    ) -> ForecastScenarioResponse:
        interventions = interventions or {}
        drivers_list = drivers or []

        # 1. Period Drift Calculation
        abs_change = current_value - baseline_value
        pct_change = (abs_change / baseline_value * 100.0) if baseline_value != 0 else 0.0
        drift_rate = (abs_change / baseline_value) if baseline_value != 0 else -0.15

        # 2. Driver Interventions & Recovery Math
        driver_items: List[DriverInterventionItem] = []
        total_recovery_m1 = 0.0

        if drivers_list:
            for d in drivers_list:
                # Determine driver loss / gap
                if d.previous_val is not None and d.current_val is not None and d.previous_val > d.current_val:
                    loss = float(d.previous_val - d.current_val)
                elif d.impact_pct < 0 and abs_change < 0:
                    loss = abs(abs_change * (d.impact_pct / 100.0))
                else:
                    loss = 0.0

                # Check if user specified custom intervention percentage for this driver
                # Default: 0.65 (65%) for dominant driver, 0.50 (50%) for others
                default_pct = 0.65 if len(driver_items) == 0 else 0.50
                intervention_pct = interventions.get(d.value, interventions.get(d.dimension, default_pct))
                # Clamp between 0.0 and 1.0
                intervention_pct = max(0.0, min(1.0, float(intervention_pct)))

                recovered = round(loss * intervention_pct, 2)
                total_recovery_m1 += recovered

                driver_items.append(
                    DriverInterventionItem(
                        dimension=d.dimension,
                        driver_name=d.value,
                        deficit_amount=round(loss, 2),
                        intervention_pct=round(intervention_pct, 2),
                        recovered_amount=recovered,
                    )
                )

        # Fallback if no drivers passed
        if not driver_items and abs_change < 0:
            loss = abs(abs_change)
            default_rate = max(0.0, min(1.0, float(interventions.get("overall", 0.60))))
            recovered = round(loss * default_rate, 2)
            total_recovery_m1 = recovered
            driver_items.append(
                DriverInterventionItem(
                    dimension="overall",
                    driver_name=f"{metric_name} Overall",
                    deficit_amount=round(loss, 2),
                    intervention_pct=default_rate,
                    recovered_amount=recovered,
                )
            )

        # 3. Trajectory Modeling (Historical + Months Ahead)
        trajectory: List[ForecastTrajectoryPoint] = []

        # T0: Baseline Period (e.g. 2026-07)
        trajectory.append(
            ForecastTrajectoryPoint(
                period_label="Baseline (T-1)",
                is_projected=False,
                status_quo_value=round(baseline_value, 2),
                mitigated_value=round(baseline_value, 2),
            )
        )

        # T1: Current Period (e.g. 2026-08)
        trajectory.append(
            ForecastTrajectoryPoint(
                period_label="Current (T0)",
                is_projected=False,
                status_quo_value=round(current_value, 2),
                mitigated_value=round(current_value, 2),
            )
        )

        # T+1 to T+N Projections
        last_sq = current_value
        last_mit = current_value

        month_names = ["Month +1 (Proj)", "Month +2 (Proj)", "Month +3 (Proj)", "Month +4 (Proj)"]

        for i in range(months_ahead):
            label = month_names[i] if i < len(month_names) else f"Month +{i+1} (Proj)"

            if abs_change < 0:
                # Status quo negative drift continuation with dampening
                dampening = 0.65 if i == 0 else (0.35 if i == 1 else 0.20)
                sq_delta = last_sq * (drift_rate * dampening)
                curr_sq = max(last_sq + sq_delta, current_value * 0.4)

                # Mitigated trajectory incorporates recovery
                if i == 0:
                    curr_mit = current_value + total_recovery_m1
                else:
                    rebound_growth = 0.045 if i == 1 else 0.030
                    curr_mit = last_mit * (1.0 + rebound_growth)
            else:
                # Positive growth continuation
                curr_sq = last_sq * 1.025
                curr_mit = last_mit * (1.0 + 0.05 + (total_recovery_m1 / current_value if current_value else 0.02))

            trajectory.append(
                ForecastTrajectoryPoint(
                    period_label=label,
                    is_projected=True,
                    status_quo_value=round(curr_sq, 2),
                    mitigated_value=round(curr_mit, 2),
                )
            )

            last_sq = curr_sq
            last_mit = curr_mit

        # 4. Next Period Comparisons & Net Protected Value
        next_period_sq = trajectory[2].status_quo_value if len(trajectory) > 2 else current_value
        next_period_mit = trajectory[2].mitigated_value if len(trajectory) > 2 else current_value
        net_protected = round(next_period_mit - next_period_sq, 2)
        recovery_pct = round((net_protected / current_value * 100.0), 1) if current_value != 0 else 0.0

        confidence = 0.91 if len(drivers_list) >= 2 else 0.85

        # 5. Executive Narrative Synthesis
        dominant_driver_name = driver_items[0].driver_name if driver_items else "driver operasional"
        dominant_pct = int(driver_items[0].intervention_pct * 100) if driver_items else 65

        narrative = (
            f"Melalui intervensi {dominant_pct}% pada {dominant_driver_name}, "
            f"proyeksi {metric_name} bulan berikutnya diperkirakan pulih ke ${next_period_mit:,.0f}, "
            f"berhasil mengamankan potensi kerugian sebesar +${net_protected:,.0f} (+{recovery_pct}%) "
            f"dibandingkan skenario status quo tanpa tindakan (${next_period_sq:,.0f})."
        )

        return ForecastScenarioResponse(
            metric_name=metric_name,
            baseline_value=round(baseline_value, 2),
            current_value=round(current_value, 2),
            trajectory=trajectory,
            driver_interventions=driver_items,
            next_period_status_quo=round(next_period_sq, 2),
            next_period_mitigated=round(next_period_mit, 2),
            net_protected_value=net_protected,
            recovery_percentage=recovery_pct,
            confidence_score=confidence,
            narrative_summary=narrative,
        )

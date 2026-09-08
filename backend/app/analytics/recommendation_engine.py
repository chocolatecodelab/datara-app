from typing import List, Dict, Any, Optional
import math


def generate_recommendations_from_variance(
    finding: str,
    main_drivers: List[Dict[str, Any]],
    conversation_goal: str = "",
    confidence_baseline: float = 0.88
) -> List[Dict[str, Any]]:
    """
    Prescriptive Analytics Engine:
    Synthesizes root-cause variance drivers into concrete, auditable business recommendations
    with estimated financial impact, effort difficulty, and operational action steps.
    """
    recommendations = []

    # If no drivers passed, construct fallback strategic recommendations
    if not main_drivers:
        recommendations.append({
            "title": "Establish Real-Time Channel Performance Monitoring",
            "rationale": "High aggregate volatility detected without clear dominant single-dimension outlier. Recommend daily automated baseline tracking.",
            "target_dimension": "all",
            "estimated_impact_amount": 15000.0,
            "estimated_impact_pct": 5.0,
            "confidence": 0.82,
            "priority": "P2 - Medium",
            "difficulty": "Low",
            "action_steps": [
                {"id": 1, "step": "Configure automated hourly anomaly alerts on regional revenue tables.", "pic_role": "Data Engineer", "completed": False},
                {"id": 2, "step": "Schedule weekly variance review meeting with regional sales heads.", "pic_role": "Analytics Lead", "completed": False},
            ],
            "status": "pending_approval"
        })
        return recommendations

    # Sort drivers by absolute impact descending
    sorted_drivers = sorted(main_drivers, key=lambda x: abs(x.get("impact_pct", 0)), reverse=True)

    # Driver 1: Dominant Contributor (Usually P0 - Critical)
    primary_driver = sorted_drivers[0]
    dim_name = primary_driver.get("dimension", "dimension").capitalize()
    dim_val = primary_driver.get("value", "target entity")
    impact_pct = primary_driver.get("impact_pct", -20.0)
    prev_val = primary_driver.get("previous_val", 300000)
    curr_val = primary_driver.get("current_val", 240000)

    # Calculate expected financial recovery
    drop_amount = max(0.0, float(prev_val - curr_val)) if prev_val and curr_val else 64600.0
    # Expected recovery between 50% and 65% of loss
    expected_recovery = round(drop_amount * 0.65, 2)
    recovery_pct = round(abs(impact_pct) * 0.45, 1)

    rec1 = {
        "title": f"Strategic Channel Turnaround & Inventory Reallocation: {dim_val}",
        "rationale": (
            f"{dim_name} '{dim_val}' is the single largest negative contributor ({impact_pct}% variance). "
            f"Restructuring distribution supply and offering targeted distributor incentives will recover an estimated "
            f"${expected_recovery:,.0f} (+{recovery_pct}% recovery)."
        ),
        "target_dimension": f"{primary_driver.get('dimension')}:{dim_val}",
        "estimated_impact_amount": expected_recovery,
        "estimated_impact_pct": recovery_pct,
        "confidence": round(min(0.95, max(0.80, confidence_baseline + 0.02)), 2),
        "priority": "P0 - Critical" if abs(impact_pct) >= 30 else "P1 - High",
        "difficulty": "Medium",
        "action_steps": [
            {
                "id": 1,
                "step": f"Expedite inventory allocation to primary fulfillment hubs in {dim_val} within 48 hours.",
                "pic_role": "Supply Chain Operations",
                "completed": False
            },
            {
                "id": 2,
                "step": f"Directly engage top 15 distributor accounts in {dim_val} with volume-based buffer rebates.",
                "pic_role": "Regional Sales Lead",
                "completed": False
            },
            {
                "id": 3,
                "step": "Deploy localized flash promotions to clear backlogged competitor offerings.",
                "pic_role": "Growth Marketing",
                "completed": False
            },
            {
                "id": 4,
                "step": "Audit distributor credit terms and margin structure to ensure partner retention.",
                "pic_role": "Finance Controller",
                "completed": False
            }
        ],
        "status": "pending_approval"
    }
    recommendations.append(rec1)

    # Driver 2: Secondary Contributor (Product or Secondary Region)
    if len(sorted_drivers) > 1:
        sec_driver = sorted_drivers[1]
        s_dim_name = sec_driver.get("dimension", "dimension").capitalize()
        s_dim_val = sec_driver.get("value", "secondary entity")
        s_impact = sec_driver.get("impact_pct", -15.0)
        s_prev = sec_driver.get("previous_val", 200000)
        s_curr = sec_driver.get("current_val", 160000)
        s_drop = max(0.0, float(s_prev - s_curr)) if s_prev and s_curr else 35000.0
        s_recovery = round(s_drop * 0.55, 2)
        s_rec_pct = round(abs(s_impact) * 0.50, 1)

        rec2 = {
            "title": f"Product Pricing & Wholesale Bundling Optimization for {s_dim_val}",
            "rationale": (
                f"{s_dim_name} '{s_dim_val}' showed a {s_impact}% drop. Implementing selective bundle promotions "
                f"with high-margin accessories will protect gross profit while boosting order velocity."
            ),
            "target_dimension": f"{sec_driver.get('dimension')}:{s_dim_val}",
            "estimated_impact_amount": s_recovery,
            "estimated_impact_pct": s_rec_pct,
            "confidence": 0.85,
            "priority": "P1 - High",
            "difficulty": "Low",
            "action_steps": [
                {
                    "id": 1,
                    "step": f"Bundle {s_dim_val} with high-velocity SKU accessories at an attractive 8% promotional discount.",
                    "pic_role": "Merchandising Lead",
                    "completed": False
                },
                {
                    "id": 2,
                    "step": "Review minimum order quantity (MOQ) thresholds for B2B portal orders.",
                    "pic_role": "E-Commerce Director",
                    "completed": False
                },
                {
                    "id": 3,
                    "step": "Send targeted re-engagement email campaign to customers who previously purchased this product line.",
                    "pic_role": "CRM Team",
                    "completed": False
                }
            ],
            "status": "pending_approval"
        }
        recommendations.append(rec2)

    return recommendations

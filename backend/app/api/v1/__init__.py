from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.semantic import router as semantic_router
from app.api.v1.datasources import router as datasources_router
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.memory import router as memory_router
from app.api.v1.roles import router as roles_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.proactive import router as proactive_router
from app.api.v1.outcomes import router as outcomes_router
from app.api.v1.data_quality import router as data_quality_router
from app.api.v1.federation import router as federation_router
from app.api.v1.alerting import router as alerting_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router, prefix="/health", tags=["Health"])
api_v1_router.include_router(semantic_router, prefix="/semantic-layer", tags=["Semantic Layer"])
api_v1_router.include_router(datasources_router, prefix="/data-sources", tags=["Data Sources"])
api_v1_router.include_router(sandbox_router, prefix="/sandbox", tags=["Query Sandbox"])
api_v1_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics & Variance"])
api_v1_router.include_router(memory_router, prefix="/memory", tags=["Agent Memory"])
api_v1_router.include_router(roles_router, prefix="/roles", tags=["RBAC & Roles"])
api_v1_router.include_router(conversations_router, prefix="/conversations", tags=["Conversations & Agent"])
api_v1_router.include_router(recommendations_router, tags=["Business Recommendations & Action Plans"])
api_v1_router.include_router(proactive_router, prefix="/proactive", tags=["Proactive Monitoring & Action Agent"])
api_v1_router.include_router(outcomes_router, prefix="/outcomes", tags=["Closed-Loop Outcomes & Learning"])
api_v1_router.include_router(data_quality_router, prefix="/quality", tags=["Data Quality & Schema Sentinel"])
api_v1_router.include_router(federation_router, prefix="/federation", tags=["Multi-Source Federated Joins"])
api_v1_router.include_router(alerting_router, prefix="/alerting", tags=["Real-Time Alerting & Notifications"])




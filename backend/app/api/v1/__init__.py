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


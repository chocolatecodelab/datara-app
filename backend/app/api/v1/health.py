from fastapi import APIRouter
from app.core.config import settings
from app.core.supabase_client import test_supabase_connection

router = APIRouter()


@router.get("")
def health_check():
    supabase_status = test_supabase_connection() if settings.is_supabase_configured else None
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL,
        "supabase": supabase_status,
        "version": "0.1.0",
    }

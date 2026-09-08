import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    """
    Returns a singleton Supabase Client instance configured with 
    SUPABASE_URL and SUPABASE_SECRET_KEY (Service Role).
    Returns None if Supabase credentials are not configured or package is missing.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.is_supabase_configured:
        logger.info("Supabase is not configured. Falling back to local metadata storage.")
        return None

    try:
        from supabase import create_client, Client
        key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        logger.info(f"Supabase Client successfully initialized for: {settings.SUPABASE_URL}")
        return _supabase_client
    except ImportError:
        logger.warning("supabase-py is not installed. Run 'pip install supabase'.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None


def test_supabase_connection() -> Dict[str, Any]:
    """
    Tests connectivity to Supabase Build APIs.
    """
    if not settings.is_supabase_configured:
        return {
            "connected": False,
            "message": "Supabase credentials are not configured in .env",
            "url": None
        }

    client = get_supabase_client()
    if not client:
        return {
            "connected": False,
            "message": "Failed to create Supabase client instance",
            "url": settings.SUPABASE_URL
        }

    try:
        # Perform a lightweight ping query via Supabase PostgREST
        # Try to inspect the datasources or organizations table
        res = client.table("organizations").select("id, name").limit(1).execute()
        return {
            "connected": True,
            "message": "Successfully connected to Supabase Build APIs!",
            "url": settings.SUPABASE_URL,
            "schema_ready": True,
            "data": res.data
        }
    except Exception as e:
        err_msg = str(e)
        # PGRST205 or table not found means API connection is 100% working, schema just needs creation
        if "relation" in err_msg.lower() or "not found" in err_msg.lower() or "404" in err_msg or "PGRST205" in err_msg or "schema cache" in err_msg.lower():
            return {
                "connected": True,
                "message": "Connected to Supabase Build APIs! Schema tables have not been created yet in SQL Editor.",
                "url": settings.SUPABASE_URL,
                "schema_ready": False,
                "detail": "Execute backend/supabase_schema.sql in Supabase Dashboard > SQL Editor to activate tables."
            }
        return {
            "connected": False,
            "message": f"Connection error: {err_msg}",
            "url": settings.SUPABASE_URL,
            "schema_ready": False
        }


def log_audit_to_supabase(
    organization_id: str,
    user_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Asynchronously or synchronously writes an audit trail entry to Supabase audit_logs table.
    Gracefully falls back to local logging if Supabase is unavailable.
    """
    client = get_supabase_client()
    if not client:
        logger.info(f"[LOCAL AUDIT] org={organization_id} user={user_id} action={action}")
        return False

    try:
        client.table("audit_logs").insert({
            "organization_id": organization_id,
            "user_id": user_id,
            "action": action,
            "details": details or {}
        }).execute()
        return True
    except Exception as e:
        logger.warning(f"Could not persist audit log to Supabase: {str(e)}")
        return False

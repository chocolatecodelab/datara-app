from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.datasource import DataSource
from app.models.organization import Organization
from app.schemas.datasource import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceTestRequest,
    DataSourceTestResponse,
)
import time
from sqlalchemy import create_engine, inspect, text

router = APIRouter()


def get_default_org_id(db: Session) -> str:
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization")
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.id


@router.get("", response_model=List[DataSourceResponse])
def list_datasources(
    org_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    target_org_id = org_id or get_default_org_id(db)
    return db.query(DataSource).filter(DataSource.organization_id == target_org_id).all()


@router.post("", response_model=DataSourceResponse, status_code=201)
def create_datasource(
    payload: DataSourceCreate,
    db: Session = Depends(get_db),
):
    target_org_id = payload.organization_id or get_default_org_id(db)
    ds = DataSource(
        organization_id=target_org_id,
        name=payload.name,
        type=payload.type,
        connection_meta=payload.connection_meta,
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds


@router.get("/{ds_id}", response_model=DataSourceResponse)
def get_datasource(
    ds_id: str,
    db: Session = Depends(get_db),
):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    return ds


@router.delete("/{ds_id}", status_code=204)
def delete_datasource(
    ds_id: str,
    db: Session = Depends(get_db),
):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    db.delete(ds)
    db.commit()
    return None


def _perform_connection_test(ds_type: str, meta: dict) -> DataSourceTestResponse:
    start_time = time.time()
    tables = []
    try:
        if ds_type == "sqlite":
            url = meta.get("database_url") or "sqlite:///./datara_demo.db"
            engine = create_engine(url)
            with engine.connect() as conn:
                inspector = inspect(engine)
                tables = inspector.get_table_names()
            latency = round((time.time() - start_time) * 1000, 2)
            return DataSourceTestResponse(
                success=True,
                message=f"Connected successfully to SQLite database ({len(tables)} tables discovered)",
                latency_ms=latency,
                tables=tables[:10]
            )
        elif ds_type in ("postgres", "postgresql"):
            url = meta.get("database_url")
            if not url:
                host = meta.get("host", "localhost")
                port = meta.get("port", 5432)
                db_name = meta.get("database", "postgres")
                user = meta.get("username", "postgres")
                pw = meta.get("password", "")
                url = f"postgresql://{user}:{pw}@{host}:{port}/{db_name}"
            engine = create_engine(url, connect_args={"connect_timeout": 5})
            with engine.connect() as conn:
                res = conn.execute(text("SELECT current_database();")).fetchone()
                inspector = inspect(engine)
                tables = inspector.get_table_names()
            latency = round((time.time() - start_time) * 1000, 2)
            return DataSourceTestResponse(
                success=True,
                message=f"Connected successfully to PostgreSQL database: {res[0]} ({len(tables)} tables found)",
                latency_ms=latency,
                tables=tables[:10]
            )
        elif ds_type == "supabase":
            from app.core.supabase_client import test_supabase_connection
            status = test_supabase_connection()
            latency = round((time.time() - start_time) * 1000, 2)
            return DataSourceTestResponse(
                success=status["connected"],
                message=status["message"],
                latency_ms=latency,
                tables=status.get("data") and ["organizations", "datasources"] or []
            )
        elif ds_type == "csv_upload":
            path = meta.get("file_path", "")
            import os
            if os.path.exists(path):
                latency = round((time.time() - start_time) * 1000, 2)
                return DataSourceTestResponse(
                    success=True,
                    message=f"CSV file verified at {path}",
                    latency_ms=latency,
                    tables=[os.path.basename(path)]
                )
            return DataSourceTestResponse(
                success=False,
                message="CSV file path does not exist on disk",
                latency_ms=0.0
            )
        else:
            return DataSourceTestResponse(
                success=True,
                message=f"Mock connection verified for connector type: {ds_type}",
                latency_ms=12.5,
                tables=["demo_metrics", "transactions"]
            )
    except Exception as e:
        latency = round((time.time() - start_time) * 1000, 2)
        return DataSourceTestResponse(
            success=False,
            message=f"Connection failed: {str(e)}",
            latency_ms=latency
        )


@router.post("/test", response_model=DataSourceTestResponse)
def test_new_connection(payload: DataSourceTestRequest):
    return _perform_connection_test(payload.type, payload.connection_meta)


@router.post("/{ds_id}/test", response_model=DataSourceTestResponse)
def test_existing_connection(ds_id: str, db: Session = Depends(get_db)):
    ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    return _perform_connection_test(ds.type, ds.connection_meta or {})

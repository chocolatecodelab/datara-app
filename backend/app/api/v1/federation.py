from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.analytics.federated_engine import FederatedQueryEngine
from app.schemas.federation import (
    FederatedJoinRequest,
    FederatedQueryResult,
)

router = APIRouter()


@router.post("", response_model=FederatedQueryResult)
@router.post("/federate", response_model=FederatedQueryResult)
def execute_federated_join_query(
    payload: FederatedJoinRequest,
    db: Session = Depends(get_db),
):
    """
    Executes an in-memory heterogeneous multi-source federated join.
    Validates sub-queries via AST sandbox before performing relational merges.
    """
    result = FederatedQueryEngine.execute_federated_join(payload, db=db)
    if not result.success:
        # Return 200 with result payload so clients can see the detailed error message & lineage
        return result
    return result


@router.get("/sample", response_model=FederatedJoinRequest)
@router.get("/federate/sample", response_model=FederatedJoinRequest)
def get_sample_federation_scenario(db: Session = Depends(get_db)):
    """
    Returns a valid pre-configured federated join scenario connecting
    Sales Warehouse transaction stream with CRM Customer profiles.
    """
    return FederatedQueryEngine.get_sample_federation_scenario(db=db)


@router.get("/run-sample", response_model=FederatedQueryResult)
@router.get("/federate/run-sample", response_model=FederatedQueryResult)
def run_sample_federation_scenario(db: Session = Depends(get_db)):
    """
    Directly executes the pre-configured multi-source federated query sample
    and returns merged relational dataset with source lineage breakdown.
    """
    sample_request = FederatedQueryEngine.get_sample_federation_scenario(db=db)
    return FederatedQueryEngine.execute_federated_join(sample_request, db=db)

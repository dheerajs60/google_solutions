from fastapi import APIRouter, HTTPException
from backend.models.schemas import MitigationRequest, MitigationResponse
from backend.services.store import update_mitigation_results
from backend.services.mitigation_service import run_mitigation

router = APIRouter()

@router.post("/mitigate", response_model=MitigationResponse)
async def mitigate_bias(request: MitigationRequest):
    try:
        result = run_mitigation(
            request.audit_id, 
            request.reweighing_strength, 
            request.threshold_adjust, 
            request.apply_postprocessing
        )
        # Persist the mitigation results in the session
        update_mitigation_results(request.audit_id, result.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

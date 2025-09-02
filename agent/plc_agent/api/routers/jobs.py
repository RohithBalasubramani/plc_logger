from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException

from ..store import Store


router = APIRouter()


@router.get("/jobs")
def list_jobs() -> Dict[str, List[Dict[str, Any]]]:
    return {"items": Store.instance().list_jobs()}


@router.post("/jobs")
def create_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return Store.instance().create_job(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/jobs/{job_id}/start")
def start_job(job_id: str) -> Dict[str, Any]:
    job = Store.instance().set_job_status(job_id, "running")
    if not job:
        raise HTTPException(status_code=404, detail="not_found")
    return job


@router.post("/jobs/{job_id}/stop")
def stop_job(job_id: str) -> Dict[str, Any]:
    job = Store.instance().set_job_status(job_id, "stopped")
    if not job:
        raise HTTPException(status_code=404, detail="not_found")
    return job


@router.post("/jobs/{job_id}/dry_run")
def dry_run_job(job_id: str) -> Dict[str, Any]:
    job = Store.instance().get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="not_found")
    # Stub metrics
    return {"ok": True, "job": job_id, "duration_s": 60, "metrics": {"readRate": 0, "writeRate": 0}}


@router.post("/jobs/{job_id}/backfill")
def backfill_job(job_id: str) -> Dict[str, Any]:
    job = Store.instance().get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True, "job": job_id, "snapshot": True}


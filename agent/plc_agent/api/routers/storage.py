from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from ..store import Store


router = APIRouter(prefix="/storage")


@router.post("/targets")
def add_target(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return Store.instance().add_db_target(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/targets/test")
def test_target(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Stubbed success
    target_id = payload.get("id")
    if target_id and not Store.instance().get_db_target(target_id):
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True, "message": "Connection OK (stub)"}


@router.post("/targets/default")
def set_default(payload: Dict[str, Any]) -> Dict[str, Any]:
    tid = payload.get("id")
    if not tid:
        raise HTTPException(status_code=400, detail="id required")
    if not Store.instance().get_db_target(tid):
        raise HTTPException(status_code=404, detail="not_found")
    Store.instance().set_default_db_target(tid)
    return {"ok": True, "defaultId": tid}


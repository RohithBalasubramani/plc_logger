from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException

from ..store import Store


router = APIRouter()


@router.get("/schemas")
def list_schemas() -> Dict[str, List[Dict[str, Any]]]:
    return {"items": Store.instance().list_schemas()}


@router.post("/schemas")
def create_schema(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return Store.instance().create_schema(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/schemas/export")
def export_schemas() -> Dict[str, Any]:
    return {"schemas": Store.instance().list_schemas()}


@router.post("/schemas/import")
def import_schemas(payload: Dict[str, Any]) -> Dict[str, Any]:
    count = Store.instance().import_schemas(payload.get("schemas") or payload.get("items") or [])
    return {"imported": count}


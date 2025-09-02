from fastapi import APIRouter

from ..version import VERSION


router = APIRouter()


@router.get("/health")
def get_health():
    return {"status": "ok", "agent": "plc-agent", "version": VERSION}


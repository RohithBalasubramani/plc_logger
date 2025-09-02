from typing import Dict, Any

from fastapi import APIRouter


router = APIRouter(prefix="/networking")


@router.post("/modbus/test")
def test_modbus(params: Dict[str, Any]) -> Dict[str, Any]:
    # Stubbed response: echo params and pretend success
    host = params.get("host") or params.get("ip") or "127.0.0.1"
    port = params.get("port", 502)
    unit = params.get("unitId", 1)
    return {"ok": True, "protocol": "modbus", "host": host, "port": port, "unit": unit, "latencyMs": 5}


@router.post("/opcua/test")
def test_opcua(params: Dict[str, Any]) -> Dict[str, Any]:
    # Stubbed response
    endpoint = params.get("endpoint", "opc.tcp://127.0.0.1:4840")
    return {"ok": False, "protocol": "opcua", "endpoint": endpoint, "message": "Not implemented"}
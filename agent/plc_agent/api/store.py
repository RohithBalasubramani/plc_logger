from __future__ import annotations

import threading
import time
from typing import Dict, Any, List, Optional


class Store:
    _inst: Optional["Store"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._mtx = threading.RLock()
        self._schemas: List[Dict[str, Any]] = []
        self._jobs: List[Dict[str, Any]] = []
        self._db_targets: Dict[str, Dict[str, Any]] = {}
        self._default_db_target_id: Optional[str] = None

    @classmethod
    def instance(cls) -> "Store":
        with cls._lock:
            if cls._inst is None:
                cls._inst = Store()
            return cls._inst

    # ---------------- Schemas ----------------
    def list_schemas(self) -> List[Dict[str, Any]]:
        with self._mtx:
            return list(self._schemas)

    def create_schema(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        name = (payload.get("name") or "").strip()
        if not name:
            raise ValueError("name required")
        schema = {
            "id": payload.get("id") or f"sch_{int(time.time()*1000)}",
            "name": name,
            "fields": payload.get("fields") or [],
        }
        with self._mtx:
            self._schemas.append(schema)
        return schema

    def import_schemas(self, items: List[Dict[str, Any]]) -> int:
        if not isinstance(items, list):
            return 0
        with self._mtx:
            for it in items:
                if not it or not it.get("name"):
                    continue
                self._schemas.append({
                    "id": it.get("id") or f"sch_{int(time.time()*1000)}",
                    "name": it.get("name"),
                    "fields": it.get("fields") or [],
                })
        return len(items)

    # ---------------- Jobs ----------------
    def list_jobs(self) -> List[Dict[str, Any]]:
        with self._mtx:
            return list(self._jobs)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._mtx:
            return next((j for j in self._jobs if j.get("id") == job_id), None)

    def create_job(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        name = (payload.get("name") or "").strip()
        if not name:
            raise ValueError("name required")
        job = {
            "id": payload.get("id") or f"job_{int(time.time()*1000)}",
            "name": name,
            "type": payload.get("type") or "continuous",
            "tables": payload.get("tables") or [],
            "columns": payload.get("columns") or "all",
            "intervalMs": payload.get("intervalMs") or 1000,
            "enabled": bool(payload.get("enabled", False)),
            "status": payload.get("status") or "stopped",
            "batching": payload.get("batching") or {},
            "cpuBudget": payload.get("cpuBudget") or "balanced",
            "metrics": payload.get("metrics") or {},
        }
        with self._mtx:
            self._jobs.append(job)
        return job

    def set_job_status(self, job_id: str, status: str) -> Optional[Dict[str, Any]]:
        with self._mtx:
            for j in self._jobs:
                if j.get("id") == job_id:
                    j["status"] = status
                    return j
        return None

    # -------------- DB Targets --------------
    def add_db_target(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        provider = (payload.get("provider") or "").strip() or "sqlite"
        conn = (payload.get("conn") or "").strip() or ":memory:"
        tid = payload.get("id") or f"db_{int(time.time()*1000)}"
        item = {"id": tid, "provider": provider, "conn": conn, "status": payload.get("status") or "untested", "lastMsg": payload.get("lastMsg")}
        with self._mtx:
            self._db_targets[tid] = item
        return item

    def get_db_target(self, tid: str) -> Optional[Dict[str, Any]]:
        with self._mtx:
            return self._db_targets.get(tid)

    def set_default_db_target(self, tid: str) -> None:
        with self._mtx:
            self._default_db_target_id = tid


from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .version import VERSION
from .routers import health, schemas, jobs, networking, storage


def create_app() -> FastAPI:
    app = FastAPI(title="PLC Logger Agent", version=VERSION)

    # CORS for local dev (Desktop app or browser hitting localhost)
    allow_origins = [
        os.environ.get("CORS_ORIGIN", "http://127.0.0.1:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router)
    app.include_router(schemas.router)
    app.include_router(jobs.router)
    app.include_router(networking.router)
    app.include_router(storage.router)

    return app


# Exposed for `uvicorn agent.plc_agent.api.app:app`
app = create_app()


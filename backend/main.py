"""
FastAPI application — serves the crude oil prediction model.
Endpoints:
  POST /forecast     — Run prediction for a given symbol + horizon
  GET  /health       — Health check
  POST /retrain      — Trigger manual retraining
  GET  /retrain/status — Check last retrain status
"""

import os
import sys
import json
import threading
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure backend directory is on the path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MODEL_DIR, EXPERIMENTS
from data_ingestion import fetch_all_data
from model import check_models_exist
from forecasting import build_forecast
from market import router as market_router


# ======================================================================
# Pydantic Models (match frontend api.ts interfaces)
# ======================================================================

class ScenarioOverrides(BaseModel):
    opec_cut_pct: Optional[float] = None
    usd_index: Optional[float] = None
    demand_growth: Optional[float] = None


class ForecastRequest(BaseModel):
    symbol: str = Field(..., description="'brent' or 'wti'")
    horizon: int = Field(..., description="7 or 30 (mapped to 1 or 7 internally)")
    overrides: Optional[ScenarioOverrides] = None


class ForecastResponse(BaseModel):
    symbol: str
    horizon: int
    forecast: list[float]
    lower_ci: list[float]
    upper_ci: list[float]
    direction: str
    confidence: float
    model_version: str
    retrained_at: str


# ======================================================================
# Retrain State (in-memory)
# ======================================================================

_retrain_state = {
    "status": "idle",  # idle | running | completed | failed
    "last_retrained_at": None,
    "last_error": None,
}
_retrain_lock = threading.Lock()


def _run_retrain_sync():
    """Run retraining in a background thread."""
    global _retrain_state
    with _retrain_lock:
        if _retrain_state["status"] == "running":
            return
        _retrain_state["status"] = "running"
        _retrain_state["last_error"] = None

    try:
        from retrain import run_full_retrain

        run_full_retrain()
        with _retrain_lock:
            _retrain_state["status"] = "completed"
            _retrain_state["last_retrained_at"] = datetime.utcnow().isoformat()
    except Exception as exc:
        with _retrain_lock:
            _retrain_state["status"] = "failed"
            _retrain_state["last_error"] = str(exc)
        print(f"[RETRAIN ERROR] {exc}")


# ======================================================================
# Scheduler Integration
# ======================================================================

def _start_scheduler():
    """Start the weekly retraining scheduler (best-effort)."""
    try:
        from scheduler import start_scheduler

        start_scheduler()
        print("[SCHEDULER] Weekly retraining scheduler started.")
    except Exception as exc:
        print(f"[SCHEDULER WARNING] Could not start scheduler: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: start the weekly retrain scheduler unless disabled
    # (set DISABLE_SCHEDULER=1 where retraining runs in GitHub Actions).
    if os.getenv("DISABLE_SCHEDULER", "").lower() not in ("1", "true", "yes"):
        _start_scheduler()

    # Check if retrain log exists
    log_path = os.path.join(MODEL_DIR, "retrain_log.json")
    if os.path.exists(log_path):
        try:
            with open(log_path, "r") as f:
                log = json.load(f)
            _retrain_state["last_retrained_at"] = log.get("last_retrained_at")
            _retrain_state["status"] = "completed"
        except Exception:
            pass

    yield
    # Shutdown: nothing special needed


# ======================================================================
# FastAPI App
# ======================================================================

app = FastAPI(
    title="Crude Oil Price Prediction API",
    version="1.0.0",
    description="Stacked ensemble (LSTM + XGBoost + LightGBM + Ridge) for WTI & Brent price forecasting.",
    lifespan=lifespan,
)

app.include_router(market_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": check_models_exist(),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/forecast", response_model=ForecastResponse)
async def get_forecast(request: ForecastRequest):
    symbol = request.symbol.lower()
    if symbol not in ("brent", "wti"):
        raise HTTPException(status_code=400, detail=f"Invalid symbol: {symbol}")

    if not check_models_exist():
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run POST /retrain first or execute the notebook.",
        )

    try:
        df = fetch_all_data(force_refresh=False)
        return ForecastResponse(**build_forecast(df, symbol, request.horizon))
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model artifacts not found. Please train the model first.",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/retrain")
async def trigger_retrain(x_retrain_token: Optional[str] = Header(default=None)):
    # When RETRAIN_TOKEN is set (any public deployment), require it in the
    # X-Retrain-Token header so strangers can't start a CPU-heavy job.
    expected = os.getenv("RETRAIN_TOKEN")
    if expected and x_retrain_token != expected:
        raise HTTPException(status_code=401, detail="Missing or invalid X-Retrain-Token header.")

    if _retrain_state["status"] == "running":
        return {"message": "Retraining already in progress.", "status": "running"}

    thread = threading.Thread(target=_run_retrain_sync, daemon=True)
    thread.start()
    return {"message": "Retraining started in background.", "status": "running"}


@app.get("/retrain/status")
async def retrain_status():
    return {
        "status": _retrain_state["status"],
        "last_retrained_at": _retrain_state["last_retrained_at"],
        "last_error": _retrain_state["last_error"],
    }


# ======================================================================
# Run with: python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# ======================================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

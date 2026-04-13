"""
Centralized configuration for the Crude Oil Prediction backend.
Loads API keys from .env and defines constants mirrored from the notebook.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load .env from the backend directory
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env")

# ---------------------------------------------------------------------------
# API Keys
# ---------------------------------------------------------------------------
EIA_API_KEY: str = os.getenv("EIA_API_KEY", "YOUR_EIA_KEY")
FRED_API_KEY: str = os.getenv("FRED_API_KEY", "YOUR_FRED_KEY")
NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "YOUR_NEWS_KEY")

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------
MODEL_DIR: str = os.getenv("MODEL_DIR", str(_BACKEND_DIR / "models"))
CACHE_DIR: str = os.getenv("CACHE_DIR", str(_BACKEND_DIR / "cache"))
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Date Range (default: past 5 years)
# ---------------------------------------------------------------------------
import pandas as pd
import numpy as np

END_DATE = pd.Timestamp.today().normalize()
START_DATE = (END_DATE - pd.DateOffset(years=5)).normalize()

# ---------------------------------------------------------------------------
# EIA Series Definitions
# ---------------------------------------------------------------------------
EIA_SPOT_SERIES = {"RWTC": "eia_wti_spot", "RBRTE": "eia_brent_spot"}
EIA_INVENTORY_SERIES = "PET.WCRSTUS1.W"
EIA_RIG_COUNT_CANDIDATES = [
    "PET.E_ERTRRO_XR0_NUS_C",
    "PET.E_ERTRRO_XR0_NUS_M",
    "PET.E_ERTRRO_XR0_NUS_D",
]

# ---------------------------------------------------------------------------
# FRED Series Definitions
# ---------------------------------------------------------------------------
FRED_SERIES = {
    "DGS10": "fred_dgs10",
    "DEXUSEU": "fred_dexuseu",
    "DCOILWTICO": "fred_dcoilwtico",
    "CPIAUCSL": "fred_cpi",
    "UNRATE": "fred_unrate",
}

# ---------------------------------------------------------------------------
# Yahoo Finance Tickers
# ---------------------------------------------------------------------------
YF_TICKERS = ["CL=F", "BZ=F", "DX-Y.NYB", "GC=F", "^GSPC"]

# ---------------------------------------------------------------------------
# News Sentiment
# ---------------------------------------------------------------------------
NEWS_QUERY = '"crude oil" OR "OPEC" OR "petroleum"'

# ---------------------------------------------------------------------------
# Model Hyperparameters
# ---------------------------------------------------------------------------
SEED = 42
SEQUENCE_LENGTH = 30
STACKING_SPLITS = 3
LSTM_EPOCHS_MAIN = 80
LSTM_EPOCHS_OOF = 35
BATCH_SIZE = 32

# ---------------------------------------------------------------------------
# Experiment Definitions
# ---------------------------------------------------------------------------
EXPERIMENTS = [
    ("WTI_close", 1),
    ("WTI_close", 7),
    ("Brent_close", 1),
    ("Brent_close", 7),
]


def is_placeholder_key(key: str) -> bool:
    """Check if an API key is still a placeholder."""
    if key is None:
        return True
    key = str(key).strip()
    return key == "" or key.startswith("YOUR_")

"""
Batch forecast job (run daily by .github/workflows/forecast.yml).

Loads the trained models from MODEL_DIR, forecasts every symbol x horizon the
dashboard offers, and writes them to <out>/forecasts.json:

    {
      "generated_at": "...",
      "forecasts": { "wti_7": {...ForecastResponse...}, "wti_30": {...}, ... }
    }

Usage:  python predict_batch.py --out ../data-out
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_ingestion import fetch_all_data
from forecasting import HORIZONS, SYMBOLS, build_forecast
from model import check_models_exist


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", required=True, help="Directory to write forecasts.json into")
    args = parser.parse_args()

    if not check_models_exist():
        print("[BATCH] No trained models found in MODEL_DIR. Run retrain.py first.")
        return 1

    df = fetch_all_data(force_refresh=True)
    print(f"[BATCH] Unified dataset shape: {df.shape}")

    forecasts, failures = {}, {}
    for symbol in SYMBOLS:
        for horizon in HORIZONS:
            key = f"{symbol}_{horizon}"
            try:
                forecasts[key] = build_forecast(df, symbol, horizon)
                last = forecasts[key]["forecast"][-1]
                print(f"[BATCH] {key}: {last} ({forecasts[key]['direction']})")
            except Exception as exc:
                failures[key] = str(exc)
                print(f"[BATCH] {key} failed: {exc}")

    if not forecasts:
        print("[BATCH] Every forecast failed; not writing output.")
        return 1

    os.makedirs(args.out, exist_ok=True)
    path = os.path.join(args.out, "forecasts.json")
    with open(path, "w") as f:
        json.dump(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "forecasts": forecasts,
                "failures": failures,
            },
            f,
            indent=2,
        )
    print(f"[BATCH] Wrote {path}")
    return 0 if not failures else 2


if __name__ == "__main__":
    sys.exit(main())

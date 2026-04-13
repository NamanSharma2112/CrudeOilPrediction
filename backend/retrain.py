"""
Retraining script — fetches fresh data and retrains all model experiments.
Can be run standalone: python retrain.py
Or triggered via the /retrain API endpoint.
"""

import os
import sys
import json
from datetime import datetime

# Ensure backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MODEL_DIR, EXPERIMENTS
from data_ingestion import fetch_all_data
from model import run_single_experiment


def run_full_retrain():
    """
    Full retraining pipeline:
    1. Fetch fresh data from all sources
    2. Run all experiments (WTI/Brent × 1d/7d)
    3. Save model artifacts
    4. Log results
    """
    print("=" * 80)
    print(f"[RETRAIN] Starting full retraining at {datetime.utcnow().isoformat()}")
    print("=" * 80)

    # Step 1: Fetch fresh data
    print("\n[RETRAIN] Step 1/3: Fetching fresh data from all sources...")
    df_raw = fetch_all_data(force_refresh=True)
    print(f"[RETRAIN] Unified dataset shape: {df_raw.shape}")

    # Step 2: Run all experiments
    print("\n[RETRAIN] Step 2/3: Training models...")
    all_results = {}
    for target_col, horizon in EXPERIMENTS:
        try:
            result = run_single_experiment(
                df_raw, target_col=target_col, horizon=horizon
            )
            all_results[result["task"]] = result["metrics"]
            print(f"[RETRAIN] ✓ Completed: {result['task']}")
        except Exception as exc:
            print(f"[RETRAIN] ✗ Failed: target={target_col}, h={horizon}: {exc}")
            all_results[f"{target_col.lower()}_h{horizon}"] = {"error": str(exc)}

    # Step 3: Save retrain log
    print("\n[RETRAIN] Step 3/3: Saving retrain log...")
    log = {
        "last_retrained_at": datetime.utcnow().isoformat(),
        "experiments": all_results,
        "data_shape": list(df_raw.shape),
    }
    log_path = os.path.join(MODEL_DIR, "retrain_log.json")
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2, default=str)
    print(f"[RETRAIN] Log saved to: {log_path}")

    print("=" * 80)
    print(f"[RETRAIN] Completed at {datetime.utcnow().isoformat()}")
    print("=" * 80)

    return log


if __name__ == "__main__":
    run_full_retrain()

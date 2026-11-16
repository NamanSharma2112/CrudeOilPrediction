"""
Turns the stacked model's prediction into the response the dashboard expects.
Shared by the FastAPI /forecast endpoint and the batch job (predict_batch.py).
"""

import pandas as pd

from model import forecast_latest

SYMBOLS = ("wti", "brent")
HORIZONS = (7, 30)

# Frontend horizons (days) -> trained model horizon. Only 1- and 7-day models
# exist, so the 30-day view extends the 7-day prediction line.
HORIZON_MAP = {1: 1, 7: 7, 30: 7}


def build_forecast(df: pd.DataFrame, symbol: str, horizon: int) -> dict:
    symbol = symbol.lower()
    if symbol not in SYMBOLS:
        raise ValueError(f"Invalid symbol: {symbol}")

    model_horizon = HORIZON_MAP.get(horizon, 7)
    target_col = "WTI_close" if symbol == "wti" else "Brent_close"
    result = forecast_latest(df, target_col=target_col, horizon=model_horizon)

    base_price = result["base_price"]
    pred_stacked = result["pred_stacked"]

    # Straight line from the latest close to the predicted price.
    forecast_values = [
        round(base_price + (i + 1) / horizon * (pred_stacked - base_price), 2)
        for i in range(horizon)
    ]

    # ±2% band, widening over the horizon.
    lower_ci = [round(v * (1 - 0.02 * (i + 1) / horizon), 2) for i, v in enumerate(forecast_values)]
    upper_ci = [round(v * (1 + 0.02 * (i + 1) / horizon), 2) for i, v in enumerate(forecast_values)]

    delta = pred_stacked - base_price
    direction = "bullish" if delta > 0.5 else "bearish" if delta < -0.5 else "neutral"

    # Heuristic: how closely the three base models agree.
    preds = [result["pred_lstm"], result["pred_xgb"], result["pred_lgbm"]]
    spread = max(preds) - min(preds)
    confidence = max(0.0, min(1.0, 1.0 - spread / base_price * 10))

    return {
        "symbol": symbol,
        "horizon": horizon,
        "forecast": forecast_values,
        "lower_ci": lower_ci,
        "upper_ci": upper_ci,
        "direction": direction,
        "confidence": round(confidence, 3),
        "model_version": result.get("model_version", "unknown"),
        "retrained_at": result.get("model_version", "unknown"),
    }

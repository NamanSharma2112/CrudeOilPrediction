"""
Feature Engineering — technical indicators, calendar features, lag/rolling features.
Extracted from crudeoil.ipynb section 5.
"""

import numpy as np
import pandas as pd

from config import SEQUENCE_LENGTH


# ======================================================================
# Technical Indicator Computations
# ======================================================================

def compute_rsi(series: pd.Series, window: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    rs = avg_gain / (avg_loss + 1e-9)
    return 100 - (100 / (1 + rs))


def compute_macd(series: pd.Series):
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    hist = macd - signal
    return macd, signal, hist


def compute_bollinger(series: pd.Series, window: int = 20, n_std: float = 2.0):
    ma = series.rolling(window).mean()
    std = series.rolling(window).std()
    upper = ma + n_std * std
    lower = ma - n_std * std
    return ma, upper, lower


def compute_atr(
    high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14
) -> pd.Series:
    prev_close = close.shift(1)
    tr = pd.concat(
        [(high - low), (high - prev_close).abs(), (low - prev_close).abs()],
        axis=1,
    ).max(axis=1)
    return tr.rolling(window).mean()


# ======================================================================
# Feature Enrichment
# ======================================================================

def add_technical_and_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    # WTI futures technicals from CL=F
    if all(c in out.columns for c in ["CL_F_close", "CL_F_high", "CL_F_low"]):
        out["wti_rsi14"] = compute_rsi(out["CL_F_close"], 14)
        macd, signal, hist = compute_macd(out["CL_F_close"])
        out["wti_macd"] = macd
        out["wti_macd_signal"] = signal
        out["wti_macd_hist"] = hist
        bb_mid, bb_up, bb_low = compute_bollinger(out["CL_F_close"], 20, 2.0)
        out["wti_bb_mid"] = bb_mid
        out["wti_bb_up"] = bb_up
        out["wti_bb_low"] = bb_low
        out["wti_atr14"] = compute_atr(
            out["CL_F_high"], out["CL_F_low"], out["CL_F_close"], 14
        )

    # Brent futures technicals from BZ=F
    if all(c in out.columns for c in ["BZ_F_close", "BZ_F_high", "BZ_F_low"]):
        out["brent_rsi14"] = compute_rsi(out["BZ_F_close"], 14)
        macd, signal, hist = compute_macd(out["BZ_F_close"])
        out["brent_macd"] = macd
        out["brent_macd_signal"] = signal
        out["brent_macd_hist"] = hist
        bb_mid, bb_up, bb_low = compute_bollinger(out["BZ_F_close"], 20, 2.0)
        out["brent_bb_mid"] = bb_mid
        out["brent_bb_up"] = bb_up
        out["brent_bb_low"] = bb_low
        out["brent_atr14"] = compute_atr(
            out["BZ_F_high"], out["BZ_F_low"], out["BZ_F_close"], 14
        )

    # Calendar features
    out["day_of_week"] = out.index.dayofweek
    out["month"] = out.index.month
    out["is_month_end"] = out.index.is_month_end.astype(int)
    return out


# ======================================================================
# Build Modeling Frame & Supervised Views
# ======================================================================

def build_modeling_frame(
    base_df: pd.DataFrame, target_col: str, horizon: int
) -> pd.DataFrame:
    df = base_df.copy()

    # LSTM lag/rolling features
    df["price_lag_1"] = df[target_col].shift(1)
    df["price_lag_3"] = df[target_col].shift(3)
    df["price_lag_7"] = df[target_col].shift(7)
    df["rolling_mean_7"] = df[target_col].rolling(7).mean()
    df["rolling_std_7"] = df[target_col].rolling(7).std()
    df["rolling_mean_14"] = df[target_col].rolling(14).mean()

    # GBM-specific features
    df = add_technical_and_calendar_features(df)

    # Forecast target
    df["target"] = df[target_col].shift(-horizon)

    df = df.ffill()
    df = df.dropna()
    return df


def make_supervised_views(
    model_df: pd.DataFrame,
    target_col: str,
    sequence_length: int = SEQUENCE_LENGTH,
) -> dict:
    numeric_cols = model_df.select_dtypes(include=[np.number]).columns.tolist()
    if "target" not in numeric_cols:
        raise ValueError("Target column missing from modeling frame.")

    feature_cols = [c for c in numeric_cols if c != "target"]
    lstm_feature_cols = feature_cols.copy()
    gbm_feature_cols = feature_cols.copy()

    X_seq, X_flat, y, base_price = [], [], [], []
    origin_dates = []
    for i in range(sequence_length, len(model_df)):
        past_window = model_df.iloc[i - sequence_length : i]
        X_seq.append(past_window[lstm_feature_cols].values.astype(np.float32))
        X_flat.append(model_df.iloc[i][gbm_feature_cols].values.astype(np.float32))
        y.append(float(model_df.iloc[i]["target"]))
        base_price.append(float(model_df.iloc[i][target_col]))
        origin_dates.append(model_df.index[i])

    return {
        "X_seq": np.array(X_seq, dtype=np.float32),
        "X_flat": np.array(X_flat, dtype=np.float32),
        "y": np.array(y, dtype=np.float32),
        "base_price": np.array(base_price, dtype=np.float32),
        "origin_dates": pd.to_datetime(origin_dates),
        "lstm_feature_cols": lstm_feature_cols,
        "gbm_feature_cols": gbm_feature_cols,
    }


def chronological_split_indices(
    n_samples: int, train_ratio: float = 0.70, val_ratio: float = 0.15
):
    train_end = int(n_samples * train_ratio)
    val_end = int(n_samples * (train_ratio + val_ratio))
    return train_end, val_end

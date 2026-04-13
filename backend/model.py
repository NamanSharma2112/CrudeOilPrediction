"""
Model lifecycle — build, train, save, load, and predict.
Extracted from crudeoil.ipynb section 6.
"""

import os
import json
import random
import warnings
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
import joblib

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit

from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
import lightgbm as lgb

from config import (
    SEED,
    SEQUENCE_LENGTH,
    STACKING_SPLITS,
    LSTM_EPOCHS_MAIN,
    LSTM_EPOCHS_OOF,
    BATCH_SIZE,
    MODEL_DIR,
    EXPERIMENTS,
)
from features import (
    build_modeling_frame,
    make_supervised_views,
    chronological_split_indices,
)

# Reproducibility
warnings.filterwarnings("ignore")
np.random.seed(SEED)
random.seed(SEED)
tf.random.set_seed(SEED)


# ======================================================================
# Metrics
# ======================================================================

def directional_accuracy(
    y_true: np.ndarray, y_pred: np.ndarray, base_price: np.ndarray
) -> float:
    actual_dir = np.sign(y_true - base_price)
    pred_dir = np.sign(y_pred - base_price)
    return float(np.mean(actual_dir == pred_dir))


def compute_regression_metrics(
    y_true: np.ndarray, y_pred: np.ndarray, base_price: np.ndarray
) -> dict:
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    denom = np.where(np.abs(y_true) < 1e-8, 1e-8, np.abs(y_true))
    mape = np.mean(np.abs((y_true - y_pred) / denom)) * 100
    r2 = r2_score(y_true, y_pred)
    dir_acc = directional_accuracy(y_true, y_pred, base_price) * 100
    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "MAPE": float(mape),
        "R2": float(r2),
        "Dir Accuracy": float(dir_acc),
    }


# ======================================================================
# LSTM
# ======================================================================

def build_lstm_model(input_shape: tuple) -> tf.keras.Model:
    model = Sequential(
        [
            LSTM(128, return_sequences=True, dropout=0.2, input_shape=input_shape),
            LSTM(64, return_sequences=False, dropout=0.2),
            Dense(32, activation="relu"),
            Dense(1),
        ]
    )
    model.compile(optimizer=Adam(learning_rate=0.001), loss=tf.keras.losses.Huber())
    return model


def scale_lstm_sequences_fit(X_seq_train: np.ndarray, y_train: np.ndarray):
    n, t, f = X_seq_train.shape
    feat_scaler = MinMaxScaler()
    X_train_2d = X_seq_train.reshape(-1, f)
    X_train_scaled = feat_scaler.fit_transform(X_train_2d).reshape(n, t, f)
    y_scaler = MinMaxScaler()
    y_train_scaled = y_scaler.fit_transform(y_train.reshape(-1, 1)).ravel()
    return feat_scaler, y_scaler, X_train_scaled, y_train_scaled


def scale_lstm_sequences_transform(
    X_seq: np.ndarray, feat_scaler: MinMaxScaler
) -> np.ndarray:
    n, t, f = X_seq.shape
    X_2d = X_seq.reshape(-1, f)
    X_scaled = feat_scaler.transform(X_2d).reshape(n, t, f)
    return X_scaled


def train_lstm_single_split(
    X_seq_train: np.ndarray,
    y_train: np.ndarray,
    X_seq_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int,
):
    feat_scaler, y_scaler, X_train_scaled, y_train_scaled = scale_lstm_sequences_fit(
        X_seq_train, y_train
    )
    X_val_scaled = scale_lstm_sequences_transform(X_seq_val, feat_scaler)
    y_val_scaled = y_scaler.transform(y_val.reshape(-1, 1)).ravel()

    model = build_lstm_model(
        input_shape=(X_train_scaled.shape[1], X_train_scaled.shape[2])
    )
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, min_lr=1e-5),
    ]
    model.fit(
        X_train_scaled,
        y_train_scaled,
        validation_data=(X_val_scaled, y_val_scaled),
        epochs=epochs,
        batch_size=BATCH_SIZE,
        verbose=0,
        callbacks=callbacks,
    )
    return model, feat_scaler, y_scaler


# ======================================================================
# XGBoost / LightGBM
# ======================================================================

def train_xgb_single_split(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
):
    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=SEED,
    )
    try:
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
            early_stopping_rounds=30,
        )
    except Exception as exc:
        print(f"[XGBOOST WARNING] Early stopping unavailable: {exc}")
        model.fit(X_train, y_train)
    return model


def train_lgbm_single_split(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
):
    model = LGBMRegressor(
        objective="regression",
        metric="rmse",
        num_leaves=63,
        learning_rate=0.05,
        n_estimators=500,
        random_state=SEED,
    )
    try:
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            eval_metric="rmse",
            callbacks=[lgb.early_stopping(30, verbose=False)],
        )
    except Exception as exc:
        print(f"[LIGHTGBM WARNING] Early stopping unavailable: {exc}")
        model.fit(X_train, y_train)
    return model


# ======================================================================
# Stacking (OOF)
# ======================================================================

def build_level1_oof_predictions(
    X_seq_tv: np.ndarray,
    X_flat_tv: np.ndarray,
    y_tv: np.ndarray,
    n_splits: int = STACKING_SPLITS,
):
    tscv = TimeSeriesSplit(n_splits=n_splits)
    n = len(y_tv)
    oof = np.full((n, 3), np.nan, dtype=np.float32)

    for fold, (tr_idx, va_idx) in enumerate(tscv.split(X_flat_tv), start=1):
        print(f"[OOF] Fold {fold}/{n_splits} | train={len(tr_idx):,} val={len(va_idx):,}")
        if len(tr_idx) < 100 or len(va_idx) < 20:
            print("[OOF] Fold skipped due to insufficient samples.")
            continue

        X_seq_tr, X_seq_va = X_seq_tv[tr_idx], X_seq_tv[va_idx]
        X_flat_tr, X_flat_va = X_flat_tv[tr_idx], X_flat_tv[va_idx]
        y_tr, y_va = y_tv[tr_idx], y_tv[va_idx]

        # LSTM fold
        lstm_model, lstm_feat_scaler, lstm_target_scaler = train_lstm_single_split(
            X_seq_tr, y_tr, X_seq_va, y_va, epochs=LSTM_EPOCHS_OOF
        )
        X_va_scaled = scale_lstm_sequences_transform(X_seq_va, lstm_feat_scaler)
        pred_lstm_scaled = lstm_model.predict(X_va_scaled, verbose=0).ravel()
        pred_lstm = lstm_target_scaler.inverse_transform(
            pred_lstm_scaled.reshape(-1, 1)
        ).ravel()

        # GBM fold
        gbm_scaler = StandardScaler()
        X_tr_g = gbm_scaler.fit_transform(X_flat_tr)
        X_va_g = gbm_scaler.transform(X_flat_va)

        xgb_fold = train_xgb_single_split(X_tr_g, y_tr, X_va_g, y_va)
        lgb_fold = train_lgbm_single_split(X_tr_g, y_tr, X_va_g, y_va)

        pred_xgb = xgb_fold.predict(X_va_g).ravel()
        pred_lgb = lgb_fold.predict(X_va_g).ravel()

        oof[va_idx, 0] = pred_lstm
        oof[va_idx, 1] = pred_xgb
        oof[va_idx, 2] = pred_lgb

    valid_mask = ~np.isnan(oof).any(axis=1)
    if valid_mask.sum() == 0:
        raise RuntimeError("No valid OOF predictions generated for stacking.")
    return oof[valid_mask], y_tv[valid_mask], valid_mask


# ======================================================================
# Save / Load Artifacts
# ======================================================================

def save_task_artifacts(
    task_name: str,
    lstm_model: tf.keras.Model,
    xgb_model: XGBRegressor,
    lgbm_model: LGBMRegressor,
    ridge_model: Ridge,
    lstm_feature_scaler: MinMaxScaler,
    lstm_target_scaler: MinMaxScaler,
    gbm_scaler: StandardScaler,
    metadata: dict,
):
    os.makedirs(MODEL_DIR, exist_ok=True)
    lstm_path = os.path.join(MODEL_DIR, f"lstm_{task_name}.keras")
    xgb_path = os.path.join(MODEL_DIR, f"xgb_{task_name}.joblib")
    lgb_path = os.path.join(MODEL_DIR, f"lgbm_{task_name}.joblib")
    ridge_path = os.path.join(MODEL_DIR, f"ridge_{task_name}.joblib")
    lstm_feat_scaler_path = os.path.join(MODEL_DIR, f"lstm_feature_scaler_{task_name}.joblib")
    lstm_target_scaler_path = os.path.join(MODEL_DIR, f"lstm_target_scaler_{task_name}.joblib")
    gbm_scaler_path = os.path.join(MODEL_DIR, f"gbm_scaler_{task_name}.joblib")
    metadata_path = os.path.join(MODEL_DIR, f"metadata_{task_name}.joblib")

    lstm_model.save(lstm_path)
    joblib.dump(xgb_model, xgb_path)
    joblib.dump(lgbm_model, lgb_path)
    joblib.dump(ridge_model, ridge_path)
    joblib.dump(lstm_feature_scaler, lstm_feat_scaler_path)
    joblib.dump(lstm_target_scaler, lstm_target_scaler_path)
    joblib.dump(gbm_scaler, gbm_scaler_path)
    joblib.dump(metadata, metadata_path)

    print(f"[SAVE] Artifacts saved for task: {task_name}")


def load_task_artifacts(task_name: str) -> dict:
    return {
        "lstm_model": tf.keras.models.load_model(
            os.path.join(MODEL_DIR, f"lstm_{task_name}.keras")
        ),
        "xgb_model": joblib.load(os.path.join(MODEL_DIR, f"xgb_{task_name}.joblib")),
        "lgbm_model": joblib.load(os.path.join(MODEL_DIR, f"lgbm_{task_name}.joblib")),
        "ridge_model": joblib.load(os.path.join(MODEL_DIR, f"ridge_{task_name}.joblib")),
        "lstm_feature_scaler": joblib.load(
            os.path.join(MODEL_DIR, f"lstm_feature_scaler_{task_name}.joblib")
        ),
        "lstm_target_scaler": joblib.load(
            os.path.join(MODEL_DIR, f"lstm_target_scaler_{task_name}.joblib")
        ),
        "gbm_scaler": joblib.load(
            os.path.join(MODEL_DIR, f"gbm_scaler_{task_name}.joblib")
        ),
        "metadata": joblib.load(
            os.path.join(MODEL_DIR, f"metadata_{task_name}.joblib")
        ),
    }


def check_models_exist() -> bool:
    """Check if trained model artifacts exist for all experiments."""
    for target_col, horizon in EXPERIMENTS:
        task_name = f"{target_col.lower()}_h{horizon}"
        lstm_path = os.path.join(MODEL_DIR, f"lstm_{task_name}.keras")
        if not os.path.exists(lstm_path):
            return False
    return True


# ======================================================================
# Full Training Pipeline
# ======================================================================

def run_single_experiment(
    base_df: pd.DataFrame, target_col: str, horizon: int
) -> dict:
    print("=" * 80)
    print(f"Running experiment: target={target_col}, horizon={horizon} day(s)")
    model_df = build_modeling_frame(base_df, target_col=target_col, horizon=horizon)
    views = make_supervised_views(
        model_df, target_col=target_col, sequence_length=SEQUENCE_LENGTH
    )

    X_seq = views["X_seq"]
    X_flat = views["X_flat"]
    y = views["y"]
    base_price = views["base_price"]

    n_samples = len(y)
    train_end, val_end = chronological_split_indices(n_samples)
    if train_end <= 0 or val_end <= train_end or val_end >= n_samples:
        raise ValueError("Insufficient samples for 70/15/15 split.")

    X_seq_train = X_seq[:train_end]
    X_seq_val = X_seq[train_end:val_end]
    X_seq_test = X_seq[val_end:]
    X_flat_train = X_flat[:train_end]
    X_flat_val = X_flat[train_end:val_end]
    X_flat_test = X_flat[val_end:]
    y_train = y[:train_end]
    y_val = y[train_end:val_end]
    y_test = y[val_end:]
    base_test = base_price[val_end:]

    print(f"Samples: train={len(y_train):,} | val={len(y_val):,} | test={len(y_test):,}")

    # LSTM
    lstm_model, lstm_feature_scaler, lstm_target_scaler = train_lstm_single_split(
        X_seq_train, y_train, X_seq_val, y_val, epochs=LSTM_EPOCHS_MAIN
    )
    X_seq_test_scaled = scale_lstm_sequences_transform(X_seq_test, lstm_feature_scaler)
    pred_lstm_scaled = lstm_model.predict(X_seq_test_scaled, verbose=0).ravel()
    pred_lstm = lstm_target_scaler.inverse_transform(
        pred_lstm_scaled.reshape(-1, 1)
    ).ravel()

    # GBMs
    gbm_scaler = StandardScaler()
    X_train_g = gbm_scaler.fit_transform(X_flat_train)
    X_val_g = gbm_scaler.transform(X_flat_val)
    X_test_g = gbm_scaler.transform(X_flat_test)

    xgb_model = train_xgb_single_split(X_train_g, y_train, X_val_g, y_val)
    lgbm_model = train_lgbm_single_split(X_train_g, y_train, X_val_g, y_val)

    pred_xgb = xgb_model.predict(X_test_g).ravel()
    pred_lgbm = lgbm_model.predict(X_test_g).ravel()

    # OOF Stacking
    X_seq_tv = X_seq[:val_end]
    X_flat_tv = X_flat[:val_end]
    y_tv = y[:val_end]
    oof_preds, y_oof, _ = build_level1_oof_predictions(
        X_seq_tv=X_seq_tv,
        X_flat_tv=X_flat_tv,
        y_tv=y_tv,
        n_splits=STACKING_SPLITS,
    )
    ridge_meta = Ridge(alpha=1.0)
    ridge_meta.fit(oof_preds, y_oof)

    level1_test = np.column_stack([pred_lstm, pred_xgb, pred_lgbm])
    pred_stack = ridge_meta.predict(level1_test).ravel()

    # Metrics
    metrics = {
        "LSTM": compute_regression_metrics(y_test, pred_lstm, base_test),
        "XGBoost": compute_regression_metrics(y_test, pred_xgb, base_test),
        "LightGBM": compute_regression_metrics(y_test, pred_lgbm, base_test),
        "Stacked(Ridge)": compute_regression_metrics(y_test, pred_stack, base_test),
    }
    print(f"[METRICS] Stacked RMSE = {metrics['Stacked(Ridge)']['RMSE']:.4f}")

    # Save artifacts
    task_name = f"{target_col.lower()}_h{horizon}"
    metadata = {
        "target_col": target_col,
        "horizon": horizon,
        "sequence_length": SEQUENCE_LENGTH,
        "lstm_feature_cols": views["lstm_feature_cols"],
        "gbm_feature_cols": views["gbm_feature_cols"],
        "trained_at": datetime.utcnow().isoformat(),
    }

    save_task_artifacts(
        task_name=task_name,
        lstm_model=lstm_model,
        xgb_model=xgb_model,
        lgbm_model=lgbm_model,
        ridge_model=ridge_meta,
        lstm_feature_scaler=lstm_feature_scaler,
        lstm_target_scaler=lstm_target_scaler,
        gbm_scaler=gbm_scaler,
        metadata=metadata,
    )

    return {"task": task_name, "metrics": metrics}


# ======================================================================
# Inference
# ======================================================================

def forecast_latest(base_df: pd.DataFrame, target_col: str, horizon: int) -> dict:
    """Run inference using the latest data point and saved models."""
    task_name = f"{target_col.lower()}_h{horizon}"
    art = load_task_artifacts(task_name)

    model_df = build_modeling_frame(base_df, target_col=target_col, horizon=horizon)
    views = make_supervised_views(
        model_df, target_col=target_col, sequence_length=SEQUENCE_LENGTH
    )

    X_seq_last = views["X_seq"][-1:]
    X_flat_last = views["X_flat"][-1:]
    base_last = float(views["base_price"][-1])
    origin_date = pd.Timestamp(views["origin_dates"][-1])
    target_date = origin_date + pd.Timedelta(days=horizon)

    # LSTM prediction
    X_seq_last_scaled = scale_lstm_sequences_transform(
        X_seq_last, art["lstm_feature_scaler"]
    )
    pred_lstm_scaled = art["lstm_model"].predict(X_seq_last_scaled, verbose=0).ravel()
    pred_lstm = art["lstm_target_scaler"].inverse_transform(
        pred_lstm_scaled.reshape(-1, 1)
    ).ravel()[0]

    # GBM predictions
    X_flat_last_scaled = art["gbm_scaler"].transform(X_flat_last)
    pred_xgb = art["xgb_model"].predict(X_flat_last_scaled).ravel()[0]
    pred_lgbm = art["lgbm_model"].predict(X_flat_last_scaled).ravel()[0]

    # Stacked prediction
    level1 = np.array([[pred_lstm, pred_xgb, pred_lgbm]], dtype=np.float32)
    pred_stack = art["ridge_model"].predict(level1).ravel()[0]

    return {
        "task": task_name,
        "origin_date": str(origin_date.date()),
        "target_date": str(target_date.date()),
        "base_price": base_last,
        "pred_lstm": float(pred_lstm),
        "pred_xgb": float(pred_xgb),
        "pred_lgbm": float(pred_lgbm),
        "pred_stacked": float(pred_stack),
        "model_version": art["metadata"].get("trained_at", "unknown"),
    }

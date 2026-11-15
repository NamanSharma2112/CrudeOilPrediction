"""
Live market data endpoints (Yahoo Finance via yfinance).

  GET /market/quotes          — latest price, day change and a 30-day sparkline
                                for crude benchmarks and related markets
  GET /market/history?range=  — daily closes for WTI, Brent, DXY, gold, S&P 500,
                                natural gas (1M | 3M | 6M | 1Y | 5Y)

Responses are cached in memory for a short time so the dashboard can poll
every 60 s without hammering Yahoo.
"""

import math
import threading
import time
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/market", tags=["market"])

# key -> (ticker, display name, unit)
INSTRUMENTS = {
    "wti": ("CL=F", "WTI Crude", "$/bbl"),
    "brent": ("BZ=F", "Brent Crude", "$/bbl"),
    "natgas": ("NG=F", "Natural Gas", "$/MMBtu"),
    "heating_oil": ("HO=F", "Heating Oil", "$/gal"),
    "gasoline": ("RB=F", "RBOB Gasoline", "$/gal"),
    "dxy": ("DX-Y.NYB", "US Dollar Index", "index"),
    "gold": ("GC=F", "Gold", "$/oz"),
    "spx": ("^GSPC", "S&P 500", "index"),
}

RANGE_TO_PERIOD = {"1M": "1mo", "3M": "3mo", "6M": "6mo", "1Y": "1y", "5Y": "5y"}

QUOTES_TTL = 60  # seconds
HISTORY_TTL = 300

_cache: dict[str, tuple[float, object]] = {}
_lock = threading.Lock()


def _cached(key: str, ttl: int, fn):
    now = time.time()
    with _lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    value = fn()
    with _lock:
        _cache[key] = (now, value)
    return value


def _clean(v) -> float | None:
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(f) or math.isinf(f) else round(f, 4)


def _download_closes(period: str, interval: str) -> pd.DataFrame:
    tickers = [t for t, _, _ in INSTRUMENTS.values()]
    raw = yf.download(
        tickers,
        period=period,
        interval=interval,
        auto_adjust=False,
        progress=False,
        group_by="ticker",
        threads=True,
    )
    if raw is None or raw.empty:
        raise HTTPException(status_code=502, detail="No data returned from Yahoo Finance")

    closes = {}
    for key, (ticker, _, _) in INSTRUMENTS.items():
        if ticker in raw.columns.get_level_values(0):
            closes[key] = raw[ticker]["Close"]
    df = pd.DataFrame(closes)
    df.index = pd.to_datetime(df.index)
    return df.sort_index()


def _build_quotes() -> dict:
    daily = _download_closes("3mo", "1d")
    try:
        intraday = _download_closes("5d", "5m")
    except Exception:
        intraday = pd.DataFrame()

    quotes = []
    for key, (ticker, name, unit) in INSTRUMENTS.items():
        if key not in daily.columns:
            continue
        series = daily[key].dropna()
        if len(series) < 2:
            continue

        price = float(series.iloc[-1])
        as_of = series.index[-1]
        # Prefer the freshest intraday print when available.
        if key in intraday.columns:
            live = intraday[key].dropna()
            if len(live):
                price = float(live.iloc[-1])
                as_of = live.index[-1]

        prev_close = float(series.iloc[-2])
        change = price - prev_close
        quotes.append(
            {
                "key": key,
                "ticker": ticker,
                "name": name,
                "unit": unit,
                "price": _clean(price),
                "change": _clean(change),
                "change_pct": _clean(change / prev_close * 100 if prev_close else None),
                "as_of": pd.Timestamp(as_of).isoformat(),
                "spark": [
                    {"date": d.strftime("%Y-%m-%d"), "value": _clean(v)}
                    for d, v in series.tail(30).items()
                ],
            }
        )

    return {"quotes": quotes, "fetched_at": datetime.now(timezone.utc).isoformat()}


def _build_history(range_key: str) -> dict:
    df = _download_closes(RANGE_TO_PERIOD[range_key], "1d").ffill().dropna(subset=["wti", "brent"])
    rows = []
    for d, r in df.iterrows():
        row = {"date": d.strftime("%Y-%m-%d")}
        for col in df.columns:
            row[col] = _clean(r[col])
        if row.get("wti") is not None and row.get("brent") is not None:
            row["spread"] = _clean(row["brent"] - row["wti"])
        rows.append(row)
    return {"range": range_key, "rows": rows, "fetched_at": datetime.now(timezone.utc).isoformat()}


@router.get("/quotes")
def market_quotes():
    try:
        return _cached("quotes", QUOTES_TTL, _build_quotes)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Market data error: {exc}")


@router.get("/history")
def market_history(range: str = Query("1Y", pattern="^(1M|3M|6M|1Y|5Y)$")):
    try:
        return _cached(f"history:{range}", HISTORY_TTL, lambda: _build_history(range))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Market data error: {exc}")

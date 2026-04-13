"""
Data Ingestion — fetch and cache data from EIA, FRED, yfinance, and NewsAPI.
Extracted from crudeoil.ipynb sections 2–4.
"""

import os
import time
from typing import Optional

import numpy as np
import pandas as pd
import requests
import yfinance as yf

from config import (
    EIA_API_KEY,
    FRED_API_KEY,
    NEWS_API_KEY,
    CACHE_DIR,
    START_DATE,
    END_DATE,
    EIA_SPOT_SERIES,
    EIA_INVENTORY_SERIES,
    EIA_RIG_COUNT_CANDIDATES,
    FRED_SERIES,
    YF_TICKERS,
    NEWS_QUERY,
    is_placeholder_key,
)

# ======================================================================
# Utility Helpers
# ======================================================================

def cache_file(name: str) -> str:
    return os.path.join(CACHE_DIR, f"{name}.csv")


def load_cached_dataframe(name: str, parse_dates: bool = True) -> Optional[pd.DataFrame]:
    path = cache_file(name)
    if not os.path.exists(path):
        return None
    try:
        df = pd.read_csv(path)
        if parse_dates and "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
        print(f"Loaded cache: {path} ({len(df):,} rows)")
        return df
    except Exception as exc:
        print(f"[CACHE READ ERROR] {name}: {exc}")
        return None


def save_cached_dataframe(df: pd.DataFrame, name: str) -> None:
    path = cache_file(name)
    try:
        to_save = df.copy()
        if isinstance(to_save.index, pd.DatetimeIndex):
            to_save = to_save.reset_index().rename(
                columns={to_save.index.name or "index": "date"}
            )
        to_save.to_csv(path, index=False)
        print(f"Saved cache: {path} ({len(to_save):,} rows)")
    except Exception as exc:
        print(f"[CACHE WRITE ERROR] {name}: {exc}")


def request_json(
    url: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: int = 30,
    retries: int = 3,
):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except Exception as exc:
            last_error = exc
            sleep_for = min(2**attempt, 8)
            print(f"[HTTP RETRY] attempt={attempt}/{retries} | url={url} | error={exc}")
            time.sleep(sleep_for)
    raise RuntimeError(f"Request failed after retries: {url} | error={last_error}")


def to_daily_index(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    out = df.copy()
    if date_col in out.columns:
        out[date_col] = pd.to_datetime(out[date_col], errors="coerce")
        out = out.dropna(subset=[date_col]).set_index(date_col)
    if not isinstance(out.index, pd.DatetimeIndex):
        out.index = pd.to_datetime(out.index, errors="coerce")
    out = out.sort_index()
    out = out[~out.index.duplicated(keep="last")]
    full_range = pd.date_range(START_DATE, END_DATE, freq="D")
    out = out.reindex(full_range)
    out.index.name = "date"
    return out


# ======================================================================
# EIA
# ======================================================================

def fetch_eia_spot_prices(force_refresh: bool = False) -> pd.DataFrame:
    cache_name = "eia_spot_prices"
    if not force_refresh:
        cached = load_cached_dataframe(cache_name)
        if cached is not None and len(cached) > 0:
            return to_daily_index(cached)

    if is_placeholder_key(EIA_API_KEY):
        print("[EIA] Placeholder API key detected. Returning empty EIA spot DataFrame.")
        return to_daily_index(
            pd.DataFrame(columns=["date", "eia_wti_spot", "eia_brent_spot"])
        )

    all_parts = []
    for series_code, col_name in EIA_SPOT_SERIES.items():
        try:
            url = "https://api.eia.gov/v2/petroleum/pri/spt/data/"
            params = {
                "api_key": EIA_API_KEY,
                "frequency": "daily",
                "data[0]": "value",
                "facets[series][]": series_code,
                "start": START_DATE.strftime("%Y-%m-%d"),
                "end": END_DATE.strftime("%Y-%m-%d"),
                "sort[0][column]": "period",
                "sort[0][direction]": "asc",
                "offset": 0,
                "length": 5000,
            }
            payload = request_json(url, params=params)
            records = payload.get("response", {}).get("data", [])
            if len(records) == 0:
                print(f"[EIA] No records for series {series_code}")
                continue

            temp = pd.DataFrame(records)
            period_col = "period" if "period" in temp.columns else "date"
            value_col = "value" if "value" in temp.columns else temp.columns[-1]
            temp = temp[[period_col, value_col]].rename(
                columns={period_col: "date", value_col: col_name}
            )
            temp["date"] = pd.to_datetime(temp["date"], errors="coerce")
            temp[col_name] = pd.to_numeric(temp[col_name], errors="coerce")
            temp = temp.dropna(subset=["date"]).sort_values("date")
            all_parts.append(temp)
            print(f"[EIA] Fetched {len(temp):,} rows for {series_code}")
        except Exception as exc:
            print(f"[EIA ERROR] spot series {series_code}: {exc}")

    if len(all_parts) == 0:
        return to_daily_index(
            pd.DataFrame(columns=["date", "eia_wti_spot", "eia_brent_spot"])
        )

    spot_df = all_parts[0]
    for part in all_parts[1:]:
        spot_df = spot_df.merge(part, on="date", how="outer")
    spot_df = to_daily_index(spot_df)
    save_cached_dataframe(spot_df, cache_name)
    return spot_df


def fetch_eia_legacy_series(
    series_id: str, value_name: str, force_refresh: bool = False
) -> pd.DataFrame:
    cache_name = f"eia_legacy_{series_id.replace('.', '_')}"
    if not force_refresh:
        cached = load_cached_dataframe(cache_name)
        if cached is not None and len(cached) > 0:
            return to_daily_index(cached)

    if is_placeholder_key(EIA_API_KEY):
        print(f"[EIA] Placeholder key. Empty DataFrame for {series_id}.")
        return to_daily_index(pd.DataFrame(columns=["date", value_name]))

    try:
        url = "https://api.eia.gov/series/"
        params = {"api_key": EIA_API_KEY, "series_id": series_id}
        payload = request_json(url, params=params)
        series = payload.get("series", [])
        if len(series) == 0 or "data" not in series[0]:
            raise ValueError(f"No series data returned for {series_id}")

        records = series[0]["data"]
        temp = pd.DataFrame(records, columns=["date", value_name])
        temp["date"] = pd.to_datetime(temp["date"].astype(str), errors="coerce")
        temp[value_name] = pd.to_numeric(temp[value_name], errors="coerce")
        temp = temp.dropna(subset=["date"]).sort_values("date")
        temp = to_daily_index(temp)
        save_cached_dataframe(temp, cache_name)
        return temp
    except Exception as exc:
        print(f"[EIA ERROR] series {series_id}: {exc}")
        return to_daily_index(pd.DataFrame(columns=["date", value_name]))


def fetch_eia_dataset(force_refresh: bool = False) -> pd.DataFrame:
    spot_df = fetch_eia_spot_prices(force_refresh=force_refresh)
    inv_df = fetch_eia_legacy_series(
        series_id=EIA_INVENTORY_SERIES,
        value_name="eia_crude_inventory",
        force_refresh=force_refresh,
    )
    rig_df = None
    for candidate in EIA_RIG_COUNT_CANDIDATES:
        temp = fetch_eia_legacy_series(
            series_id=candidate,
            value_name="eia_rig_count",
            force_refresh=force_refresh,
        )
        if temp["eia_rig_count"].notna().sum() > 0:
            rig_df = temp
            print(f"[EIA] Using rig count series: {candidate}")
            break
    if rig_df is None:
        print("[EIA] Rig count not available. Filling with NaN.")
        rig_df = to_daily_index(pd.DataFrame(columns=["date", "eia_rig_count"]))

    eia_df = spot_df.join(inv_df, how="outer").join(rig_df, how="outer")
    eia_df = to_daily_index(eia_df)
    eia_df = eia_df.ffill()
    print(f"[EIA] shape={eia_df.shape}")
    return eia_df


# ======================================================================
# FRED
# ======================================================================

def fetch_fred_dataset(force_refresh: bool = False) -> pd.DataFrame:
    cache_name = "fred_dataset"
    if not force_refresh:
        cached = load_cached_dataframe(cache_name)
        if cached is not None and len(cached) > 0:
            return to_daily_index(cached).ffill()

    if is_placeholder_key(FRED_API_KEY):
        print("[FRED] Placeholder API key. Returning empty FRED DataFrame.")
        return to_daily_index(
            pd.DataFrame(columns=["date"] + list(FRED_SERIES.values()))
        )

    try:
        from fredapi import Fred

        fred = Fred(api_key=FRED_API_KEY)
    except Exception as exc:
        print(f"[FRED ERROR] Unable to initialize Fred client: {exc}")
        return to_daily_index(
            pd.DataFrame(columns=["date"] + list(FRED_SERIES.values()))
        )

    merged = None
    for series_id, col_name in FRED_SERIES.items():
        try:
            series = fred.get_series(
                series_id,
                observation_start=START_DATE.strftime("%Y-%m-%d"),
                observation_end=END_DATE.strftime("%Y-%m-%d"),
            )
            part = series.rename(col_name).to_frame()
            part.index = pd.to_datetime(part.index, errors="coerce")
            part = part.dropna().sort_index()
            if merged is None:
                merged = part
            else:
                merged = merged.join(part, how="outer")
            print(f"[FRED] Fetched {series_id} ({len(part):,} rows)")
        except Exception as exc:
            print(f"[FRED ERROR] series {series_id}: {exc}")

    if merged is None:
        merged = pd.DataFrame(
            index=pd.date_range(START_DATE, END_DATE, freq="D")
        )

    merged.index.name = "date"
    merged = to_daily_index(merged)
    merged = merged.ffill()
    save_cached_dataframe(merged, cache_name)
    print(f"[FRED] shape={merged.shape}")
    return merged


# ======================================================================
# Yahoo Finance
# ======================================================================

def clean_ticker_name(ticker: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in ticker)


def fetch_yfinance_dataset(force_refresh: bool = False) -> pd.DataFrame:
    cache_name = "yfinance_dataset"
    if not force_refresh:
        cached = load_cached_dataframe(cache_name)
        if cached is not None and len(cached) > 0:
            return to_daily_index(cached).ffill()

    try:
        raw = yf.download(
            YF_TICKERS,
            start=START_DATE.strftime("%Y-%m-%d"),
            end=(END_DATE + pd.Timedelta(days=1)).strftime("%Y-%m-%d"),
            interval="1d",
            auto_adjust=False,
            progress=False,
            group_by="ticker",
            threads=True,
        )
        if raw is None or len(raw) == 0:
            raise ValueError("Empty response from yfinance")

        parts = []
        if isinstance(raw.columns, pd.MultiIndex):
            for ticker in YF_TICKERS:
                if ticker not in raw.columns.get_level_values(0):
                    print(f"[YFINANCE] Missing ticker: {ticker}")
                    continue
                temp = raw[ticker].copy()
                temp.columns = [
                    f"{clean_ticker_name(ticker)}_{str(c).lower()}"
                    for c in temp.columns
                ]
                parts.append(temp)
        else:
            temp = raw.copy()
            temp.columns = [
                f"{clean_ticker_name(YF_TICKERS[0])}_{str(c).lower()}"
                for c in temp.columns
            ]
            parts.append(temp)

        if len(parts) == 0:
            raise ValueError("No ticker data parsed from yfinance response")

        yf_df = pd.concat(parts, axis=1)
        yf_df.index = pd.to_datetime(yf_df.index, errors="coerce")
        yf_df = yf_df.sort_index()
        yf_df = to_daily_index(yf_df)
        yf_df = yf_df.ffill()

        save_cached_dataframe(yf_df, cache_name)
        print(f"[YFINANCE] shape={yf_df.shape}")
        return yf_df
    except Exception as exc:
        print(f"[YFINANCE ERROR] {exc}")
        empty_cols = []
        for ticker in YF_TICKERS:
            safe = clean_ticker_name(ticker)
            empty_cols.extend(
                [
                    f"{safe}_open",
                    f"{safe}_high",
                    f"{safe}_low",
                    f"{safe}_close",
                    f"{safe}_adj close",
                    f"{safe}_volume",
                ]
            )
        return to_daily_index(pd.DataFrame(columns=["date"] + empty_cols))


# ======================================================================
# News Sentiment
# ======================================================================

def fetch_news_sentiment_dataset(
    force_refresh: bool = False, max_pages: int = 20
) -> pd.DataFrame:
    cache_name = "newsapi_sentiment"
    if not force_refresh:
        cached = load_cached_dataframe(cache_name)
        if cached is not None and len(cached) > 0:
            out = to_daily_index(cached)
            if "news_sentiment" in out.columns:
                out["news_sentiment"] = out["news_sentiment"].ffill().fillna(0.0)
            if "news_article_count" in out.columns:
                out["news_article_count"] = out["news_article_count"].ffill().fillna(0.0)
            return out

    empty = to_daily_index(
        pd.DataFrame(columns=["date", "news_sentiment", "news_article_count"])
    )
    if is_placeholder_key(NEWS_API_KEY):
        print("[NEWSAPI] Placeholder API key. Returning empty sentiment DataFrame.")
        empty["news_sentiment"] = 0.0
        empty["news_article_count"] = 0.0
        return empty

    try:
        from newsapi import NewsApiClient
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        client = NewsApiClient(api_key=NEWS_API_KEY)
        analyzer = SentimentIntensityAnalyzer()
    except Exception as exc:
        print(f"[NEWSAPI ERROR] Client initialization failed: {exc}")
        empty["news_sentiment"] = 0.0
        empty["news_article_count"] = 0.0
        return empty

    rows = []
    try:
        for page in range(1, max_pages + 1):
            result = client.get_everything(
                q=NEWS_QUERY,
                from_param=START_DATE.strftime("%Y-%m-%d"),
                to=END_DATE.strftime("%Y-%m-%d"),
                language="en",
                sort_by="publishedAt",
                page_size=100,
                page=page,
            )
            articles = result.get("articles", [])
            if len(articles) == 0:
                break

            for art in articles:
                title = (art.get("title") or "").strip()
                published_at = art.get("publishedAt")
                if published_at is None or title == "":
                    continue
                dt = pd.to_datetime(published_at, errors="coerce")
                if pd.isna(dt):
                    continue
                score = analyzer.polarity_scores(title).get("compound", 0.0)
                rows.append({"date": dt.normalize(), "compound": score})

            total_results = result.get("totalResults", 0)
            if page * 100 >= total_results:
                break
            time.sleep(0.25)

        if len(rows) == 0:
            print("[NEWSAPI] No articles retrieved. Using default zeros.")
            empty["news_sentiment"] = 0.0
            empty["news_article_count"] = 0.0
            return empty

        sentiment = pd.DataFrame(rows)
        sentiment = sentiment.groupby("date", as_index=False).agg(
            news_sentiment=("compound", "mean"),
            news_article_count=("compound", "size"),
        )
        sentiment = to_daily_index(sentiment)
        sentiment["news_sentiment"] = sentiment["news_sentiment"].ffill().fillna(0.0)
        sentiment["news_article_count"] = (
            sentiment["news_article_count"].ffill().fillna(0.0)
        )

        save_cached_dataframe(sentiment, cache_name)
        print(f"[NEWS_SENTIMENT] shape={sentiment.shape}")
        return sentiment
    except Exception as exc:
        print(f"[NEWSAPI ERROR] Fetch failed: {exc}")
        empty["news_sentiment"] = 0.0
        empty["news_article_count"] = 0.0
        return empty


# ======================================================================
# Unified Daily Merge
# ======================================================================

def build_unified_daily_df(
    eia_data: pd.DataFrame,
    fred_data: pd.DataFrame,
    yf_data: pd.DataFrame,
    news_data: pd.DataFrame,
) -> pd.DataFrame:
    merged = eia_data.join(fred_data, how="outer")
    merged = merged.join(yf_data, how="outer")
    merged = merged.join(news_data, how="outer")
    merged = to_daily_index(merged)
    merged = merged.sort_index().ffill()

    for needed_col in [
        "eia_wti_spot",
        "eia_brent_spot",
        "fred_dcoilwtico",
        "CL_F_close",
        "BZ_F_close",
    ]:
        if needed_col not in merged.columns:
            merged[needed_col] = np.nan

    # Canonical targets with fallback order
    merged["WTI_close"] = merged["eia_wti_spot"]
    merged["WTI_close"] = merged["WTI_close"].combine_first(merged["CL_F_close"])
    merged["WTI_close"] = merged["WTI_close"].combine_first(merged["fred_dcoilwtico"])

    merged["Brent_close"] = merged["eia_brent_spot"]
    merged["Brent_close"] = merged["Brent_close"].combine_first(merged["BZ_F_close"])

    merged = merged.ffill()
    merged = merged.dropna(subset=["WTI_close", "Brent_close"])
    return merged


def fetch_all_data(force_refresh: bool = False) -> pd.DataFrame:
    """Convenience wrapper: fetch everything and return the unified DataFrame."""
    eia_df = fetch_eia_dataset(force_refresh=force_refresh)
    fred_df = fetch_fred_dataset(force_refresh=force_refresh)
    yf_df = fetch_yfinance_dataset(force_refresh=force_refresh)
    news_df = fetch_news_sentiment_dataset(force_refresh=force_refresh)
    return build_unified_daily_df(eia_df, fred_df, yf_df, news_df)

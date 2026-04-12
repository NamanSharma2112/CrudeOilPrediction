// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

export interface ForecastParams {
  symbol: 'brent' | 'wti';
  horizon: 7 | 30;
  overrides?: {
    opec_cut_pct?: number;
    usd_index?: number;
    demand_growth?: number;
  };
}

export interface ForecastResponse {
  symbol: string;
  horizon: number;
  forecast: number[];
  lower_ci: number[];
  upper_ci: number[];
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  model_version: string;
  retrained_at: string;
}

// ----------------------------------------------------------------------
// Core Fetch Wrapper
// ----------------------------------------------------------------------

/**
 * A generic fetch wrapper that handles JSON parsing and standardizes error throwing.
 * This prevents you from writing `if (!res.ok) throw new Error(...)` everywhere.
 */
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ----------------------------------------------------------------------
// API Service Methods
// ----------------------------------------------------------------------

export const api = {
  /**
   * ML Price Forecasting
   * Calls the Next.js proxy route which forwards to FastAPI
   */
  getForecast: (params: ForecastParams): Promise<ForecastResponse> => {
    return fetcher<ForecastResponse>('/api/forecast', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Real-time & Historical Prices (Yahoo / EIA proxy)
   */
  getPrices: (symbol: 'brent' | 'wti', range: '1W' | '1M' | '3M' | '1Y' | '5Y') => {
    // We pass parameters via query string for GET requests
    const searchParams = new URLSearchParams({ symbol, range });
    return fetcher(`/api/prices?${searchParams.toString()}`);
  },

  /**
   * Production & Reserves Data
   */
  getProductionData: (view: 'production' | 'reserves' | 'ratio' = 'production') => {
    const searchParams = new URLSearchParams({ view });
    return fetcher(`/api/production?${searchParams.toString()}`);
  },

  /**
   * Supply Chain / Chokepoint Status
   */
  getChokepoints: () => {
    return fetcher('/api/chokepoints');
  },
};
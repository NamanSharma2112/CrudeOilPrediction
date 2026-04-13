import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, ForecastParams, ForecastResponse } from '../libs/api';

/**
 * Custom hook to fetch ML price forecasts.
 * Handles the baseline prediction AND the interactive scenario simulator overrides.
 */
export function useForecast(params: ForecastParams) {
  return useQuery<ForecastResponse, Error>({
    // 1. The Query Key: React Query deeply watches this array.
    // If the user drags a slider and updates `params.overrides`, React Query 
    // instantly knows it needs to fetch a new prediction from the FastAPI service.
    queryKey: ['forecast', params.symbol, params.horizon, params.overrides],

    // 2. The Query Function: Calls our centralized API wrapper
    queryFn: () => api.getForecast(params),

    // 3. UX Magic for the Scenario Simulator
    // Instead of dropping the chart and showing a loading spinner when sliders change,
    // this keeps the *old* forecast line visible on the chart until the *new* one arrives.
    placeholderData: keepPreviousData,

    // 4. Cache Rules
    // The underlying LSTM model only retrains weekly. 
    // Unless the user changes the slider inputs, the response will be identical.
    // Therefore, we can safely cache this data for a long time to save ML compute costs.
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false, // Don't burn FastAPI resources just because they switched tabs
  });
}
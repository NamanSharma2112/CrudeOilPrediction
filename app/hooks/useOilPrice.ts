import { useQuery } from '@tanstack/react-query';
import { api } from '../libs/api';
import { CommoditySymbol, TimeRange } from '../libs/constants';

// Define the shape of the data Recharts will expect
export interface PriceDataPoint {
  timestamp: string; // ISO string or short date
  price: number;
}

export interface UseOilPriceOptions {
  symbol: CommoditySymbol;
  range: TimeRange;
}

/**
 * Custom hook to fetch historical and live spot prices for Brent/WTI.
 * Automatically refetches every 60 seconds to keep the dashboard live.
 */
export function useOilPrice({ symbol, range }: UseOilPriceOptions) {
  return useQuery({
    // 1. The Query Key: React Query uses this to cache and share data across components
    // If multiple components ask for ['prices', 'brent', '1W'], it only makes 1 network request.
    queryKey: ['prices', symbol, range],

    // 2. The Query Function: Calls our centralized API wrapper
    queryFn: async (): Promise<PriceDataPoint[]> => {
      // We expect the API to return an array of PriceDataPoints
      return api.getPrices(symbol, range) as Promise<PriceDataPoint[]>;
    },

    // 3. Cache & Polling Rules
    refetchInterval: 60 * 1000, // Refetch exactly every 60 seconds (Live Dashboard)
    refetchOnWindowFocus: true, // If they leave the tab and come back, get fresh data
    staleTime: 30 * 1000,       // Data is considered "fresh" for 30s before needing a background update
    
    // 4. Retry Logic
    retry: 2, // If the Yahoo/EIA API blips, try twice more before showing the ErrorCard
  });
}
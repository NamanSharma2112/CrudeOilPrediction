import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface Quote {
  key: string;
  ticker: string;
  name: string;
  unit: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  as_of: string;
  spark: { date: string; value: number | null }[];
}

export interface HistoryRow {
  date: string;
  wti?: number | null;
  brent?: number | null;
  spread?: number | null;
  natgas?: number | null;
  heating_oil?: number | null;
  gasoline?: number | null;
  dxy?: number | null;
  gold?: number | null;
  spx?: number | null;
}

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | '5Y';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Request failed: ${res.status}`);
  return body as T;
}

/** Live quotes for crude benchmarks and related markets; polls every 60 s. */
export function useQuotes() {
  return useQuery({
    queryKey: ['market', 'quotes'],
    queryFn: () => getJson<{ quotes: Quote[]; fetched_at: string }>('/api/market/quotes'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/** Daily closes for all tracked instruments over a range; refreshes every 5 min. */
export function useHistory(range: HistoryRange) {
  return useQuery({
    queryKey: ['market', 'history', range],
    queryFn: () =>
      getJson<{ range: HistoryRange; rows: HistoryRow[]; fetched_at: string }>(
        `/api/market/history?range=${range}`
      ),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

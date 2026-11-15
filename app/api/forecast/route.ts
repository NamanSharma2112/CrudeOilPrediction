/**
 * POST /api/forecast  { symbol: 'wti' | 'brent', horizon: 7 | 30 }
 *
 * Deployed: returns the precomputed forecast from forecasts.json (written daily
 * by .github/workflows/forecast.yml). Locally: proxies to the FastAPI backend.
 */

import { DataFileError, FASTAPI_URL, readDataFile, isStaticDataMode } from '@/app/libs/data-source';

interface ForecastFile {
  generated_at: string;
  forecasts: Record<string, unknown>;
}

const SYMBOLS = ['wti', 'brent'];
const HORIZONS = [7, 30];

export async function POST(request: Request) {
  let body: { symbol?: string; horizon?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Request body must be JSON.' }, { status: 400 });
  }

  if (isStaticDataMode()) {
    const symbol = String(body.symbol ?? '').toLowerCase();
    const horizon = Number(body.horizon);
    if (!SYMBOLS.includes(symbol) || !HORIZONS.includes(horizon)) {
      return Response.json(
        { message: 'symbol must be "wti" or "brent" and horizon must be 7 or 30.' },
        { status: 400 }
      );
    }
    try {
      const file = await readDataFile<ForecastFile>('forecasts.json', 3600);
      const forecast = file.forecasts[`${symbol}_${horizon}`];
      if (!forecast) {
        return Response.json({ message: `No forecast available for ${symbol} ${horizon}D.` }, { status: 503 });
      }
      return Response.json(forecast);
    } catch (error) {
      const status = error instanceof DataFileError ? error.status : 502;
      return Response.json({ message: (error as Error).message }, { status });
    }
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Response.json(
        { message: errorData.detail || `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    return Response.json(await response.json());
  } catch (error) {
    console.error('[API /forecast] Proxy error:', error);
    return Response.json(
      { message: 'Failed to connect to the prediction backend. Is it running on port 8000?' },
      { status: 502 }
    );
  }
}

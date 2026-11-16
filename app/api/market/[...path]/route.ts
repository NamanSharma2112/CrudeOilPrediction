/**
 * GET /api/market/quotes
 * GET /api/market/history?range=1M|3M|6M|1Y|5Y
 * GET /api/market/tankers   (live AIS tanker positions, when configured)
 *
 * Deployed: serves the hourly snapshot files written by
 * .github/workflows/market.yml. Locally: proxies to FastAPI's /market/* routes.
 */

import { DataFileError, FASTAPI_URL, readDataFile, isStaticDataMode } from '@/app/libs/data-source';

const RANGES = ['1M', '3M', '6M', '1Y', '5Y'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);

  if (isStaticDataMode()) {
    const route = path.join('/');
    let file: string;
    if (route === 'quotes') {
      file = 'market.json';
    } else if (route === 'tankers') {
      file = 'tankers.json';
    } else if (route === 'history') {
      const range = url.searchParams.get('range') ?? '1Y';
      if (!RANGES.includes(range)) {
        return Response.json({ message: `range must be one of ${RANGES.join(', ')}.` }, { status: 400 });
      }
      file = `history-${range}.json`;
    } else {
      return Response.json({ message: 'Not found' }, { status: 404 });
    }

    try {
      // Snapshots change hourly; re-check every 5 minutes.
      return Response.json(await readDataFile(file, 300));
    } catch (error) {
      const status = error instanceof DataFileError ? error.status : 502;
      return Response.json({ message: (error as Error).message }, { status });
    }
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/market/${path.join('/')}${url.search}`, {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json(
        { message: data.detail || `Backend error: ${response.status}` },
        { status: response.status }
      );
    }
    return Response.json(data);
  } catch (error) {
    console.error('[API /market] Proxy error:', error);
    return Response.json(
      { message: 'Market data backend unreachable. Is FastAPI running on port 8000?' },
      { status: 502 }
    );
  }
}

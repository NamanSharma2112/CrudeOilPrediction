/**
 * Proxies GET /api/market/* to the FastAPI backend's /market/* endpoints
 * (live Yahoo Finance quotes and price history).
 */

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const { search } = new URL(request.url);

  try {
    const response = await fetch(`${FASTAPI_URL}/market/${path.join('/')}${search}`, {
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

/**
 * Next.js API Route — proxies POST /api/forecast to the FastAPI backend.
 * This keeps the backend URL server-side only (not exposed to the browser).
 */

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${FASTAPI_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Response.json(
        { message: errorData.detail || `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('[API /forecast] Proxy error:', error);
    return Response.json(
      { message: 'Failed to connect to the prediction backend. Is it running on port 8000?' },
      { status: 502 }
    );
  }
}

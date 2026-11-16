/**
 * Where the API routes get their data.
 *
 * - Deployed (DATA_BASE_URL set, FASTAPI_URL unset): read the JSON files that the
 *   scheduled GitHub Actions jobs publish to the repo's `data` branch, e.g.
 *   DATA_BASE_URL=https://raw.githubusercontent.com/<owner>/<repo>/data
 * - Local development, or a hosted FastAPI (FASTAPI_URL set): proxy to FastAPI.
 *
 * Server-only: never import this from a client component.
 */

export const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export function isStaticDataMode(): boolean {
  return Boolean(process.env.DATA_BASE_URL) && !process.env.FASTAPI_URL;
}

export class DataFileError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Fetch one generated JSON file. Responses are cached by Next.js for
 * `revalidateSeconds`, so all visitors share one upstream request.
 */
export async function readDataFile<T>(name: string, revalidateSeconds: number): Promise<T> {
  const base = process.env.DATA_BASE_URL!.replace(/\/+$/, '');
  const headers: Record<string, string> = {};
  // Needed only when the repository is private: a fine-grained token with
  // read-only "Contents" access to this repository.
  if (process.env.DATA_READ_TOKEN) {
    headers.Authorization = `token ${process.env.DATA_READ_TOKEN}`;
  }

  const res = await fetch(`${base}/${name}`, {
    headers,
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new DataFileError(
      res.status === 404
        ? `${name} has not been generated yet. Run the GitHub Actions workflows once.`
        : `Could not load ${name} (HTTP ${res.status}).`,
      res.status === 404 ? 503 : 502
    );
  }
  return (await res.json()) as T;
}

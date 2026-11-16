/**
 * GET /api/model — the latest training log (per-model test-set metrics).
 * Deployed: models/retrain_log.json from the data branch. Locally: backend/models/.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DataFileError, isStaticDataMode, readDataFile } from '@/app/libs/data-source';

export async function GET() {
  try {
    if (isStaticDataMode()) {
      return Response.json(await readDataFile('models/retrain_log.json', 3600));
    }
    const file = path.join(process.cwd(), 'backend', 'models', 'retrain_log.json');
    return Response.json(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    if (error instanceof DataFileError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    return Response.json(
      { message: 'No training log yet. Train the models first (backend/retrain.py).' },
      { status: 503 }
    );
  }
}

import type { DataPoint, DataSeries } from '@/services/db';

export interface TracerBackup {
  version: 1;
  exportedAt: number;
  series: DataSeries[];
  dataPoints: DataPoint[];
}

export function buildBackup(series: DataSeries[], dataPoints: DataPoint[]): TracerBackup {
  return {
    version: 1,
    exportedAt: Date.now(),
    series,
    dataPoints,
  };
}

export function parseBackup(json: string): TracerBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('series' in parsed) ||
    !('dataPoints' in parsed) ||
    !Array.isArray((parsed as TracerBackup).series) ||
    !Array.isArray((parsed as TracerBackup).dataPoints)
  ) {
    throw new Error('File is not a valid Tracer backup.');
  }

  const backup = parsed as TracerBackup;
  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }

  for (const s of backup.series) {
    if (typeof s.name !== 'string' || typeof s.color !== 'string') {
      throw new Error('Backup contains an invalid series entry.');
    }
  }
  for (const p of backup.dataPoints) {
    if (typeof p.series !== 'string' || typeof p.timestamp !== 'number') {
      throw new Error('Backup contains an invalid data point entry.');
    }
  }

  return backup;
}

import { parseTextValue } from '@/lib/utils';

// Minimal RFC4180-style CSV parsing/stringifying: handles quoted fields
// containing commas, quotes ("" escape), and newlines.

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function stringifyField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function stringifyCSV(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((v) => stringifyField(String(v))).join(',')).join('\n');
}

// Column-mapped import: turns an arbitrary CSV (not just Tracer's own export
// shape) into Tracer data points, e.g. a bank statement's Date/Description/Amount.

export type ImportedRow = { series: string; value: number | string; timestamp: number; description?: string; category?: string };

export type CsvSeriesMapping = { column: number } | { fixed: string } | null;

export interface CsvColumnMapping {
  series: CsvSeriesMapping;
  value: number | null;
  timestamp: number | null;
  description: number | null;
  category: number | null;
}

const HEADER_GUESSES = {
  series: /^(series|type)$/i,
  value: /^(value|amount|amt|price|duration)$/i,
  timestamp: /^(timestamp|date|time|datetime)$/i,
  description: /^(description|desc|note|memo|details|merchant)$/i,
  category: /^(category|activity|label|name)$/i,
};

export function guessCsvMapping(headers: string[]): { series: number | null; value: number | null; timestamp: number | null; description: number | null; category: number | null } {
  const guess = (re: RegExp): number | null => {
    const idx = headers.findIndex((h) => re.test(h.trim()));
    return idx >= 0 ? idx : null;
  };
  return {
    series: guess(HEADER_GUESSES.series),
    value: guess(HEADER_GUESSES.value),
    timestamp: guess(HEADER_GUESSES.timestamp),
    description: guess(HEADER_GUESSES.description),
    category: guess(HEADER_GUESSES.category),
  };
}

export function mapCsvRows(rows: string[][], mapping: CsvColumnMapping): ImportedRow[] {
  const { series: seriesMapping, value: valueIdx, timestamp: timestampIdx, description: descriptionIdx, category: categoryIdx } = mapping;

  if (valueIdx === null || timestampIdx === null || seriesMapping === null) return [];
  if ('fixed' in seriesMapping && !seriesMapping.fixed.trim()) return [];

  const result: ImportedRow[] = [];
  for (const row of rows) {
    const series = 'fixed' in seriesMapping ? seriesMapping.fixed.trim() : (row[seriesMapping.column] || '').trim();
    const rawValue = row[valueIdx] ?? '';
    const rawTimestamp = row[timestampIdx] ?? '';
    const timestamp = new Date(rawTimestamp).getTime();
    const description = descriptionIdx !== null ? row[descriptionIdx] : undefined;
    const category = categoryIdx !== null ? row[categoryIdx] : undefined;

    if (!series || rawValue === '' || isNaN(timestamp)) continue;

    const point: ImportedRow = { series, value: parseTextValue(rawValue), timestamp };
    if (description !== undefined) point.description = description;
    if (category !== undefined) point.category = category;
    result.push(point);
  }
  return result;
}

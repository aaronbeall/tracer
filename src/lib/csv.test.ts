import { parseCSV, stringifyCSV, guessCsvMapping, mapCsvRows } from './csv';

describe('parseCSV', () => {
  it('parses a simple CSV', () => {
    expect(parseCSV('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCSV('name,note\nWeight,"70.5, measured fasted"')).toEqual([
      ['name', 'note'],
      ['Weight', '70.5, measured fasted'],
    ]);
  });

  it('handles escaped quotes inside quoted fields', () => {
    expect(parseCSV('name\n"She said ""hi"""')).toEqual([
      ['name'],
      ['She said "hi"'],
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCSV('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('ignores trailing blank lines', () => {
    expect(parseCSV('a,b\n1,2\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('stringifyCSV', () => {
  it('quotes fields containing commas', () => {
    expect(stringifyCSV([['a, b', 'c']])).toBe('"a, b",c');
  });

  it('escapes embedded quotes', () => {
    expect(stringifyCSV([['say "hi"']])).toBe('"say ""hi"""');
  });

  it('round-trips through parseCSV', () => {
    const rows = [
      ['Series', 'Value', 'Timestamp'],
      ['Weight, kg', '70.5', '2026-01-01T00:00:00.000Z'],
      ['Mood', 'Happy "ish"', '2026-01-02T00:00:00.000Z'],
    ];
    expect(parseCSV(stringifyCSV(rows))).toEqual(rows);
  });
});

describe('guessCsvMapping', () => {
  it('matches Tracer\'s own export header names', () => {
    expect(guessCsvMapping(['Series', 'Value', 'Timestamp'])).toEqual({
      series: 0,
      value: 1,
      timestamp: 2,
      description: null,
      category: null,
    });
  });

  it('matches common bank statement header names', () => {
    expect(guessCsvMapping(['Date', 'Description', 'Amount'])).toEqual({
      series: null,
      value: 2,
      timestamp: 0,
      description: 1,
      category: null,
    });
  });

  it('matches a fitness-log-style header row with an activity category', () => {
    expect(guessCsvMapping(['Date', 'Activity', 'Duration'])).toEqual({
      series: null,
      value: 2,
      timestamp: 0,
      description: null,
      category: 1,
    });
  });

  it('returns null for unrecognized headers', () => {
    expect(guessCsvMapping(['foo', 'bar'])).toEqual({
      series: null,
      value: null,
      timestamp: null,
      description: null,
      category: null,
    });
  });
});

describe('mapCsvRows', () => {
  const rows = [
    ['2026-01-01', 'Coffee', '4.50'],
    ['2026-01-02', 'Groceries', '62'],
  ];

  it('maps rows using a fixed series name for files with no series column', () => {
    const result = mapCsvRows(rows, {
      series: { fixed: 'Expenses' },
      value: 2,
      timestamp: 0,
      description: 1,
      category: null,
    });
    expect(result).toEqual([
      { series: 'Expenses', value: 4.5, timestamp: new Date('2026-01-01').getTime(), description: 'Coffee' },
      { series: 'Expenses', value: 62, timestamp: new Date('2026-01-02').getTime(), description: 'Groceries' },
    ]);
  });

  it('maps rows using a series column', () => {
    const seriesRows = [['Weight', '70.5', '2026-01-01']];
    const result = mapCsvRows(seriesRows, { series: { column: 0 }, value: 1, timestamp: 2, description: null, category: null });
    expect(result).toEqual([{ series: 'Weight', value: 70.5, timestamp: new Date('2026-01-01').getTime() }]);
  });

  it('skips rows with an empty value or an invalid date', () => {
    const messyRows = [
      ['2026-01-01', 'Coffee', ''],
      ['not-a-date', 'Groceries', '62'],
      ['2026-01-03', 'Rent', '1200'],
    ];
    const result = mapCsvRows(messyRows, { series: { fixed: 'Expenses' }, value: 2, timestamp: 0, description: 1, category: null });
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Rent');
  });

  it('returns no rows when required fields are unmapped', () => {
    expect(mapCsvRows(rows, { series: null, value: 2, timestamp: 0, description: null, category: null })).toEqual([]);
    expect(mapCsvRows(rows, { series: { fixed: '' }, value: 2, timestamp: 0, description: null, category: null })).toEqual([]);
  });

  it('maps a category column for categorized series (e.g. fitness log activity + duration)', () => {
    const fitnessRows = [
      ['2026-01-01', 'Running', '30'],
      ['2026-01-02', 'Yoga', '45'],
    ];
    const result = mapCsvRows(fitnessRows, {
      series: { fixed: 'Exercise' },
      value: 2,
      timestamp: 0,
      description: null,
      category: 1,
    });
    expect(result).toEqual([
      { series: 'Exercise', value: 30, timestamp: new Date('2026-01-01').getTime(), category: 'Running' },
      { series: 'Exercise', value: 45, timestamp: new Date('2026-01-02').getTime(), category: 'Yoga' },
    ]);
  });
});

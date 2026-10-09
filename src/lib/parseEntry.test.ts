import { parseEntry, suggestCompletion, type EntrySeriesInfo } from './parseEntry';

const series: EntrySeriesInfo[] = [
  { name: 'Weight', type: 'numeric', unit: 'lbs' },
  { name: 'Sleep Hours', type: 'numeric', unit: 'hours' },
  { name: 'Steps', type: 'numeric' },
  { name: 'Mood', type: 'text', values: ['Great', 'Okay', 'Bad'] },
  { name: 'Exercise Log', type: 'categorized', unit: 'min', values: ['Running', 'Cycling', 'Yoga', 'Morning Walk'] },
];

// Wednesday, 2026-10-07 15:30 local
const now = new Date(2026, 9, 7, 15, 30);

const parse = (text: string) => parseEntry(text, series, now);
const ymdhm = (ts: number) => {
  const d = new Date(ts);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
};

describe('parseEntry', () => {
  it('parses a known numeric series and value', () => {
    expect(parse('weight 182.4')).toMatchObject({ series: 'Weight', value: 182.4, seriesIsNew: false, hasTime: false });
    expect(parse('182.4 lbs weight')).toMatchObject({ series: 'Weight', value: 182.4, unit: 'lbs' });
  });

  it('matches a series by part of its name', () => {
    expect(parse('sleep 7.5')).toMatchObject({ series: 'Sleep Hours', value: 7.5 });
  });

  it('converts durations to the series unit', () => {
    expect(parse('sleep 450 min')).toMatchObject({ series: 'Sleep Hours', value: 7.5, unit: 'hours' });
    expect(parse('exercise log running 1h30m')).toMatchObject({ series: 'Exercise Log', category: 'Running', value: 90 });
  });

  it('infers a categorized series from a known category', () => {
    expect(parse('yoga 30 min')).toMatchObject({ series: 'Exercise Log', category: 'Yoga', value: 30 });
    expect(parse('morning walk 20')).toMatchObject({ series: 'Exercise Log', category: 'Morning Walk', value: 20 });
  });

  it('uses free text as a new category on a categorized series', () => {
    expect(parse('exercise log swimming 45')).toMatchObject({ series: 'Exercise Log', category: 'swimming', value: 45 });
  });

  it('parses text series values, known or free', () => {
    expect(parse('mood great')).toMatchObject({ series: 'Mood', value: 'Great' });
    expect(parse('great mood')).toMatchObject({ series: 'Mood', value: 'Great' });
    expect(parse('mood pretty tired')).toMatchObject({ series: 'Mood', value: 'pretty tired' });
  });

  it('parses relative days and times', () => {
    expect(ymdhm(parse('weight 180 yesterday').timestamp)).toEqual([2026, 10, 6, 15, 30]);
    expect(ymdhm(parse('weight 180 at 7am').timestamp)).toEqual([2026, 10, 7, 7, 0]);
    expect(ymdhm(parse('weight 180 yesterday at 9:15pm').timestamp)).toEqual([2026, 10, 6, 21, 15]);
    expect(ymdhm(parse('sleep 8 last night').timestamp)).toEqual([2026, 10, 6, 21, 0]);
    expect(ymdhm(parse('steps 9000 2 hours ago').timestamp)).toEqual([2026, 10, 7, 13, 30]);
    expect(ymdhm(parse('steps 9000 on monday').timestamp)).toEqual([2026, 10, 5, 15, 30]);
    expect(ymdhm(parse('steps 9000 last wed').timestamp)).toEqual([2026, 9, 30, 15, 30]);
    expect(ymdhm(parse('steps 9000 2026-09-01').timestamp)).toEqual([2026, 9, 1, 15, 30]);
    expect(ymdhm(parse('steps 9000 12/25').timestamp)).toEqual([2025, 12, 25, 15, 30]);
    expect(parse('steps 9000 yesterday')).toMatchObject({ value: 9000, hasTime: true });
  });

  it('creates a new series from unknown words', () => {
    expect(parse('coffee 2 cups')).toMatchObject({ series: 'Coffee', value: 2, unit: 'cups', seriesIsNew: true });
    expect(parse('water intake 64 oz')).toMatchObject({ series: 'Water intake', value: 64 });
    expect(parse('journal felt focused')).toMatchObject({ series: 'Journal', value: 'felt focused', seriesIsNew: true });
  });

  it('honors an explicit "Series:" prefix', () => {
    expect(parse('Reading: 30 pages')).toMatchObject({ series: 'Reading', value: 30, seriesIsNew: true });
    expect(parse('Workout: rowing 20')).toMatchObject({ series: 'Workout', value: 20, category: 'rowing' });
    expect(parse('mood: okay')).toMatchObject({ series: 'Mood', value: 'Okay', seriesIsNew: false });
  });

  it('handles currency and empty input', () => {
    expect(parse('lunch $12.50')).toMatchObject({ series: 'Lunch', value: 12.5, unit: '$' });
    expect(parse('')).toMatchObject({ series: '', value: undefined });
  });

  it('does not treat ordinary words as weekdays', () => {
    expect(parse('sat 20')).toMatchObject({ series: 'Sat', value: 20, hasTime: false });
  });
});

describe('suggestCompletion', () => {
  it('completes series, categories and keywords', () => {
    expect(suggestCompletion('wei', series)).toBe('ght');
    expect(suggestCompletion('sleep h', series)).toBe('ours');
    expect(suggestCompletion('cyc', series)).toBe('ling');
    expect(suggestCompletion('weight 180 yest', series)).toBe('erday');
  });

  it('returns nothing after a space, for numbers, or when complete', () => {
    expect(suggestCompletion('weight ', series)).toBe('');
    expect(suggestCompletion('weight 18', series)).toBe('');
    expect(suggestCompletion('weight', series)).toBe('');
    expect(suggestCompletion('zzz', series)).toBe('');
  });
});

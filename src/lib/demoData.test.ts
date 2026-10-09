import { generateNumericSeries, generateTextSeries, generateCategorizedSeries, buildDemoDataset } from './demoData';

describe('generateNumericSeries', () => {
  it('generates roughly one point per day over the range when skipProbability is 0', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-11'); // 10 days
    const points = generateNumericSeries({
      series: 'Test', startDate: start, endDate: end, pattern: 'random', baseValue: 10, noiseAmplitude: 1, skipProbability: 0,
    });
    expect(points).toHaveLength(10);
    expect(points.every((p) => p.series === 'Test')).toBe(true);
  });

  it('produces higher values on average for trending-up than trending-down given the same base', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-03-01');
    const up = generateNumericSeries({
      series: 'Up', startDate: start, endDate: end, pattern: 'trending-up', baseValue: 50, noiseAmplitude: 0.1, trendAmount: 20,
    });
    const down = generateNumericSeries({
      series: 'Down', startDate: start, endDate: end, pattern: 'trending-down', baseValue: 50, noiseAmplitude: 0.1, trendAmount: 20,
    });
    const avg = (pts: { value: number }[]) => pts.reduce((s, p) => s + p.value, 0) / pts.length;
    expect(avg(up)).toBeGreaterThan(avg(down));
  });

  it('respects decimal rounding', () => {
    const points = generateNumericSeries({
      series: 'Rounded', startDate: new Date('2026-01-01'), endDate: new Date('2026-01-05'), pattern: 'random', baseValue: 10, noiseAmplitude: 2, decimals: 0,
    });
    expect(points.every((p) => Number.isInteger(p.value))).toBe(true);
  });
});

describe('generateTextSeries', () => {
  it('only picks from the provided values', () => {
    const points = generateTextSeries('Mood', new Date('2026-01-01'), new Date('2026-02-01'), ['A', 'B'], [1, 1], 0);
    expect(points.every((p) => ['A', 'B'].includes(p.value))).toBe(true);
  });

  it('heavily weighted values dominate the distribution', () => {
    const points = generateTextSeries('Mood', new Date('2026-01-01'), new Date('2026-04-01'), ['A', 'B'], [100, 1], 0);
    const aCount = points.filter((p) => p.value === 'A').length;
    expect(aCount / points.length).toBeGreaterThan(0.9);
  });
});

describe('generateCategorizedSeries', () => {
  it('pairs a numeric value in range with a category from the provided list', () => {
    const points = generateCategorizedSeries(
      'Exercise', new Date('2026-01-01'), new Date('2026-02-01'), ['Running', 'Yoga'], [1, 1], [15, 60], 0
    );
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) {
      expect(['Running', 'Yoga']).toContain(p.category);
      expect(p.value).toBeGreaterThanOrEqual(15);
      expect(p.value).toBeLessThanOrEqual(60);
    }
  });

  it('heavily weighted categories dominate the distribution', () => {
    const points = generateCategorizedSeries(
      'Exercise', new Date('2026-01-01'), new Date('2026-04-01'), ['A', 'B'], [100, 1], [10, 20], 0
    );
    const aCount = points.filter((p) => p.category === 'A').length;
    expect(aCount / points.length).toBeGreaterThan(0.9);
  });
});

describe('buildDemoDataset', () => {
  it('produces points and matching series config for every series referenced', () => {
    const { points, seriesConfig } = buildDemoDataset();
    const seriesNames = new Set(points.map((p) => p.series));
    expect(seriesNames.size).toBeGreaterThan(0);
    for (const name of Object.keys(seriesConfig)) {
      expect(seriesNames.has(name)).toBe(true);
    }
    expect(points.length).toBeGreaterThan(50);
  });
});

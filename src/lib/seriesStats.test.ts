import { computeSeriesStats, computeStreak, computeGoalHistory } from './seriesStats';
import type { DataPoint, DataSeries } from '@/services/db';

const numericSeries: DataSeries = {
  id: 1,
  name: 'weight',
  color: '#fff',
  type: 'numeric',
  createdAt: 0,
  updatedAt: 0,
};

const textSeries: DataSeries = {
  id: 2,
  name: 'mood',
  color: '#000',
  type: 'text',
  createdAt: 0,
  updatedAt: 0,
};

const categorizedSeries: DataSeries = {
  id: 3,
  name: 'exercise',
  color: '#0f0',
  type: 'categorized',
  createdAt: 0,
  updatedAt: 0,
};

const seriesByName = { weight: numericSeries, mood: textSeries, exercise: categorizedSeries };

const point = (series: string, value: number | string, timestamp: number, category?: string): DataPoint => ({
  id: timestamp,
  series,
  value,
  timestamp,
  ...(category !== undefined ? { category } : {}),
});

const DAY = 24 * 60 * 60 * 1000;

describe('computeSeriesStats', () => {
  it('computes min/max/avg for a numeric series', () => {
    const points = [point('weight', 70, 1000), point('weight', 72, 2000), point('weight', 74, 3000)];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.weight.min).toBe(70);
    expect(stats.weight.max).toBe(74);
    expect(stats.weight.avg).toBeCloseTo(72);
    expect(stats.weight.last).toEqual({ value: 74, timestamp: 3000 });
  });

  it('marks trend as up when the second half is higher than the first', () => {
    const points = [point('weight', 60, 1000), point('weight', 62, 2000), point('weight', 70, 3000), point('weight', 72, 4000)];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.weight.trend).toBe('up');
  });

  it('marks trend as down when the second half is lower than the first', () => {
    const points = [point('weight', 80, 1000), point('weight', 78, 2000), point('weight', 70, 3000), point('weight', 68, 4000)];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.weight.trend).toBe('down');
  });

  it('omits trend for a single point', () => {
    const stats = computeSeriesStats([point('weight', 70, 1000)], seriesByName);
    expect(stats.weight.trend).toBeUndefined();
  });

  it('computes the mode for a text series', () => {
    const points = [
      point('mood', 'Happy', 1000),
      point('mood', 'Sad', 2000),
      point('mood', 'Happy', 3000),
      point('mood', 'Happy', 4000),
    ];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.mood.mode).toEqual({ value: 'Happy', count: 3 });
    expect(stats.mood.min).toBeUndefined();
  });

  it('computes numeric stats and a category breakdown for a categorized series', () => {
    const points = [
      point('exercise', 30, 1000, 'Running'),
      point('exercise', 45, 2000, 'Yoga'),
      point('exercise', 20, 3000, 'Running'),
    ];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.exercise.min).toBe(20);
    expect(stats.exercise.max).toBe(45);
    expect(stats.exercise.avg).toBeCloseTo((30 + 45 + 20) / 3);
    expect(stats.exercise.mode).toBeUndefined();
    expect(stats.exercise.categoryBreakdown).toEqual([
      { category: 'Running', total: 50 },
      { category: 'Yoga', total: 45 },
    ]);
  });

  it('falls back to "Uncategorized" for categorized points missing a category', () => {
    const points = [point('exercise', 10, 1000)];
    const stats = computeSeriesStats(points, seriesByName);
    expect(stats.exercise.categoryBreakdown).toEqual([{ category: 'Uncategorized', total: 10 }]);
  });

  it('groups stats independently per series', () => {
    const points = [point('weight', 70, 1000), point('mood', 'Happy', 2000)];
    const stats = computeSeriesStats(points, seriesByName);
    expect(Object.keys(stats).sort()).toEqual(['mood', 'weight']);
  });
});

describe('computeStreak', () => {
  it('is 0 with no points', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('counts a streak ending today', () => {
    const now = Date.now();
    const points = [point('weight', 1, now), point('weight', 1, now - DAY), point('weight', 1, now - 2 * DAY)];
    expect(computeStreak(points)).toBe(3);
  });

  it('counts a streak ending yesterday (no entry logged yet today)', () => {
    const now = Date.now();
    const points = [point('weight', 1, now - DAY), point('weight', 1, now - 2 * DAY)];
    expect(computeStreak(points)).toBe(2);
  });

  it('is 0 when the most recent entry is more than a day old', () => {
    const now = Date.now();
    const points = [point('weight', 1, now - 3 * DAY)];
    expect(computeStreak(points)).toBe(0);
  });

  it('multiple entries on the same day only count once', () => {
    const now = Date.now();
    const points = [point('weight', 1, now), point('weight', 2, now - 1000)];
    expect(computeStreak(points)).toBe(1);
  });
});

describe('computeGoalHistory', () => {
  const goal = { target: 70, direction: 'at-most' as const };
  const now = Date.now();

  it('returns a window of the requested length, oldest to newest, ending today', () => {
    const history = computeGoalHistory([point('weight', 65, now)], goal, 'avg', 10);
    expect(history.days).toHaveLength(10);
    expect(history.days[9].met).toBe(true);
    expect(history.days[0].met).toBeNull();
  });

  it('marks a day met or not met against the target and direction', () => {
    const points = [point('weight', 65, now), point('weight', 75, now - DAY)];
    const history = computeGoalHistory(points, goal, 'avg', 3);
    expect(history.days[2].met).toBe(true); // today: 65 <= 70
    expect(history.days[1].met).toBe(false); // yesterday: 75 > 70
    expect(history.days[0].met).toBeNull(); // 2 days ago: no data
  });

  it('aggregates same-day values using sum or avg as requested', () => {
    const points = [point('weight', 30, now), point('weight', 30, now - 1000)];
    expect(computeGoalHistory(points, { target: 50, direction: 'at-most' }, 'sum', 1).days[0].value).toBe(60);
    expect(computeGoalHistory(points, { target: 50, direction: 'at-most' }, 'avg', 1).days[0].value).toBe(30);
  });

  it('goalStreak counts consecutive met days ending today', () => {
    const points = [point('weight', 65, now), point('weight', 66, now - DAY), point('weight', 67, now - 2 * DAY)];
    expect(computeGoalHistory(points, goal, 'avg').goalStreak).toBe(3);
  });

  it('goalStreak breaks on a missed day', () => {
    const points = [point('weight', 65, now), point('weight', 90, now - DAY), point('weight', 67, now - 2 * DAY)];
    expect(computeGoalHistory(points, goal, 'avg').goalStreak).toBe(1);
  });

  it('goalStreak breaks on a gap day with no entry, even if earlier days met the goal', () => {
    const points = [point('weight', 65, now), point('weight', 65, now - 2 * DAY)]; // yesterday has no entry
    expect(computeGoalHistory(points, goal, 'avg').goalStreak).toBe(1);
  });

  it('week/month rate only counts days that have data, ignoring gaps', () => {
    const points = [
      point('weight', 65, now), // met
      point('weight', 90, now - DAY), // missed
      // now - 2*DAY: gap, no data
    ];
    const history = computeGoalHistory(points, goal, 'avg', 7);
    expect(history.weekRate).toBeCloseTo(0.5);
  });

  it('rate is null when there is no data in the window', () => {
    const history = computeGoalHistory([], goal, 'avg', 7);
    expect(history.weekRate).toBeNull();
    expect(history.monthRate).toBeNull();
  });
});

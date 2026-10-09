import { format, subDays } from 'date-fns';
import type { DataPoint, DataSeries } from '@/services/db';

export type SeriesStat = {
  count: number;
  last: { value: number | string; timestamp: number };
  min?: number;
  max?: number;
  avg?: number;
  trend?: 'up' | 'down' | 'flat';
  mode?: { value: string; count: number };
  /** 'categorized' series only: total value per category, sorted highest total first. */
  categoryBreakdown?: { category: string; total: number }[];
  streak: number;
};

export const computeStreak = (points: DataPoint[]): number => {
  const days = new Set(points.map((p) => format(new Date(p.timestamp), 'yyyy-MM-dd')));
  let cursor = new Date();
  if (!days.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1);
  }
  let streak = 0;
  while (days.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
};

export const computeSeriesStats = (
  dataPoints: DataPoint[],
  seriesByName: Record<string, DataSeries>
): Record<string, SeriesStat> => {
  const pointsBySeries: Record<string, DataPoint[]> = {};
  for (const point of dataPoints) {
    (pointsBySeries[point.series] ??= []).push(point);
  }

  const stats: Record<string, SeriesStat> = {};
  for (const [series, points] of Object.entries(pointsBySeries)) {
    const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const last = sorted[sorted.length - 1];
    const type = seriesByName[series]?.type;

    const stat: SeriesStat = {
      count: sorted.length,
      last: { value: last.value, timestamp: last.timestamp },
      streak: computeStreak(sorted),
    };

    if (type === 'numeric' || type === 'categorized') {
      const values = sorted.map((p) => Number(p.value));
      stat.min = Math.min(...values);
      stat.max = Math.max(...values);
      stat.avg = values.reduce((sum, v) => sum + v, 0) / values.length;

      if (values.length >= 2) {
        const mid = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, mid);
        const secondHalf = values.slice(mid);
        const avgOf = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0) / arr.length;
        const diff = avgOf(secondHalf) - avgOf(firstHalf);
        stat.trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      }
    }

    if (type === 'text') {
      const frequency: Record<string, number> = {};
      for (const p of sorted) {
        const value = String(p.value);
        frequency[value] = (frequency[value] || 0) + 1;
      }
      const [modeValue, modeCount] = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
      stat.mode = { value: modeValue, count: modeCount };
    } else if (type === 'categorized') {
      const totals: Record<string, number> = {};
      for (const p of sorted) {
        const category = (p.category || 'Uncategorized').trim() || 'Uncategorized';
        totals[category] = (totals[category] || 0) + Number(p.value);
      }
      stat.categoryBreakdown = Object.entries(totals)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    }

    stats[series] = stat;
  }
  return stats;
};

export interface GoalDay {
  date: string;
  value: number | null;
  met: boolean | null;
}

export interface GoalHistory {
  days: GoalDay[];
  goalStreak: number;
  weekRate: number | null;
  monthRate: number | null;
}

export const computeGoalHistory = (
  points: DataPoint[],
  goal: { target: number; direction: 'at-least' | 'at-most' },
  aggregation: 'sum' | 'avg' = 'sum',
  windowDays = 30
): GoalHistory => {
  const valuesByDay: Record<string, number[]> = {};
  for (const p of points) {
    const key = format(new Date(p.timestamp), 'yyyy-MM-dd');
    (valuesByDay[key] ??= []).push(Number(p.value));
  }

  const dayValue = (key: string): number | null => {
    const values = valuesByDay[key];
    if (!values || values.length === 0) return null;
    const total = values.reduce((sum, v) => sum + v, 0);
    return aggregation === 'avg' ? total / values.length : total;
  };

  const meetsGoal = (value: number): boolean =>
    goal.direction === 'at-least' ? value >= goal.target : value <= goal.target;

  const today = new Date();
  const days: GoalDay[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const value = dayValue(date);
    days.push({ date, value, met: value === null ? null : meetsGoal(value) });
  }

  let goalStreak = 0;
  let cursor = today;
  if (dayValue(format(cursor, 'yyyy-MM-dd')) === null) {
    cursor = subDays(cursor, 1);
  }
  while (true) {
    const value = dayValue(format(cursor, 'yyyy-MM-dd'));
    if (value === null || !meetsGoal(value)) break;
    goalStreak++;
    cursor = subDays(cursor, 1);
  }

  const rateOver = (n: number): number | null => {
    const recentDays = days.slice(-n).filter((d) => d.met !== null);
    if (recentDays.length === 0) return null;
    return recentDays.filter((d) => d.met).length / recentDays.length;
  };

  return {
    days,
    goalStreak,
    weekRate: rateOver(7),
    monthRate: rateOver(30),
  };
};

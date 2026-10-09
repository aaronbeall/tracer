import type { DataSeries } from '@/services/db';

export type GenerationPattern = 'random' | 'trending-up' | 'trending-down' | 'weekly-cycle';

export const PATTERN_LABELS: Record<GenerationPattern, string> = {
  random: 'Random',
  'trending-up': 'Trending up',
  'trending-down': 'Trending down',
  'weekly-cycle': 'Weekly cycle',
};

const DAY_MS = 24 * 60 * 60 * 1000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const valueForPattern = (
  pattern: GenerationPattern,
  date: Date,
  dayIndex: number,
  totalDays: number,
  baseValue: number,
  noiseAmplitude: number,
  trendAmount: number
): number => {
  let value = baseValue;
  const progress = totalDays <= 1 ? 0 : dayIndex / (totalDays - 1);

  if (pattern === 'trending-up') {
    value += progress * trendAmount;
  } else if (pattern === 'trending-down') {
    value -= progress * trendAmount;
  } else if (pattern === 'weekly-cycle') {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    value += isWeekend ? trendAmount : 0;
  }

  return value + rand(-noiseAmplitude, noiseAmplitude);
};

export interface NumericSeriesOptions {
  series: string;
  startDate: Date;
  endDate: Date;
  pattern: GenerationPattern;
  baseValue: number;
  noiseAmplitude: number;
  /** how far the pattern moves the value from baseValue at its extreme; defaults to 30% of baseValue */
  trendAmount?: number;
  decimals?: number;
  /** chance a given day has no entry at all, to keep streaks/gaps realistic */
  skipProbability?: number;
  pointsPerDay?: number;
}

export const generateNumericSeries = (opts: NumericSeriesOptions): { series: string; value: number; timestamp: number }[] => {
  const {
    series,
    startDate,
    endDate,
    pattern,
    baseValue,
    noiseAmplitude,
    trendAmount = baseValue * 0.3,
    decimals = 1,
    skipProbability = 0,
    pointsPerDay = 1,
  } = opts;

  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
  const points: { series: string; value: number; timestamp: number }[] = [];

  for (let d = 0; d < totalDays; d++) {
    if (Math.random() < skipProbability) continue;
    const date = new Date(startDate.getTime() + d * DAY_MS);

    for (let p = 0; p < pointsPerDay; p++) {
      const raw = valueForPattern(pattern, date, d, totalDays, baseValue, noiseAmplitude, trendAmount);
      const value = Number(raw.toFixed(decimals));
      const timestamp = date.getTime() + rand(8 * 3600_000, 21 * 3600_000);
      points.push({ series, value, timestamp });
    }
  }

  return points;
};

export const generateTextSeries = (
  series: string,
  startDate: Date,
  endDate: Date,
  values: string[],
  weights: number[],
  skipProbability = 0.3
): { series: string; value: string; timestamp: number }[] => {
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const points: { series: string; value: string; timestamp: number }[] = [];

  const pickValue = (): string => {
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < values.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return values[i];
    }
    return values[values.length - 1];
  };

  for (let d = 0; d < totalDays; d++) {
    if (Math.random() < skipProbability) continue;
    const date = new Date(startDate.getTime() + d * DAY_MS);
    points.push({ series, value: pickValue(), timestamp: date.getTime() + rand(8 * 3600_000, 21 * 3600_000) });
  }

  return points;
};

export const generateCategorizedSeries = (
  series: string,
  startDate: Date,
  endDate: Date,
  categories: string[],
  weights: number[],
  valueRange: [number, number],
  skipProbability = 0.5
): { series: string; value: number; category: string; timestamp: number }[] => {
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const [min, max] = valueRange;
  const points: { series: string; value: number; category: string; timestamp: number }[] = [];

  const pickCategory = (): string => {
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < categories.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return categories[i];
    }
    return categories[categories.length - 1];
  };

  for (let d = 0; d < totalDays; d++) {
    if (Math.random() < skipProbability) continue;
    const date = new Date(startDate.getTime() + d * DAY_MS);
    const value = Math.round(min + Math.random() * (max - min));
    points.push({ series, value, category: pickCategory(), timestamp: date.getTime() + rand(8 * 3600_000, 21 * 3600_000) });
  }

  return points;
};

export interface DemoDataset {
  points: { series: string; value: number | string; timestamp: number; category?: string }[];
  seriesConfig: Record<string, Partial<Pick<DataSeries, 'unit' | 'goal' | 'aggregation' | 'emoji'>>>;
}

/** A hand-crafted, cohesive demo dataset designed to exercise trends, goals, streaks, and gaps realistically. */
export const buildDemoDataset = (): DemoDataset => {
  const end = new Date();
  const start90 = new Date(end.getTime() - 90 * DAY_MS);
  const start60 = new Date(end.getTime() - 60 * DAY_MS);

  const weightPoints = generateNumericSeries({
    series: 'Weight',
    startDate: start90,
    endDate: end,
    pattern: 'trending-down',
    baseValue: 82,
    noiseAmplitude: 0.6,
    trendAmount: 6,
    decimals: 1,
    skipProbability: 0.25,
  });

  const stepsPoints = generateNumericSeries({
    series: 'Steps',
    startDate: start60,
    endDate: end,
    pattern: 'weekly-cycle',
    baseValue: 6500,
    noiseAmplitude: 1200,
    trendAmount: 3500,
    decimals: 0,
    skipProbability: 0.1,
  });

  const sleepPoints = generateNumericSeries({
    series: 'Sleep Hours',
    startDate: start60,
    endDate: end,
    pattern: 'trending-up',
    baseValue: 6.2,
    noiseAmplitude: 0.5,
    trendAmount: 0.8,
    decimals: 1,
    skipProbability: 0.15,
  });

  const moodPoints = generateTextSeries(
    'Mood',
    start60,
    end,
    ['Happy', 'Content', 'Tired', 'Stressed', 'Excited'],
    [4, 3, 2, 1, 1]
  );

  const exercisePoints = generateCategorizedSeries(
    'Exercise Log',
    start60,
    end,
    ['Running', 'Cycling', 'Yoga', 'Swimming', 'Weightlifting'],
    [3, 2, 2, 1, 2],
    [15, 60],
    0.5
  );

  return {
    points: [...weightPoints, ...stepsPoints, ...sleepPoints, ...moodPoints, ...exercisePoints],
    seriesConfig: {
      Weight: { unit: 'kg', aggregation: 'avg', goal: { target: 76, direction: 'at-most' }, emoji: '⚖️' },
      Steps: { unit: 'steps', aggregation: 'sum', goal: { target: 8000, direction: 'at-least' }, emoji: '🚶' },
      'Sleep Hours': { unit: 'hrs', aggregation: 'avg', emoji: '😴' },
      Mood: { emoji: '🙂' },
      'Exercise Log': { unit: 'min', aggregation: 'sum', goal: { target: 20, direction: 'at-least' }, emoji: '🏃' },
    },
  };
};

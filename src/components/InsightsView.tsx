import React, { memo, useMemo } from 'react';
import type { DataPoint } from '@/services/db';
import { useSeriesByName } from '@/store/dataStore';
import { computeSeriesStats, computeGoalHistory } from '@/lib/seriesStats';
import { formatDistanceToNow } from 'date-fns';
import { Flame } from 'lucide-react';
import GoalHabitStrip from './GoalHabitStrip';

interface InsightsViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
  activeSeries: string[];
  onToggleSeries: (series: string) => void;
}

const formatNumber = (value: number): string => (Number.isInteger(value) ? value.toString() : value.toFixed(1));

const Sparkline: React.FC<{ points: DataPoint[]; color: string }> = ({ points, color }) => {
  const values = points.slice(-20).map((p) => Number(p.value));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 200;
  const height = 36;

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-9" preserveAspectRatio="none">
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const InsightsView: React.FC<InsightsViewProps> = memo(({ dataPoints, selectedSeries, activeSeries, onToggleSeries }) => {
  const seriesByName = useSeriesByName();
  const stats = useMemo(() => computeSeriesStats(dataPoints, seriesByName), [dataPoints, seriesByName]);

  const pointsBySeries = useMemo(() => {
    const map: Record<string, DataPoint[]> = {};
    for (const p of dataPoints) {
      (map[p.series] ??= []).push(p);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.timestamp - b.timestamp);
    }
    return map;
  }, [dataPoints]);

  const seriesWithData = selectedSeries.filter((s) => stats[s]);

  if (seriesWithData.length === 0) {
    return <p className="text-center text-muted-foreground py-16 font-display italic">No data yet — add some data points to see insights here.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {seriesWithData.map((name) => {
        const series = seriesByName[name];
        const stat = stats[name];
        const isActive = activeSeries.length === 0 || activeSeries.includes(name);
        const color = series?.color || '#B5533C';
        const lastValue = typeof stat.last.value === 'number' ? formatNumber(stat.last.value) : stat.last.value;
        const lastPoint = pointsBySeries[name]?.[pointsBySeries[name].length - 1];

        return (
          <button
            key={name}
            onClick={() => onToggleSeries(name)}
            className={`text-left rounded-lg border border-border p-4 bg-card shadow-sm transition-all hover:shadow-md ${
              isActive ? '' : 'opacity-50'
            }`}
            style={{ borderTopWidth: 3, borderTopColor: color }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                {series?.emoji && <span className="text-lg leading-none">{series.emoji}</span>}
                <span>{name}</span>
              </div>
              {stat.streak > 1 && (
                <span className="flex items-center gap-0.5 text-[11px] font-mono font-semibold text-primary">
                  <Flame size={12} className="fill-primary/30 text-primary" /> {stat.streak}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-semibold" style={{ color }}>{lastValue}</span>
              {series?.unit && <span className="text-xs font-mono text-muted-foreground">{series.unit}</span>}
              {series?.type === 'categorized' && lastPoint?.category && (
                <span className="text-xs font-mono text-muted-foreground">({lastPoint.category})</span>
              )}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mb-2">
              {formatDistanceToNow(new Date(stat.last.timestamp), { addSuffix: true })} · {stat.count} entr{stat.count === 1 ? 'y' : 'ies'}
            </p>

            {(series?.type === 'numeric' || series?.type === 'categorized') && (
              <>
                <Sparkline points={pointsBySeries[name] || []} color={color} />
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  Avg {formatNumber(stat.avg ?? 0)}{series.unit ? ` ${series.unit}` : ''} · Range {formatNumber(stat.min ?? 0)}–{formatNumber(stat.max ?? 0)}
                </p>
                {series.type === 'categorized' && stat.categoryBreakdown && stat.categoryBreakdown.length > 0 && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-1">
                    {stat.categoryBreakdown.slice(0, 3).map((c) => `${c.category} ${formatNumber(c.total)}`).join(' · ')}
                  </p>
                )}
                {series.goal && (
                  <>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Goal: {series.goal.direction === 'at-least' ? 'at least' : 'at most'} {formatNumber(series.goal.target)}{series.unit ? ` ${series.unit}` : ''}
                    </p>
                    <GoalHabitStrip
                      history={computeGoalHistory(pointsBySeries[name] || [], series.goal, series.aggregation)}
                      color={color}
                    />
                  </>
                )}
              </>
            )}

            {series?.type === 'text' && stat.mode && (
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                Most common: <span className="font-medium text-foreground">{stat.mode.value}</span> ({stat.mode.count}×)
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default InsightsView;

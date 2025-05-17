import React, { useState, useMemo, memo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import type { DataPoint } from '@/services/db';
import IntervalPicker, { type Interval } from '@/components/ui/IntervalPicker';
import { useSeriesByName, useSeriesUniqueValues } from '@/store/dataStore';
import tinycolor from 'tinycolor2';
import { format, startOfWeek, endOfWeek, parse } from 'date-fns';

interface ChartViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

const groupDataByInterval = (data: DataPoint[], interval: Interval, seriesByName: Record<string, { type?: string }>) => {
  const groupedData: Record<string, Record<string, { numericTotal: number, textValues: Record<string, number> }>> = {};

  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  sortedData.forEach((point) => {
    const date = new Date(point.timestamp);
    let timeKey: string;

    switch (interval) {
      case 'Min':
        timeKey = format(date, 'yyyy-MM-dd HH:mm');
        break;
      case 'Hour':
        timeKey = format(date, 'yyyy-MM-dd HH:00');
        break;
      case 'Week':
        timeKey = format(date, "yyyy-'W'II");
        break;
      case 'Month':
        timeKey = format(date, 'yyyy-MM');
        break;
      case 'Year':
        timeKey = format(date, 'yyyy');
        break;
      case 'Day':
      default:
        timeKey = format(date, 'yyyy-MM-dd');
        break;
    }

    if (!groupedData[timeKey]) {
      groupedData[timeKey] = {};
    }

    if (!groupedData[timeKey][point.series]) {
      groupedData[timeKey][point.series] = { numericTotal: 0, textValues: {} };
    }

    const seriesType = seriesByName[point.series]?.type ?? "text";
    if (seriesType === 'numeric') {
      groupedData[timeKey][point.series].numericTotal += Number(point.value);
    } else if (seriesType === 'text') {
      if (!groupedData[timeKey][point.series].textValues[point.value]) {
        groupedData[timeKey][point.series].textValues[point.value] = 0;
      }
      groupedData[timeKey][point.series].textValues[point.value]++;
    }
  });

  // Transform groupedData to chart data
  const transformedData = Object.entries(groupedData).map(([timeKey, seriesData]) => {
    const newEntry: Record<string, number | string> = { date: timeKey };
    Object.entries(seriesData).forEach(([series, seriesData]) => {
      if (seriesData.numericTotal > 0) {
        newEntry[series] = seriesData.numericTotal;
      }
      Object.entries(seriesData.textValues).forEach(([value, count]) => {
        const dataKey = `${series}::${value}`;
        newEntry[dataKey] = count;
      });
    });
    return newEntry;
  });

  console.log({ groupedData, transformedData });

  return transformedData;
};

const ChartView: React.FC<ChartViewProps> = memo(({ dataPoints, selectedSeries }) => {
  const [interval, setInterval] = useState<Interval>('Day');
  const seriesByName = useSeriesByName();
  const uniqueValuesBySeries = useSeriesUniqueValues();

  const transformedData = useMemo(() => groupDataByInterval(dataPoints, interval, seriesByName), [dataPoints, interval, seriesByName]);

  const getXAxisLabelFormatter = (interval: Interval) => {
    switch (interval) {
      case 'Year':
        return (dateStr: string) => dateStr;
      case 'Month':
        return (dateStr: string) => {
          // dateStr: '2025-06'
          const d = parse(dateStr, 'yyyy-MM', new Date());
          return format(d, 'LLLL');
        };
      case 'Week':
        return (dateStr: string) => {
          // dateStr: '2025-W20'
          const [year, week] = dateStr.split('-W');
          // Use parse with 'II' and a date in the correct year
          const d = parse(week, 'II', new Date(Number(year), 0, 1));
          const weekStart = startOfWeek(d, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(d, { weekStartsOn: 0 });
          const startMonth = format(weekStart, 'MMM');
          const endMonth = format(weekEnd, 'MMM');
          if (startMonth !== endMonth) {
            return `${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}`;
          } else {
            return `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}`;
          }
        };
      case 'Hour':
        return (dateStr: string) => {
          // dateStr: '2025-06-01 12:00'
          const d = parse(dateStr, 'yyyy-MM-dd HH:00', new Date());
          return format(d, 'h a');
        };
      case 'Min':
        return (dateStr: string) => {
          // dateStr: '2025-06-01 12:34'
          const d = parse(dateStr, 'yyyy-MM-dd HH:mm', new Date());
          return format(d, 'h:mm a');
        };
      case 'Day':
      default:
        return (dateStr: string) => {
          // dateStr: '2025-06-01'
          const d = parse(dateStr, 'yyyy-MM-dd', new Date());
          return format(d, 'MMM d');
        };
    }
  };

  return (
    <div className="chart-container">
      <div className="interval-toggle" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', border: '1px solid hsl(var(--border))', padding: '0.5rem', borderRadius: '0.25rem' }}>
        <IntervalPicker interval={interval} onIntervalChange={setInterval} />
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={transformedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <XAxis 
            dataKey="date" 
            tickFormatter={getXAxisLabelFormatter(interval)} 
            tickLine={false} 
            axisLine={{ stroke: 'var(--muted)', strokeWidth: 2 }}
          />
          <YAxis 
            yAxisId="left" 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
              color: 'var(--foreground)',
              padding: '1rem 1.25rem',
              minWidth: 180,
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1,
            }}
            labelStyle={{
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.25 }}
          />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />

          {selectedSeries
            .filter((series) => seriesByName[series]?.type === 'text')
            .flatMap((series) =>
              (uniqueValuesBySeries[series] || []).map((value, index) => {
                const baseColor = seriesByName[series]?.color || 'hsl(0, 0%, 50%)';
                const color = tinycolor(baseColor).spin(index * 30).toHexString();
                return (
                  <Bar
                    key={`${series}::${value}`}
                    dataKey={`${series}::${value}`}
                    name={` ${value}`}
                    fill={color}
                    stackId={series}
                    yAxisId="right"
                    isAnimationActive={false}
                  />
                );
              })
            )}

          {selectedSeries
            .filter((series) => seriesByName[series]?.type === 'numeric')
            .map((series) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                connectNulls
                dot
                name={series}
                stroke={seriesByName[series]?.color || 'hsl(0, 0%, 50%)'}
                yAxisId="left"
                isAnimationActive={false}
              />
            ))}
            
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ChartView;

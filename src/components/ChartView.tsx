import React, { useState, useMemo, memo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import type { DataPoint } from '@/services/db';
import IntervalPicker, { type Interval } from '@/components/ui/IntervalPicker';
import { useSeriesByName, useSeriesUniqueValues } from '@/store/dataStore';
import tinycolor from 'tinycolor2';

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
      case 'Week':
        timeKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        break;
      case 'Month':
        timeKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      case 'Year':
        timeKey = `${date.getFullYear()}`;
        break;
      case 'Day':
      default:
        timeKey = date.toLocaleDateString();
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

  return (
    <div className="chart-container">
      <div className="interval-toggle" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', border: '1px solid hsl(var(--border))', padding: '0.5rem', borderRadius: '0.25rem' }}>
        <IntervalPicker interval={interval} onIntervalChange={setInterval} />
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={transformedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />

          {selectedSeries
            .filter((series) => seriesByName[series]?.type === 'numeric')
            .map((series) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                name={series}
                stroke={seriesByName[series]?.color || 'hsl(0, 0%, 50%)'}
                dot={false}
                yAxisId="left"
                isAnimationActive={false}
              />
            ))}

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
                    name={`${series} - ${value}`}
                    fill={color}
                    stackId={series}
                    yAxisId="right"
                    isAnimationActive={false}
                  />
                );
              })
            )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ChartView;

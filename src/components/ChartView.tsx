import React, { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import type { DataPoint } from '@/services/db';
import IntervalPicker from '@/components/ui/IntervalPicker';
import { useSeriesByName, useSeriesUniqueValues } from '@/store/dataStore';
import tinycolor from 'tinycolor2';

interface ChartViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

type Interval = 'Day' | 'Week' | 'Month' | 'Year';

const groupDataByInterval = (data: DataPoint[], interval: Interval, seriesByName: Record<string, { type?: string }>) => {
  const groupedData: Record<string, { date: string, data: Record<string, { numericTotal: number, textValues: Record<string, number> }> }> = {};

  data.sort((a, b) => a.timestamp - b.timestamp);

  data.forEach((point) => {
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
      groupedData[timeKey] = { date: timeKey, data: {} };
    }

    if (!groupedData[timeKey].data[point.series]) {
      groupedData[timeKey].data[point.series] = { numericTotal: 0, textValues: {} };
    }

    const seriesType = seriesByName[point.series]?.type ?? "text";
    if (seriesType === 'numeric') {
      // Numeric series: sum values
      groupedData[timeKey].data[point.series].numericTotal += Number(point.value);
    } else if (seriesType === 'text') {
      // Text series: count occurrences of each unique value within the series
      if (!groupedData[timeKey].data[point.series].textValues[point.value]) {
        groupedData[timeKey].data[point.series].textValues[point.value] = 0;
      }
      groupedData[timeKey].data[point.series].textValues[point.value]++;
    }
  });

  // Transform groupedData to include stackId and dataKey for text series
  const transformedData = Object.values(groupedData).map((entry) => {
    const newEntry: Record<string, number | string> = { date: entry.date };

    Object.entries(entry.data).forEach(([series, seriesData]) => {
      // Add numeric totals directly
      if (seriesData.numericTotal > 0) {
        newEntry[series] = seriesData.numericTotal;
      }

      // Add text values with their unique keys
      Object.entries(seriesData.textValues).forEach(([value, count]) => {
        const dataKey = `${series}::${value}`;
        newEntry[dataKey] = count;
      });
    });

    return newEntry;
  });

  console.log("Data:", { groupedData, transformedData });

  return transformedData;
};

const ChartView: React.FC<ChartViewProps> = ({ dataPoints, selectedSeries }) => {
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
              />
            ))}

          {selectedSeries
            .filter((series) => seriesByName[series]?.type === 'text')
            .flatMap((series) =>
              (uniqueValuesBySeries[series] || []).map((value, index) => {
                const baseColor = seriesByName[series]?.color || 'hsl(0, 0%, 50%)';
                const color = tinycolor(baseColor).spin(index * 30).toHexString();
                console.log("Bar:", { series, value, color });
                return (
                  <Bar
                    key={`${series}::${value}`}
                    dataKey={`${series}::${value}`}
                    name={`${series} - ${value}`}
                    fill={color}
                    stackId={series}
                    yAxisId="right"
                  />
                );
              })
            )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartView;

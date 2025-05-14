import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '@/services/db';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ChartViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

type Interval = 'Day' | 'Week' | 'Month' | 'Year';

const groupDataByInterval = (data: DataPoint[], interval: Interval) => {
  const groupedData: Record<string, Record<string, number | string>> = {};

  data.forEach((point) => {
    const date = new Date(point.timestamp);
    let key: string;

    switch (interval) {
      case 'Week':
        key = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        break;
      case 'Month':
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      case 'Year':
        key = `${date.getFullYear()}`;
        break;
      case 'Day':
      default:
        key = date.toLocaleDateString();
        break;
    }

    if (!groupedData[key]) {
      groupedData[key] = { date: key };
    }

    groupedData[key][point.series] = (Number(groupedData[key][point.series]) || 0) + Number(point.value);
  });

  return Object.values(groupedData);
};

const ChartView: React.FC<ChartViewProps> = ({ dataPoints, selectedSeries }) => {
  const [interval, setInterval] = useState<Interval>('Day');

  const transformedData = groupDataByInterval(dataPoints, interval);

  return (
    <div className="chart-container">
      <div className="interval-toggle" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', border: '1px solid hsl(var(--border))', padding: '0.5rem', borderRadius: '0.25rem' }}>
        <ToggleGroup type="single" value={interval} onValueChange={(value) => setInterval(value as Interval)}>
          {['Day', 'Week', 'Month', 'Year'].map((int) => (
            <ToggleGroupItem key={int} value={int} className={interval === int ? 'active' : ''}>
              {int}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={transformedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          {selectedSeries.map((series) => (
            <Line
              key={series}
              type="monotone"
              dataKey={series}
              name={series}
              stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartView;

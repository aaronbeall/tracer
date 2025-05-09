import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '@/services/db';

interface ChartViewProps {
  dataPoints: DataPoint[];
  selectedTags: string[];
}

const ChartView: React.FC<ChartViewProps> = ({ dataPoints, selectedTags }) => {
  const transformedData = dataPoints.map((p) => ({
    ...p,
    date: new Date(p.timestamp).toLocaleDateString(), // Derive 'date' from 'timestamp'
  }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={transformedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} />
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          {selectedTags.map((tag) => (
            <Line
              key={tag}
              type="monotone"
              dataKey={(entry) => (entry.tag === tag ? entry.value : null)}
              name={tag}
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

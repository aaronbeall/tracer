import type { DataPoint } from '@/services/db';

interface CalendarViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ dataPoints, selectedSeries }) => {
  const filteredPoints = dataPoints.filter((p) => selectedSeries.includes(p.series));
  const pointsByDate: Record<string, DataPoint[]> = filteredPoints.reduce((acc: Record<string, DataPoint[]>, point) => {
    const date = new Date(point.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(point);
    return acc;
  }, {});

  return (
    <div className="calendar-container">
      {Object.entries(pointsByDate).map(([date, points]) => (
        <div key={date} className="calendar-day">
          <h3 className="calendar-date">{date}</h3>
          <div className="calendar-events">
            {points.map((point) => (
              <div key={point.id} className="calendar-event">
                <span className="event-series">{point.series}</span>
                <span className="event-value">{point.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarView;

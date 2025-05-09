import type { DataPoint } from '@/services/db';

interface CalendarViewProps {
  dataPoints: DataPoint[];
  selectedTags: string[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ dataPoints, selectedTags }) => {
  const filteredPoints = dataPoints.filter((p) => selectedTags.includes(p.tag));
  const pointsByDate: Record<string, DataPoint[]> = filteredPoints.reduce((acc, point) => {
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
                <span className="event-tag">{point.tag}</span>
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

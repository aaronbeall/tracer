import type { DataPoint } from '@/services/db';

interface TimelineViewProps {
  dataPoints: DataPoint[];
  selectedTags: string[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ dataPoints, selectedTags }) => {
  const filteredPoints = dataPoints
    .filter((p) => selectedTags.includes(p.tag))
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="timeline-container">
      {filteredPoints.map((point) => (
        <div key={point.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-date">
              {new Date(point.timestamp).toLocaleString()}
            </div>
            <div className="timeline-tag">{point.tag}</div>
            <div className="timeline-value">{point.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;

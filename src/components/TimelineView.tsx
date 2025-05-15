import type { DataPoint } from '@/services/db';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSeriesByName } from '@/store/dataStore';

interface TimelineViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ dataPoints }) => {
  const seriesByName = useSeriesByName();
  const sortedPoints = dataPoints.sort((a, b) => b.timestamp - a.timestamp);

  let lastDate: string | null = null;

  return (
    <Timeline>
      {sortedPoints.map((point) => {
        const currentDate = format(new Date(point.timestamp), 'MMMM d, yyyy');
        const isNewDay = currentDate !== lastDate;
        lastDate = currentDate;

        return (
          <>
            {isNewDay && (
              <TimelineItem key={`date-${currentDate}`} position="left">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <p className="font-bold text-gray-800">{currentDate}</p>
                </TimelineContent>
              </TimelineItem>
            )}
            <TimelineItem key={point.id} position="right">
              <TimelineOppositeContent>
                <p className="text-sm text-gray-500">{format(new Date(point.timestamp), 'h:mm a')}</p>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary" style={{ backgroundColor: seriesByName[point.series]?.color || 'black' }}/>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Badge style={{
                  backgroundColor: seriesByName[point.series]?.color || 'black',
                  color: 'white',
                }}>
                  {point.series}
                </Badge> {point.value}
              </TimelineContent>
            </TimelineItem>
          </>
        );
      })}
    </Timeline>
  );
};

export default TimelineView;

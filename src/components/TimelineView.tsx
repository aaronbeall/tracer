import React, { memo } from 'react';
import type { DataPoint } from '@/services/db';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSeriesByName } from '@/store/dataStore';

interface TimelineViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

const TimelineView: React.FC<TimelineViewProps> = memo(({ dataPoints }) => {
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
                <TimelineDot color="primary" style={{ backgroundColor: seriesByName[point.series]?.color || 'black' }}>
                  {/* <div className='absolute text-2xl -ml-3 -mt-4'>{seriesByName[point.series]?.emoji}</div> */}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Badge style={{
                  backgroundColor: seriesByName[point.series]?.color || 'black',
                  color: 'white',
                }}>
                  { seriesByName[point.series]?.emoji && (
                    <span className='scale-150 mr-1' style={{ textShadow: '0px 1px 2px rgba(0, 0, 0, 0.25)' }}>{seriesByName[point.series]?.emoji}</span> 
                  )}
                  {point.series}
                </Badge> {point.value}
              </TimelineContent>
            </TimelineItem>
          </>
        );
      })}
    </Timeline>
  );
});

export default TimelineView;

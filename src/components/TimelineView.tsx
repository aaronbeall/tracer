import React, { memo } from 'react';
import type { DataPoint } from '@/services/db';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { format } from 'date-fns';
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
            {/* {isNewDay && (
              <TimelineItem key={`date-${currentDate}`} position="left">
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <p className="font-bold text-gray-800">{currentDate}</p>
                </TimelineContent>
              </TimelineItem>
            )} */}
            <TimelineItem key={point.id} position="right">
              <TimelineOppositeContent className="pr-4 flex flex-col items-end justify-start min-w-[90px]">
                {isNewDay ? (
                  <>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200 leading-tight mb-0.5">
                      {format(new Date(point.timestamp), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      {format(new Date(point.timestamp), 'h:mm a')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    {format(new Date(point.timestamp), 'h:mm a')}
                  </span>
                )}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary" style={{ backgroundColor: seriesByName[point.series]?.color || 'black' }}>
                  {/* <div className='absolute text-2xl -ml-3 -mt-4'>{seriesByName[point.series]?.emoji}</div> */}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <div
                  className="inline-flex flex-wrap items-center min-w-[60px] max-w-xs rounded-full shadow-md border px-2 py-0 gap-x-0.5 gap-y-0.5 leading-tight"
                  style={{
                    backgroundColor: seriesByName[point.series]?.color || 'var(--primary)',
                    borderColor: 'rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.08)'
                  }}
                >
                  {/* Value */}
                  {typeof point.value === 'number' && !isNaN(point.value) ? (
                    <span
                      className="font-mono tabular-nums text-base font-bold text-white px-0.5"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {point.value}
                    </span>
                  ) : (
                    <span
                      className="font-sans text-base font-semibold text-white px-0.5"
                    >
                      {String(point.value)}
                    </span>
                  )}
                  {/* Emoji */}
                  {seriesByName[point.series]?.emoji && (
                    <span className="text-base ml-1" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.18)' }}>{seriesByName[point.series]?.emoji}</span>
                  )}
                  {/* Series name */}
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase ml-1"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {point.series}
                  </span>
                </div>
              </TimelineContent>
            </TimelineItem>
          </>
        );
      })}
    </Timeline>
  );
});

export default TimelineView;

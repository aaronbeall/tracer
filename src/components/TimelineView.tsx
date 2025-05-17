import React, { memo, useRef, useState, useCallback } from 'react';
import type { DataPoint } from '@/services/db';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { format } from 'date-fns';
import { useSeriesByName } from '@/store/dataStore';
import { useDebounceCallback } from 'usehooks-ts';
import Spinner from './ui/spinner';

interface TimelineViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

const PAGE_SIZE = 30;

const TimelineView: React.FC<TimelineViewProps> = memo(({ dataPoints }) => {
  const seriesByName = useSeriesByName();
  const sortedPoints = dataPoints.sort((a, b) => b.timestamp - a.timestamp);

  // Infinite scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedHandleScroll = useDebounceCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedPoints.length));
    }
  }, 100);

  // Only render up to visibleCount points
  let lastDate: string | null = null;
  const visiblePoints = sortedPoints.slice(0, visibleCount);

  return (
    <div ref={containerRef} onScroll={debouncedHandleScroll} style={{ maxHeight: 600, overflowY: 'auto' }}>
      <Timeline>
        {visiblePoints.map((point) => {
          const currentDate = format(new Date(point.timestamp), 'MMMM d, yyyy');
          const isNewDay = currentDate !== lastDate;
          lastDate = currentDate;

          return (
            <React.Fragment key={point.id}>
              <TimelineItem position="right">
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
                  <TimelineDot color="primary" style={{ backgroundColor: seriesByName[point.series]?.color || 'black' }} />
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
                    {seriesByName[point.series]?.emoji && (
                      <span className="text-base ml-1" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.18)' }}>{seriesByName[point.series]?.emoji}</span>
                    )}
                    <span
                      className="text-[10px] font-semibold tracking-wide uppercase ml-1"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {point.series}
                    </span>
                  </div>
                </TimelineContent>
              </TimelineItem>
            </React.Fragment>
          );
        })}
      </Timeline>
      {visibleCount < sortedPoints.length && (
        <div className="flex justify-center py-4">
          <Spinner className="text-blue-500" />
        </div>
      )}
      {visibleCount >= sortedPoints.length && (
        <div className="flex justify-center py-4">
          <span className="text-xs text-slate-400">No more data to load</span>
        </div>
      )}
    </div>
  );
});

export default TimelineView;

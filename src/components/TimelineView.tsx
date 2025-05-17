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

const TimelineView: React.FC<TimelineViewProps> = memo(({ dataPoints, selectedSeries }) => {
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
  const visiblePoints = sortedPoints.slice(0, visibleCount);

  // Build a combined, chronologically sorted list of events: series created and data points
  type TimelineEvent =
    | { type: 'created', series: typeof seriesByName[string] }
    | { type: 'point', point: DataPoint };

  const events: TimelineEvent[] = [];
  // Add created events for selected series
  selectedSeries.forEach(seriesName => {
    const series = seriesByName[seriesName];
    if (series && series.createdAt) {
      events.push({ type: 'created', series });
    }
  });
  // Add data points
  visiblePoints.forEach(point => {
    events.push({ type: 'point', point });
  });
  // Sort all events by date descending (newest first)
  events.sort((a, b) => {
    const aTime = a.type === 'created' ? new Date(a.series.createdAt).getTime() : a.point.timestamp;
    const bTime = b.type === 'created' ? new Date(b.series.createdAt).getTime() : b.point.timestamp;
    return bTime - aTime;
  });

  let lastDate: string | null = null;

  return (
    <div ref={containerRef} onScroll={debouncedHandleScroll} style={{ maxHeight: 600, overflowY: 'auto' }}>
      <Timeline>
        {events.map((event) => {
          let eventDate: Date;
          let key: string;
          let isCreated = false;
          let series: typeof seriesByName[string] | undefined;
          let point: DataPoint | undefined;
          if (event.type === 'created') {
            eventDate = new Date(event.series.createdAt);
            key = `created-${event.series.name}`;
            isCreated = true;
            series = event.series;
          } else {
            eventDate = new Date(event.point.timestamp);
            key = event.point.id.toString();
            point = event.point;
            series = seriesByName[point.series];
          }
          const currentDate = format(eventDate, 'MMMM d, yyyy');
          const isNewDay = currentDate !== lastDate;
          lastDate = currentDate;
          return (
            <TimelineItem key={key} position="right">
              <TimelineOppositeContent className="pr-4 flex flex-col items-end justify-start min-w-[90px]">
                {isNewDay ? (
                  <>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-200 leading-tight mb-0.5">
                      {format(eventDate, 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      {format(eventDate, 'h:mm a')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    {format(eventDate, 'h:mm a')}
                  </span>
                )}
              </TimelineOppositeContent>
              <TimelineSeparator>
                {isCreated ? (
                  <TimelineDot variant="outlined" style={{ borderColor: series?.color || 'black', background: 'transparent' }} />
                ) : (
                  <TimelineDot color="primary" style={{ backgroundColor: series?.color || 'black' }} />
                )}
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                {isCreated ? (
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-300 shadow-sm">
                    <span className="font-semibold" style={{ color: series?.color || undefined }}>{series?.name}</span>
                    <span className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold ml-1 uppercase tracking-wide text-[10px]">series created</span>
                    {series?.emoji && <span className="ml-1">{series.emoji}</span>}
                  </div>
                ) : point && (
                  <div
                    className="inline-flex flex-wrap items-center min-w-[60px] max-w-xs rounded-full shadow-md border px-2 py-0 gap-x-0.5 gap-y-0.5 leading-tight"
                    style={{
                      backgroundColor: series?.color || 'var(--primary)',
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
                    {series?.emoji && (
                      <span className="text-base ml-1" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.18)' }}>{series.emoji}</span>
                    )}
                    <span
                      className="text-[10px] font-semibold tracking-wide uppercase ml-1"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {point.series}
                    </span>
                  </div>
                )}
              </TimelineContent>
            </TimelineItem>
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
          <span className="text-xs text-slate-400">No more data</span>
        </div>
      )}
    </div>
  );
});

export default TimelineView;

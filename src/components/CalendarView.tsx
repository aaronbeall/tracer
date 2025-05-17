import React, { memo, useState } from 'react';
import type { DataPoint } from '@/services/db';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, startOfYear, addMonths, getDaysInMonth, isSameDay, isSameMonth, isSameYear, getDay, getMonth, getDate, getYear, setHours, setMinutes, setSeconds, addYears } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSeriesByName } from '@/store/dataStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

interface CalendarViewProps {
  dataPoints: DataPoint[];
  selectedSeries: string[];
}

type CalendarMode = 'day' | 'week' | 'month' | 'year';

const CalendarView: React.FC<CalendarViewProps> = memo(({ dataPoints, selectedSeries }) => {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const filteredPoints = dataPoints.filter((p) => selectedSeries.includes(p.series));
  const seriesByName = useSeriesByName();

  // Helper: group points by date string (YYYY-MM-DD)
  const pointsByDate: Record<string, DataPoint[]> = {};
  filteredPoints.forEach(point => {
    const d = new Date(point.timestamp);
    const key = format(d, 'yyyy-MM-dd');
    if (!pointsByDate[key]) pointsByDate[key] = [];
    pointsByDate[key].push(point);
  });

  // Helper: get time label for day view
  const getTimeLabels = () => Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // Helper: get week days
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  // Helper: get month grid
  const getMonthGrid = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const end = addDays(endOfMonth(date), 6 - getDay(endOfMonth(date)));
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    return days;
  };

  // Helper: get year grid
  const getYearGrid = (date: Date) => {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfYear(date), i));
    return months;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Mode selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        {/* Navigator aligned left */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              onClick={() => {
                if (mode === 'day') setCurrentDate(addDays(currentDate, -1));
                else if (mode === 'week') setCurrentDate(addDays(currentDate, -7));
                else if (mode === 'month') setCurrentDate(addMonths(currentDate, -1));
                else if (mode === 'year') setCurrentDate(addYears(currentDate, -1));
              }}
              aria-label="Previous"
              type="button"
            >
              &#8592;
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (mode === 'day') setCurrentDate(addDays(currentDate, 1));
                else if (mode === 'week') setCurrentDate(addDays(currentDate, 7));
                else if (mode === 'month') setCurrentDate(addMonths(currentDate, 1));
                else if (mode === 'year') setCurrentDate(addYears(currentDate, 1));
              }}
              aria-label="Next"
              type="button"
            >
              &#8594;
            </Button>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-base min-w-[120px] text-center">
            {mode === 'day' && format(currentDate, 'MMMM d, yyyy')}
            {mode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6), 'MMM d, yyyy')}`}
            {mode === 'month' && format(currentDate, 'MMMM yyyy')}
            {mode === 'year' && format(currentDate, 'yyyy')}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              const today = new Date();
              setCurrentDate(today);
            }}
            aria-label="Today"
            type="button"
          >
            <CalendarDays className="mr-1" />
            Today
          </Button>
        </div>
        {/* Mode picker aligned right */}
        <div className="interval-toggle ml-auto">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => setMode(value as CalendarMode)}
            className="border border-gray-300 rounded-md"
          >
            {(['day', 'week', 'month', 'year'] as CalendarMode[]).map((m) => (
              <ToggleGroupItem
                key={m}
                value={m}
                className={mode === m ? 'active' : ''}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {/* Calendar grid */}
      {mode === 'day' && (() => {
        const dayPoints = filteredPoints.filter(p => isSameDay(new Date(p.timestamp), currentDate)).sort((a, b) => a.timestamp - b.timestamp);
        const containerHeight = dayPoints.length > 0 ? (dayPoints.length * 34 + 64) : 104; // 34px per point, 64px for header/spacing, min 104px
        return (
          <div className="overflow-x-auto">
            <div className="relative border rounded-lg bg-white dark:bg-slate-900 w-full" style={{ height: containerHeight }}>
              {/* Hour grid lines */}
              <div className="absolute inset-0 flex z-0 w-full h-full">
                {getTimeLabels().map((label) => {
                  const hour = Number(label.split(':')[0]);
                  const hourDate = setHours(setMinutes(setSeconds(currentDate, 0), 0), hour);
                  const displayLabel = format(hourDate, 'h a'); // e.g. 1 AM, 2 AM, ... 12 PM
                  return (
                    <div
                      key={label}
                      className="flex-1 min-w-0 border-l last:border-r border-slate-200 h-full relative"
                    >
                      <span className="text-xs text-slate-400 absolute top-1 left-1 z-10">
                        {displayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Data points overlay */}
              <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                {dayPoints.map((p, idx) => {
                  const d = new Date(p.timestamp);
                  const hour = d.getHours();
                  const minute = d.getMinutes();
                  const left = ((hour * 60 + minute) / 1440) * 100; // percent across 24h
                  const verticalOffset = idx * 34; // increased px per stacked item for more space between points
                  const color = seriesByName?.[p.series]?.color || '#3b82f6';
                  const emoji = seriesByName?.[p.series]?.emoji;
                  const value = typeof p.value === 'number' ? p.value : String(p.value);
                  const time = format(d, 'h:mm a');
                  // The dot is 8px wide, pill is to the right, so align the dot center to the time
                  // Dot left: left% - 4px (half dot width)
                  // Pill left: left% + 6px (dot width + gap)
                  const dotLeft = `calc(${left}% - 4px)`;
                  const pillLeft = `calc(${left}% + 10px)`;
                  return (
                    <React.Fragment key={p.id}>
                      {/* Colored dot aligned to time */}
                      <span
                        className="absolute w-2 h-2 rounded-full z-20"
                        style={{ left: dotLeft, top: `${verticalOffset + 40}px`, backgroundColor: color, flexShrink: 0 }}
                      />
                      {/* Subtle pill to the right of the dot */}
                      <div
                        className="absolute z-10"
                        style={{ left: pillLeft, top: `${verticalOffset + 32}px`, pointerEvents: 'auto' }}
                      >
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                          {emoji && (
                            <span className="text-base select-none" style={{ lineHeight: 1 }}>{emoji}</span>
                          )}
                          <span
                            className={`font-mono text-sm font-bold px-0.5 whitespace-normal ${typeof p.value !== 'number' ? 'break-all' : 'break-words'}`}
                            style={{ color }}
                          >
                            {value}
                          </span>
                          <span className="text-xs opacity-80 whitespace-nowrap text-slate-500 dark:text-slate-300">
                            {time}
                          </span>
                          <span
                            className="text-xs font-bold ml-1 px-1 rounded"
                            style={{ color, backgroundColor: color + '10' }} // subtle background using color with low opacity
                          >
                            {p.series.toUpperCase()}
                          </span>
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
      {mode === 'week' && (
        <div className="overflow-x-auto">
          <div className="flex">
            {getWeekDays(currentDate).map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              const points = filteredPoints.filter(p => isSameDay(new Date(p.timestamp), date));
              return (
                <div key={key} className="flex-1 min-w-[140px] max-w-[180px] border-l last:border-r border-slate-200 flex flex-col">
                  <div className="text-center py-2 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">{format(date, 'EEE d')}</div>
                  <div className="flex-1 flex flex-wrap content-start items-start min-h-[120px] py-2 gap-2 overflow-y-auto px-2">
                    {points.length === 0 && <span className="text-xs text-slate-300">No data</span>}
                    {points
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((p) => {
                        const color = seriesByName?.[p.series]?.color || '#3b82f6';
                        const emoji = seriesByName?.[p.series]?.emoji;
                        const value = typeof p.value === 'number' ? p.value : String(p.value);
                        const time = format(new Date(p.timestamp), 'h:mm a');
                        return (
                          <Tooltip key={p.id}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center w-full min-w-[100px] max-w-full break-words gap-1">
                                <div
                                  className="flex flex-wrap items-center gap-1 w-full px-1.5 py-0.5 rounded-md shadow border bg-white/90 dark:bg-slate-900/80 break-words whitespace-normal"
                                  style={{ borderLeft: `6px solid ${color}`, borderColor: color }}
                                >
                                  {emoji && (
                                    <span className="text-base select-none break-words whitespace-normal" style={{ lineHeight: 1 }}>{emoji}</span>
                                  )}
                                  <span
                                    className={`font-mono text-sm font-bold px-0.5 whitespace-normal ${typeof p.value !== 'number' ? 'break-all' : 'break-words'}`}
                                    style={{ color }}
                                  >
                                    {value}
                                  </span>
                                  <span className="text-xs opacity-80 whitespace-normal break-words text-slate-500 dark:text-slate-300">
                                    {time}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{p.series}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mode === 'month' && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {getWeekDays(currentDate).map((d) => (
              <div key={d.toISOString()} className="text-center py-2 font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">{format(d, 'EEE')}</div>
            ))}
            {getMonthGrid(currentDate).map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              const points = pointsByDate[key] || [];
              const isCurrentMonth = isSameMonth(date, currentDate);
              return (
                <div key={key} className={`min-h-[60px] p-1 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${!isCurrentMonth ? 'opacity-40' : ''}`}> 
                  <div className="text-xs text-slate-400 mb-1">{getDate(date)}</div>
                  <div className="flex flex-col gap-0.5">
                    {points.map((p) => {
                      const color = seriesByName?.[p.series]?.color || '#3b82f6';
                      const emoji = seriesByName?.[p.series]?.emoji;
                      const value = typeof p.value === 'number' ? p.value : String(p.value);
                      const time = format(new Date(p.timestamp), 'h:mm a');
                      return (
                        <span
                          key={p.id}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded-full border text-[10px] font-semibold shadow-sm mb-0.5"
                          style={{ borderColor: color, color, backgroundColor: color + '10', lineHeight: 1 }}
                          title={`${p.series}: ${value} @ ${time}`}
                        >
                          {emoji && <span className="text-xs select-none" style={{ lineHeight: 1 }}>{emoji}</span>}
                          <span className="font-mono" style={{ color }}>{value}</span>
                          <span className="opacity-70 ml-0.5" style={{ color }}>{time}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mode === 'year' && (
        <div className="grid grid-cols-4 gap-4">
          {getYearGrid(currentDate).map((monthDate) => {
            const days = getDaysInMonth(monthDate);
            const monthLabel = format(monthDate, 'MMM');
            return (
              <div key={monthLabel} className="bg-white dark:bg-slate-900 rounded-lg shadow p-2">
                <div className="text-center font-semibold text-slate-700 dark:text-slate-200 mb-2">{monthLabel}</div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: days }, (_, i) => {
                    const date = addDays(monthDate, i);
                    const key = format(date, 'yyyy-MM-dd');
                    const hasData = (pointsByDate[key] || []).length > 0;
                    return (
                      <div key={key} className={`w-2 h-2 rounded-full ${hasData ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default CalendarView;

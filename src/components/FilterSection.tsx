import type { TimeFrame } from "./TimeFramePicker";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataSeries } from '@/services/db';
import { Edit } from 'lucide-react';
import React from 'react';
import type { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import SeriesBadge from './SeriesBadge';
import { TimeFramePicker } from './TimeFramePicker';

interface FilterSectionProps {
  availableSeries: string[];
  selectedSeries: string[];
  onSelectedSeriesChange: (series: string[]) => void;
  seriesByName: Record<string, DataSeries>;
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  customRange: DateRange | undefined;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  availableSeries,
  selectedSeries,
  onSelectedSeriesChange,
  seriesByName,
  timeFrame,
  onTimeFrameChange,
  customRange,
  onCustomRangeChange,
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge
          variant={selectedSeries.length === 0 ? 'default' : 'outline'}
          onClick={() => onSelectedSeriesChange([])}
          className="cursor-pointer px-4 py-1 rounded-full text-base font-medium shadow-sm transition-colors border border-transparent focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          All
        </Badge>
        {availableSeries.map((series) => (
          <SeriesBadge
            key={series}
            series={seriesByName[series]}
            isSelected={selectedSeries.includes(series)}
            onClick={() => {
              onSelectedSeriesChange(
                selectedSeries.includes(series)
                  ? selectedSeries.filter((s) => s !== series)
                  : [...selectedSeries, series]
              );
            }}
          />
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => navigate('/series-settings')}
        >
          <Edit />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <TimeFramePicker
          timeFrame={timeFrame}
          onTimeFrameChange={onTimeFrameChange}
          customRange={customRange}
          onCustomRangeChange={onCustomRangeChange}
        />
      </div>
    </div>
  );
};

export default FilterSection;
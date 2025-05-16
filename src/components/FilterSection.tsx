import type { TimeFrame } from "./TimeFramePicker";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <Card className="p-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge
            variant={selectedSeries.length === 0 ? 'default' : 'outline'}
            onClick={() => onSelectedSeriesChange([])}
            className="cursor-pointer"
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
                  availableSeries.includes(series)
                    ? availableSeries.filter((s) => s !== series)
                    : [...availableSeries, series]
                );
              }}
            />
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
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
    </Card>
  );
};

export default FilterSection;
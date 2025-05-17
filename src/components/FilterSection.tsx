import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataSeries } from '@/services/db';
import type { DataPoint } from '@/services/db';
import { Edit } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SeriesBadge from './SeriesBadge';

interface FilterSectionProps {
  availableSeries: string[];
  selectedSeries: string[];
  onSelectedSeriesChange: (series: string[]) => void;
  seriesByName: Record<string, DataSeries>;
  dataPoints: DataPoint[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  availableSeries,
  selectedSeries,
  onSelectedSeriesChange,
  seriesByName,
  dataPoints,
}) => {
  const navigate = useNavigate();
  // Count data points per series
  const seriesCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const point of dataPoints) {
      counts[point.series] = (counts[point.series] || 0) + 1;
    }
    return counts;
  }, [dataPoints]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge
          variant={selectedSeries.length === 0 ? 'default' : 'outline'}
          onClick={() => onSelectedSeriesChange([])}
          className="cursor-pointer px-4 py-1 rounded-full text-base font-medium shadow-sm transition-colors border border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 flex items-center gap-1"
        >
          <span className="w-4 h-4 mr-1 text-lg font-black leading-none text-yellow-400 dark:text-yellow-300 select-none" style={{fontFamily: 'monospace', lineHeight: 1}}>*</span> All
        </Badge>
        {availableSeries.map((series) => (
          <div className="relative" key={series}>
            <SeriesBadge
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
            {seriesCounts[series] > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded-full px-1 py-0.5 shadow-sm border border-white select-none">
                {seriesCounts[series]}
              </span>
            )}
          </div>
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
    </div>
  );
};

export default FilterSection;
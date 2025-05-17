import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataSeries } from '@/services/db';
import { Edit } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SeriesBadge from './SeriesBadge';

interface FilterSectionProps {
  availableSeries: string[];
  selectedSeries: string[];
  onSelectedSeriesChange: (series: string[]) => void;
  seriesByName: Record<string, DataSeries>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  availableSeries,
  selectedSeries,
  onSelectedSeriesChange,
  seriesByName,
}) => {
  const navigate = useNavigate();
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
    </div>
  );
};

export default FilterSection;
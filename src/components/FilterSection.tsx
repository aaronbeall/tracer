import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataSeries } from '@/services/db';
import type { DataPoint } from '@/services/db';
import { Edit } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SeriesBadge from './SeriesBadge';
import { computeSeriesStats } from '@/lib/seriesStats';

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

  // Per-series stats (count, last value, numeric range/trend/streak, or most common text value)
  const seriesStats = React.useMemo(
    () => computeSeriesStats(dataPoints, seriesByName),
    [dataPoints, seriesByName]
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge
          variant={selectedSeries.length === 0 ? 'default' : 'outline'}
          onClick={() => onSelectedSeriesChange([])}
          className="cursor-pointer px-3 py-1 rounded-full text-sm font-medium transition-colors border focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          All
        </Badge>
        {availableSeries.map((series) => (
          <div className="relative" key={series}>
            <SeriesBadge
              series={seriesByName[series]}
              isSelected={selectedSeries.includes(series)}
              stats={seriesStats[series]}
              onClick={() => {
                onSelectedSeriesChange(
                  selectedSeries.includes(series)
                    ? selectedSeries.filter((s) => s !== series)
                    : [...selectedSeries, series]
                );
              }}
            />
            {seriesStats[series]?.count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-secondary text-foreground font-mono text-[10px] font-semibold rounded-full px-1 py-0.5 shadow-sm border border-card select-none">
                {seriesStats[series].count}
              </span>
            )}
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 rounded-full border border-border hover:bg-accent"
          onClick={() => navigate('/series-settings')}
        >
          <Edit className="text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default FilterSection;
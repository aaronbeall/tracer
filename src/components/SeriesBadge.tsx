import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DataSeries } from '@/services/db';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SeriesStat } from '@/lib/seriesStats';

type SeriesBadgeProps = {
  series: DataSeries;
  isSelected: boolean;
  onClick: () => void;
  stats?: SeriesStat;
};

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const formatStats = (stats: SeriesStat): string => {
  const lastAgo = formatDistanceToNow(new Date(stats.last.timestamp), { addSuffix: true });
  const lastValue = typeof stats.last.value === 'number' ? formatNumber(stats.last.value) : stats.last.value;
  const lastLine = `Last: ${lastValue} (${lastAgo})`;

  let line = lastLine;
  if (stats.avg !== undefined && stats.min !== undefined && stats.max !== undefined) {
    line += `  ·  Avg ${formatNumber(stats.avg)}  ·  Range ${formatNumber(stats.min)}–${formatNumber(stats.max)}`;
  } else if (stats.mode) {
    line += `  ·  Most common: ${stats.mode.value} (${stats.mode.count}×)`;
  }
  if (stats.streak > 1) {
    line += `  ·  🔥 ${stats.streak}-day streak`;
  }
  return line;
};

const TrendIcon: React.FC<{ trend: SeriesStat['trend'] }> = ({ trend }) => {
  if (!trend) return null;
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return <Icon size={14} className="opacity-70 shrink-0" style={{ color: 'currentColor' }} />;
};

const SeriesBadge: React.FC<SeriesBadgeProps> = ({
  series,
  isSelected,
  onClick,
  stats,
}) => {
  // Series identity color is the only color allowed to appear here — everything
  // else in the app's chrome is neutral, so a colored badge always reads as data.
  const badgeStyle = isSelected
    ? {
        backgroundColor: series.color || 'var(--foreground)',
        color: 'white',
        borderColor: 'transparent',
      }
    : {
        borderColor: series.color || 'var(--foreground)',
        color: series.color || 'var(--foreground)',
        backgroundColor: 'transparent',
      };

  const BadgeContent = (
    <Badge
      key={series.name}
      variant={isSelected ? 'default' : 'outline'}
      onClick={onClick}
      className="cursor-pointer px-3 py-1 rounded-full text-sm font-medium transition-colors border hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 select-none flex items-center gap-1"
      style={badgeStyle}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {series.emoji && <span className='text-lg -my-2 -ml-1 mr-1'>{series.emoji}</span>} {series.name}
      <TrendIcon trend={stats?.trend} />
    </Badge>
  );

  return series.description || stats ? (
    <Tooltip>
      <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
      <TooltipContent>
        {series.description && <div>{series.description}</div>}
        {stats && <div>{formatStats(stats)}</div>}
      </TooltipContent>
    </Tooltip>
  ) : (
    BadgeContent
  );
};

export default SeriesBadge;

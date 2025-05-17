import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DataSeries } from '@/services/db';

type SeriesBadgeProps = {
  series: DataSeries;
  isSelected: boolean;
  onClick: () => void;
};

const SeriesBadge: React.FC<SeriesBadgeProps> = ({
  series,
  isSelected,
  onClick,
}) => {
  // Consistent, modern style: match the 'All' badge in FilterSection
  const badgeStyle = isSelected
    ? {
        backgroundColor: series.color || 'var(--primary)',
        color: 'white',
        borderColor: 'transparent',
      }
    : {
        borderColor: series.color || 'var(--primary)',
        color: series.color || 'var(--primary)',
        backgroundColor: 'transparent',
      };

  const BadgeContent = (
    <Badge
      key={series.name}
      variant={isSelected ? 'default' : 'outline'}
      onClick={onClick}
      className={
        'cursor-pointer px-4 py-1 rounded-full text-base font-medium shadow-sm transition-colors border border-transparent hover:bg-primary/10 hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40 select-none flex items-center gap-1' +
        (isSelected ? ' ring-primary/30 hover:opacity-90' : '')
      }
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
    </Badge>
  );

  return series.description ? (
    <Tooltip>
      <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
      <TooltipContent>{series.description}</TooltipContent>
    </Tooltip>
  ) : (
    BadgeContent
  );
};

export default SeriesBadge;

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
  const badgeStyle = isSelected
    ? {
        backgroundColor: series.color || 'black',
        color: 'white',
      }
    : {
        borderColor: series.color || 'black',
        color: series.color || 'black',
      };

  const BadgeContent = (
    <Badge
      key={series.name}
      variant={isSelected ? 'default' : 'outline'}
      onClick={onClick}
      className="cursor-pointer"
      style={badgeStyle}
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

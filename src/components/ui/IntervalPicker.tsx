import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type Interval = 'Min' | 'Hour' | 'Day' | 'Week' | 'Month' | 'Year';

const options: Interval[] = ['Min', 'Hour', 'Day', 'Week', 'Month', 'Year'];

interface IntervalPickerProps {
  interval: Interval;
  onIntervalChange: (interval: Interval) => void;
}

const IntervalPicker: React.FC<IntervalPickerProps> = ({ interval, onIntervalChange }) => {
  return (
    <ToggleGroup
      type="single"
      value={interval}
      onValueChange={(value) => onIntervalChange(value as Interval)}
      className="border border-gray-300 rounded-md"
    >
      {options.map((int) => (
        <ToggleGroupItem
          key={int}
          value={int}
          className={interval === int ? 'active' : ''}
        >
          {int}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default IntervalPicker;

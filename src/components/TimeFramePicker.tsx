import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "./ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

export type TimeFrame = 'All Time' | 'Past Week' | 'Past Month' | 'Past Year' | 'YTD' | 'Custom...';

interface TimeFramePickerProps {
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  customRange: DateRange | undefined;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export const TimeFramePicker: React.FC<TimeFramePickerProps> = ({ timeFrame, onTimeFrameChange, customRange, onCustomRangeChange }) => (
  <>
    {timeFrame === 'Custom...' && (
      <DateRangePicker
        selectedDate={customRange}
        onDateChange={onCustomRangeChange}
      />
    )}
    <Select value={timeFrame} onValueChange={value => onTimeFrameChange(value as TimeFrame)}>
      <SelectTrigger className="border rounded px-2 py-1 text-sm">
        {timeFrame}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All Time">All Time</SelectItem>
        <SelectItem value="Past Week">Past Week</SelectItem>
        <SelectItem value="Past Month">Past Month</SelectItem>
        <SelectItem value="Past Year">Past Year</SelectItem>
        <SelectItem value="YTD">YTD</SelectItem>
        <SelectItem value="Custom...">Custom...</SelectItem>
      </SelectContent>
    </Select>
  </>
);

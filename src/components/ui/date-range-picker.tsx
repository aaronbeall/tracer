import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange, SelectRangeEventHandler } from "react-day-picker";

type DatePickerProps = {
  selectedDate: DateRange | undefined;
  onDateChange: SelectRangeEventHandler;
  placeholder?: string;
}

function DateRangeLabel({ selectedDate, placeholder }: { selectedDate: DateRange | undefined; placeholder: string }) {
  if (!selectedDate) {
    return <span>{placeholder}</span>;
  }

  const { from, to } = selectedDate;
  if (!from && !to) {
    return <span>{placeholder}</span>;
  }

  if (from && to) {
    const sameMonth = from.getMonth() === to.getMonth();
    const sameYear = from.getFullYear() === to.getFullYear();

    if (sameMonth && sameYear) {
      return <span>{`${format(from, "MMM d")} - ${format(to, "d, yyyy")}`}</span>;
    } else if (sameYear) {
      return <span>{`${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`}</span>;
    }
  }

  const fromFormatted = from ? format(from, "MMM d, yyyy") : "...";
  const toFormatted = to ? format(to, "MMM d, yyyy") : "...";

  return <span>{`${fromFormatted} - ${toFormatted}`}</span>;
}

export function DateRangePicker({ selectedDate, onDateChange, placeholder = "Pick a date range" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon />
          <DateRangeLabel selectedDate={selectedDate} placeholder={placeholder} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selectedDate}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

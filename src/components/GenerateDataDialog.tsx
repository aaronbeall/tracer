import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDataStore } from '@/store/dataStore';
import type { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import { generateNumericSeries, generateTextSeries, PATTERN_LABELS, type GenerationPattern } from '@/lib/demoData';

interface GenerateDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NUMERIC_SERIES: Record<string, { baseValue: number; decimals: number }> = {
  weight: { baseValue: 70, decimals: 1 },
  sales: { baseValue: 300, decimals: 0 },
  expenses: { baseValue: 150, decimals: 0 },
};

const TEXT_SERIES: Record<string, string[]> = {
  mood: ['Happy', 'Sad', 'Excited', 'Angry', 'Relaxed'],
  exercise: ['Running', 'Cycling', 'Swimming', 'Yoga', 'Weightlifting'],
};

const GenerateDataDialog: React.FC<GenerateDataDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedSeries, setSelectedSeries] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [frequency, setFrequency] = useState(1);
  const [pattern, setPattern] = useState<GenerationPattern>('random');
  const importPoints = useDataStore((s) => s.importPoints);

  const isNumeric = selectedSeries in NUMERIC_SERIES;

  const handleDateChange: SelectRangeEventHandler = (range) => {
    if (range) {
      setDateRange({ from: range.from, to: range.to });
    }
  };

  const handleGenerate = async () => {
    if (!selectedSeries || !dateRange.from || !dateRange.to) {
      toast.error('Please select a series and a valid date range.');
      return;
    }

    const skipProbability = frequency < 1 ? 1 - frequency : 0;
    const pointsPerDay = Math.max(1, Math.round(frequency));

    const points = isNumeric
      ? generateNumericSeries({
          series: selectedSeries,
          startDate: dateRange.from,
          endDate: dateRange.to,
          pattern,
          baseValue: NUMERIC_SERIES[selectedSeries].baseValue,
          noiseAmplitude: NUMERIC_SERIES[selectedSeries].baseValue * 0.15,
          decimals: NUMERIC_SERIES[selectedSeries].decimals,
          skipProbability,
          pointsPerDay,
        })
      : generateTextSeries(
          selectedSeries,
          dateRange.from,
          dateRange.to,
          TEXT_SERIES[selectedSeries],
          TEXT_SERIES[selectedSeries].map(() => 1),
          skipProbability
        );

    try {
      await importPoints(points);
      toast.success('Dummy data generated successfully!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save the generated data. Please try again.');
      console.error('Failed to save the generated data:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent onInteractOutside={e => e.preventDefault()}>
        <DialogTitle>Add Dummy Data</DialogTitle>
        <DialogDescription>Select a series and date range to generate random data.</DialogDescription>
        <div className="mb-4">
          <Select value={selectedSeries} onValueChange={setSelectedSeries}>
            <SelectTrigger className="w-full">{selectedSeries || 'Select Series'}</SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="mood">Mood</SelectItem>
              <SelectItem value="exercise">Exercise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isNumeric && (
          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground mb-1.5 block">Pattern</Label>
            <Select value={pattern} onValueChange={(v) => setPattern(v as GenerationPattern)}>
              <SelectTrigger className="w-full">{PATTERN_LABELS[pattern]}</SelectTrigger>
              <SelectContent>
                {(Object.keys(PATTERN_LABELS) as GenerationPattern[]).map((p) => (
                  <SelectItem key={p} value={p}>{PATTERN_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="mb-4">
          <DateRangePicker selectedDate={dateRange} onDateChange={handleDateChange} />
        </div>
        <div className="mb-4">
          <label htmlFor="frequency-slider" className="block text-sm font-medium text-muted-foreground">
            Frequency (per day)
          </label>
          <Slider
            id="frequency-slider"
            value={[frequency]}
            onValueChange={(value) => setFrequency(value[0])}
            min={0.1}
            max={10}
            step={0.1}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {frequency === 1
              ? 'Once per day'
              : frequency < 1
              ? `Every ${Math.round(1 / frequency)} days`
              : `${Math.round(frequency)} times a day`}
          </p>
        </div>
        <Button
          variant="default"
          onClick={handleGenerate}
          disabled={!selectedSeries || !dateRange.from || !dateRange.to}
          className="mt-1 w-auto"
        >
          Generate Data
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDataDialog;

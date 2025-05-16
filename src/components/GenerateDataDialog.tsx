import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDataStore } from '@/store/dataStore';
import type { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import type { DataPoint } from '../services/db';

interface GenerateDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateDataDialog: React.FC<GenerateDataDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedSeries, setSelectedSeries] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [frequency, setFrequency] = useState(1);
  const { addDataPoint } = useDataStore();

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

    const data: Omit<DataPoint, "id">[] = [];
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const totalEntries = Math.round(days * frequency);
    const possibleMoods = ['Happy', 'Sad', 'Excited', 'Angry', 'Relaxed'];
    const possibleExercises = ['Running', 'Cycling', 'Swimming', 'Yoga', 'Weightlifting'];

    for (let i = 0; i < totalEntries; i++) {
      const date = new Date(startDate.getTime() + (i * (1000 * 60 * 60 * 24)) / frequency);
      let value;

      switch (selectedSeries) {
        case 'weight':
          value = parseFloat((Math.random() * 20 + 60).toFixed(1));
          break;
        case 'sales':
          value = Math.floor(Math.random() * 500 + 100);
          break;
        case 'expenses':
          value = Math.floor(Math.random() * 200 + 50);
          break;
        case 'mood':
          value = possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
          break;
        case 'exercise':
          value = possibleExercises[Math.floor(Math.random() * possibleExercises.length)];
          break;
        default:
          value = 0;
      }

      data.push({
        series: selectedSeries,
        value,
        timestamp: date.getTime(),
      });
    }

    try {
      for (const { series, value, timestamp } of data) {
        await addDataPoint({ series, value, timestamp });
      }
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
        <div className="mb-4">
          <DateRangePicker selectedDate={dateRange} onDateChange={handleDateChange} />
        </div>
        <div className="mb-4">
          <label htmlFor="frequency-slider" className="block text-sm font-medium text-gray-700">
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
          <p className="text-sm text-gray-500 mt-1">
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

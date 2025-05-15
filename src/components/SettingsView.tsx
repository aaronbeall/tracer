import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import type { DataPoint } from '../services/db';
import { useDataStore } from '@/store/dataStore';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    addDataPoint,
    deleteDataPoint,
    dataPoints,
  } = useDataStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [frequency, setFrequency] = useState(1);

  const handleDateChange: SelectRangeEventHandler = (range) => {
    if (range) {
      setDateRange({ from: range.from, to: range.to });
    }
  };

  const handleDeleteDatabase = async () => {
    if (window.confirm('Are you sure you want to delete the local database? This action cannot be undone.')) {
      try {
        for (const point of dataPoints) {
          await deleteDataPoint(point.id);
        }
        toast.success('Local database deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete the database. Please try again.');
        console.error('Failed to delete the database:', error);
      }
    }
  };

  const handleGenerateData = async () => {
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
          value = parseFloat((Math.random() * 20 + 60).toFixed(1)); // Weight between 60-80 kg
          break;
        case 'sales':
          value = Math.floor(Math.random() * 500 + 100); // Sales between 100-600
          break;
        case 'expenses':
          value = Math.floor(Math.random() * 200 + 50); // Expenses between 50-250
          break;
        case 'mood':
          value = possibleMoods[Math.floor(Math.random() * possibleMoods.length)]; // Random mood
          break;
        case 'exercise':
          value = possibleExercises[Math.floor(Math.random() * possibleExercises.length)]; // Random exercise
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
        await addDataPoint(series, value, timestamp);
      }
      toast.success('Dummy data generated successfully!');
    } catch (error) {
      toast.error('Failed to save the generated data. Please try again.');
      console.error('Failed to save the generated data:', error);
    }

    setIsDialogOpen(false);
  };

  return (
    <div>
      <Button 
        variant="outline" 
        onClick={() => navigate('/')} 
        className="mb-4 flex items-center gap-2 w-auto"
      >
        <ArrowLeft size={16} />
        Back to Data View
      </Button>
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setting</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Example Setting</TableCell>
              <TableCell>Enabled</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Button 
          variant="default" 
          onClick={() => setIsDialogOpen(true)} 
          className="mt-1 w-auto"
        >
          Add Dummy Data
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDeleteDatabase} 
          className="mt-1 w-auto"
        >
          Delete Local Database
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal>
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
              onClick={handleGenerateData} 
              disabled={!selectedSeries || !dateRange.from || !dateRange.to} 
              className="mt-1 w-auto"
            >
              Generate Data
            </Button>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default SettingsView;

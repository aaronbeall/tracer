import React, { useState } from 'react';
import { db } from '../services/db';
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

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const handleDateChange: SelectRangeEventHandler = (range) => {
    if (range) {
      setDateRange({ from: range.from, to: range.to });
    }
  };

  const handleDeleteDatabase = async () => {
    if (window.confirm('Are you sure you want to delete the local database? This action cannot be undone.')) {
      try {
        await db.deleteDatabase();
        toast.success('Local database deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete the database. Please try again.');
        console.error('Failed to delete the database:', error);
      }
    }
  };

  const handleGenerateData = () => {
    if (!selectedSeries || !dateRange.from || !dateRange.to) {
      toast.error('Please select a series and a valid date range.');
      return;
    }

    // Logic to generate random data
    console.log(`Generating data for ${selectedSeries} from ${dateRange.from} to ${dateRange.to}`);
    toast.success('Dummy data generated successfully!');
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
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
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <DateRangePicker selectedDate={dateRange} onDateChange={handleDateChange} />
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

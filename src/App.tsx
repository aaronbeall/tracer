import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { DataPoint } from './services/db';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Table, Calendar, History, Settings } from 'lucide-react';
import logo from '@/assets/logo.svg';
import './App.css'
import ChartView from './components/ChartView';
import TableView from './components/TableView';
import CalendarView from './components/CalendarView';
import TimelineView from './components/TimelineView';
import { Badge } from '@/components/ui/badge';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Autocomplete } from '@/components/ui/autocomplete';
import { PlusIcon } from 'lucide-react';
import { parseTextValue, chooseFile } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import type { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { saveAs } from 'file-saver';
import SettingsView from './components/SettingsView';
import { isAfter, isBefore, startOfYear, subDays, subMonths, subYears } from 'date-fns';
import { useDataStore } from '@/store/dataStore';

type TimeFrame = 'All Time' | 'Past Week' | 'Past Month' | 'Past Year' | 'YTD' | 'Custom...';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function exportDataAsCSV(dataPoints: DataPoint[]) {
  const csvContent = [
    ['Series', 'Value', 'Timestamp'],
    ...dataPoints.map(({ series, value, timestamp }) => [series, value, new Date(timestamp).toISOString()]),
  ]
    .map((row) => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'data.csv');
}

function importDataFromCSV(file: File, onImport: (importedData: DataPoint[]) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    const rows = text.split('\n').slice(1); // Skip header
    const importedData: DataPoint[] = rows.map((row, index) => {
      const [series, value, timestamp] = row.split(',');
      return { id: index, series, value: parseFloat(value), timestamp: new Date(timestamp).getTime() };
    });
    onImport(importedData);
  };
  reader.readAsText(file);
}

function App() {
  const navigate = useNavigate(); // Moved inside the App component to ensure it is used within the Router context

  const {
    dataPoints,
    loadDataPoints,
    addDataPoint,
    updateDataPoint,
    deleteDataPoint,
  } = useDataStore();

  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [seriesInput, setSeriesInput] = useState<string>('');
  const [valueInput, setValueInput] = useState<string>(''); // Separate state for value input
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('All Time');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    loadDataPoints();
  }, [loadDataPoints]);

  const availableSeries = useMemo(() => Array.from(new Set(dataPoints.map((p) => p.series))), [dataPoints]);

  const processValues = async () => {
    if (seriesInput && valueInput) {
      const values = valueInput.split(',').map((v) => v.trim()).map(parseTextValue);
      for (const value of values) {
        await addDataPoint({ series: seriesInput, value });
      }
    }
  };

  const handleSubmit = async () => {
    await processValues();
    setSeriesInput('');
    setValueInput('');
  };

  const handleEdit = async (id: number, updatedData: Partial<DataPoint>) => {
    try {
      await updateDataPoint(id, updatedData); // Persist changes to the database
      toast.success('Data updated successfully!'); // Show success toast
    } catch (error) {
      console.error('Failed to update the database:', error);
      toast.error('Failed to update data. Please try again.'); // Show error toast
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDataPoint(id); // Remove the data point from the database
      toast.success('Data point deleted successfully!'); // Show delete confirmation toast
    } catch (error) {
      console.error('Failed to delete the data point:', error);
      toast.error('Failed to delete data. Please try again.'); // Show error toast
    }
  };

  const handleValueInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await processValues();
      setValueInput('');
    }
  };

  const handleTimeFrameChange = (value: string) => {
    if (['All Time', 'Past Week', 'Past Month', 'Past Year', 'YTD', 'Custom...'].includes(value)) {
      setTimeFrame(value as TimeFrame);
    }
  };

  const filterByTimeFrame = useCallback((data: DataPoint[]) => {
    const now = new Date();
    switch (timeFrame) {
      case 'Past Week':
        return data.filter((p) => isAfter(p.timestamp, subDays(now, 7).getTime()));
      case 'Past Month':
        return data.filter((p) => isAfter(p.timestamp, subMonths(now, 1).getTime()));
      case 'Past Year':
        return data.filter((p) => isAfter(p.timestamp, subYears(now, 1).getTime()));
      case 'YTD':
        return data.filter((p) => isAfter(p.timestamp, startOfYear(now).getTime()));
      case 'Custom...':
        if (customRange?.from && customRange?.to) {
          const fromTimestamp = customRange.from.getTime();
          const toTimestamp = customRange.to.getTime();
          return data.filter(
            (p) => isAfter(p.timestamp, fromTimestamp) && isBefore(p.timestamp, toTimestamp)
          );
        }
        return data;
      default:
        return data;
    }
  }, [timeFrame, customRange]);

  const filteredDataPoints = useMemo(() => filterByTimeFrame(
    selectedSeries.length === 0
      ? dataPoints // Show all data points when 'All' is selected
      : dataPoints.filter((p) => selectedSeries.includes(p.series))
  ), [dataPoints, selectedSeries, filterByTimeFrame]);

  const viewSeries = selectedSeries.length === 0 ? availableSeries : selectedSeries; // Pass all series to the view when 'All' is selected

  const handleImport = async () => {
    const file = await chooseFile('.csv');
    if (file) {
      importDataFromCSV(file, async (importedData) => {
        for (const data of importedData) {
          await addDataPoint(data);
        }
      });
    }
  };

  return (
    <div className="container">
      <header className="py-4 border-b border-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}> 
            <img src={logo} alt="Tracer Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">Tracer</h1>
              <p className="text-sm text-muted-foreground">Track and visualize your series data</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Settings className="w-6 h-6 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsAboutOpen(true)}>About</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDataAsCSV(dataPoints)}>Export</DropdownMenuItem>
              <DropdownMenuItem onClick={() => chooseFile('.csv').then(handleImport)}>Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent>
          <DialogTitle>About Tracer</DialogTitle>
          <DialogDescription>
            Version 1.0.0
          </DialogDescription>
          <p>Tracer is a tool for tracking and visualizing data.</p> 
          <p>Your data stays private—nothing is stored or shared.</p>
          <p>Built with ❤️ by Aaron Beall:</p>
          <p className="flex gap-4">
            <a href="https://github.com/aaronbeall" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="black">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.17c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.997.108-.774.42-1.305.763-1.605-2.665-.305-5.467-1.333-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.987-.4 3.007-.405 1.02.005 2.047.138 3.007.405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.24 2.873.117 3.176.768.84 1.236 1.91 1.236 3.22 0 4.61-2.807 5.62-5.48 5.92.432.372.816 1.102.816 2.222v3.293c0 .32.192.694.8.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            {' | '}
            <a href="https://patreon.com/aaronbeall" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 1080 1080" fill="black">
                <path xmlns="http://www.w3.org/2000/svg" d="M1033.05,324.45c-0.19-137.9-107.59-250.92-233.6-291.7c-156.48-50.64-362.86-43.3-512.28,27.2  C106.07,145.41,49.18,332.61,47.06,519.31c-1.74,153.5,13.58,557.79,241.62,560.67c169.44,2.15,194.67-216.18,273.07-321.33  c55.78-74.81,127.6-95.94,216.01-117.82C929.71,603.22,1033.27,483.3,1033.05,324.45z"/>
              </svg>
              Patreon
            </a>
          </p>
        </DialogContent>
      </Dialog>

      <Routes>
        <Route path="/settings" element={<SettingsView />} />
        <Route
          path="*"
          element={
            <div>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <Autocomplete
                    options={availableSeries}
                    value={seriesInput}
                    onChange={setSeriesInput}
                    placeholder="Enter a series"
                    className="flex-1"
                  />
                  <Input
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    onKeyDown={handleValueInputKeyDown} // Add keydown handler for Enter
                    placeholder="Enter value(s), separated by commas"
                    className="flex-1"
                  />
                  <Button onClick={handleSubmit} disabled={!seriesInput || !valueInput} variant="default">
                    <PlusIcon />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        key="all"
                        variant={selectedSeries.length === 0 ? 'default' : 'outline'}
                        onClick={() => setSelectedSeries([])}
                        className="cursor-pointer"
                      >
                        All
                      </Badge>
                      {availableSeries.map((series) => (
                        <Badge
                          key={series}
                          variant={selectedSeries.includes(series) ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedSeries((prev) =>
                              prev.includes(series)
                                ? prev.filter((s) => s !== series)
                                : [...prev, series]
                            );
                          }}
                          className="cursor-pointer"
                        >
                          {series}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      {timeFrame === 'Custom...' && (
                        <DateRangePicker
                          selectedDate={customRange}
                          onDateChange={(range: DateRange | undefined) => setCustomRange(range)}
                        />
                      )}
                      <Select value={timeFrame} onValueChange={(value) => handleTimeFrameChange(value)}>
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
                    </div>
                  </div>
              </Card>

              <Card className="p-6 mt-6">
                <Tabs
                  defaultValue={window.location.pathname.slice(1) || "chart"}
                  onValueChange={(value) => {
                    navigate(`/${value}`);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger
                      value="chart"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <LineChart className="w-4 h-4" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger
                      value="calendar"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger
                      value="timeline"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <History className="w-4 h-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger
                      value="table"
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Table className="w-4 h-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                  <div className="rounded-lg border bg-card p-6">
                    <Routes>
                      <Route path="/chart" element={<ChartView dataPoints={filteredDataPoints} selectedSeries={viewSeries} />} />
                      <Route path="/table" element={<TableView dataPoints={filteredDataPoints} onEdit={handleEdit} onDelete={handleDelete} availableSeries={availableSeries} />} />
                      <Route path="/calendar" element={<CalendarView dataPoints={filteredDataPoints} selectedSeries={viewSeries} />} />
                      <Route path="/timeline" element={<TimelineView dataPoints={filteredDataPoints} selectedSeries={viewSeries} />} />
                      <Route path="*" element={<Navigate to="/chart" replace />} />
                    </Routes>
                  </div>
                </Tabs>
              </Card>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataStore, useSeriesByName } from '@/store/dataStore';
import { isAfter, isBefore, startOfYear, subDays, subMonths, subYears } from 'date-fns';
import { Calendar, History, LineChart, Table } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './App.css';
import AddDataSection from './components/AddDataSection';
import AppHeader from './components/AppHeader';
import CalendarView from './components/CalendarView';
import ChartView from './components/ChartView';
import FilterSection from './components/FilterSection';
import SeriesSettingsView from './components/SeriesSettingsView';
import SettingsView from './components/SettingsView';
import TableView from './components/TableView';
import TimelineView from './components/TimelineView';
import type { DataPoint } from './services/db';
import type { TimeFrame } from "./components/TimeFramePicker";

function App() {
  const navigate = useNavigate(); // Moved inside the App component to ensure it is used within the Router context

  const {
    dataPoints,
    series,
    loadDataPoints,
    loadSeries,
    updateDataPoint,
    deleteDataPoint,
  } = useDataStore();

  const seriesByName = useSeriesByName();

  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('Past Week');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    loadDataPoints();
    loadSeries();
  }, [loadDataPoints, loadSeries]);

  const availableSeries = useMemo(() => series.map((s) => s.name), [series]);

  const viewSeries = selectedSeries.length === 0 ? availableSeries : selectedSeries; // Pass all series to the view when 'All' is selected

  const handleEdit = useCallback(async (id: number, updatedData: Partial<DataPoint>) => {
    try {
      await updateDataPoint(id, updatedData); // Persist changes to the database
      toast.success('Data updated successfully!'); // Show success toast
    } catch (error) {
      console.error('Failed to update the database:', error);
      toast.error('Failed to update data. Please try again.'); // Show error toast
    }
  }, [updateDataPoint]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteDataPoint(id); // Remove the data point from the database
      toast.success('Data point deleted successfully!'); // Show delete confirmation toast
    } catch (error) {
      console.error('Failed to delete the data point:', error);
      toast.error('Failed to delete data. Please try again.'); // Show error toast
    }
  }, [deleteDataPoint]);

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

  return (
    <div className="container">
      <AppHeader />

      <Routes>
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/series-settings" element={<SeriesSettingsView />} />
        <Route
          path="*"
          element={
            <div>
              <AddDataSection
                availableSeries={availableSeries}
              />
              <FilterSection
                availableSeries={availableSeries}
                selectedSeries={selectedSeries}
                onSelectedSeriesChange={setSelectedSeries}
                seriesByName={seriesByName}
                timeFrame={timeFrame}
                onTimeFrameChange={handleTimeFrameChange}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />

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
                      <Route path="/table" element={<TableView dataPoints={filteredDataPoints} onEdit={handleEdit} onDelete={handleDelete} series={series} />} />
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

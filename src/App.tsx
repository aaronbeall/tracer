import { useDataStore, useSeriesByName } from '@/store/dataStore';
import { isAfter, isBefore, startOfYear, subDays, subMonths, subYears } from 'date-fns';
import { Calendar, History, LineChart, Table } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import './App.css';
import AddDataSection from './components/AddDataSection';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from './components/CalendarView';
import ChartView from './components/ChartView';
import FilterSection from './components/FilterSection';
import TableView from './components/TableView';
import TimelineView from './components/TimelineView';
import type { DataPoint } from './services/db';
import type { TimeFrame } from "./components/TimeFramePicker";
import AppHeader from './components/AppHeader';
import SettingsView from './components/SettingsView';
import SeriesSettingsView from './components/SeriesSettingsView';

function App() {
  const navigate = useNavigate();

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

  // Filter by series selection only
  const seriesFilteredDataPoints = useMemo(() => (
    selectedSeries.length === 0
      ? dataPoints // Show all data points when 'All' is selected
      : dataPoints.filter((p) => selectedSeries.includes(p.series))
  ), [dataPoints, selectedSeries]);

  // Filter by series selection and time frame (for chart)
  const timeFrameFilteredDataPoints = useMemo(() => filterByTimeFrame(seriesFilteredDataPoints), [seriesFilteredDataPoints, filterByTimeFrame]);

  // Only show series with data in the current chart time frame when on the chart view
  const chartAvailableSeries = useMemo(() => {
    // Get the set of series that have at least one data point in the timeFrame-filtered (by time only) dataPoints
    const timeFiltered = filterByTimeFrame(dataPoints);
    const present = new Set<string>();
    timeFiltered.forEach((p) => present.add(p.series));
    return availableSeries.filter((s) => present.has(s));
  }, [availableSeries, dataPoints, filterByTimeFrame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 transition-colors">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-12 flex flex-col gap-6">
        {/* Top Section: Add + Filter */}
        <Routes>
          <Route
            path="/settings"
            element={
              <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/95 p-10 shadow-2xl min-h-[500px]">
                <SettingsView />
              </div>
            }
          />
          <Route
            path="/series-settings"
            element={
              <div className="rounded-2xl border bg-white/95 dark:bg-slate-900/95 p-10 shadow-2xl min-h-[500px]">
                <SeriesSettingsView />
              </div>
            }
          />
          <Route
            path="*"
            element={
              <>
                <section className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 flex items-stretch">
                    <div className="w-full bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center">
                      <AddDataSection availableSeries={availableSeries} />
                    </div>
                  </div>
                  <div className="flex-1 flex items-stretch">
                    <div className="w-full bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center">
                      <Routes>
                        <Route path="/chart" element={
                          <FilterSection
                            availableSeries={chartAvailableSeries}
                            selectedSeries={selectedSeries}
                            onSelectedSeriesChange={setSelectedSeries}
                            seriesByName={seriesByName}
                          />
                        } />
                        <Route path="*" element={
                          <FilterSection
                            availableSeries={availableSeries}
                            selectedSeries={selectedSeries}
                            onSelectedSeriesChange={setSelectedSeries}
                            seriesByName={seriesByName}
                          />
                        } />
                      </Routes>
                    </div>
                  </div>
                </section>
                {/* Main Content: Tabs */}
                <section className="w-full">
                  <Tabs
                    defaultValue={window.location.pathname.slice(1) || "chart"}
                    onValueChange={(value) => navigate(`/${value}`)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 mb-0 bg-white/95 dark:bg-slate-900/95 p-1 rounded-t-2xl border-b border-slate-200 dark:border-slate-800 shadow-md">
                      <TabsTrigger value="chart" className="flex items-center gap-2 data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">
                        <LineChart className="w-4 h-4" /> Chart
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">
                        <Calendar className="w-4 h-4" /> Calendar
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">
                        <History className="w-4 h-4" /> Timeline
                      </TabsTrigger>
                      <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg transition-colors">
                        <Table className="w-4 h-4" /> Table
                      </TabsTrigger>
                    </TabsList>
                    <div className="rounded-b-2xl border border-t-0 bg-white/98 dark:bg-slate-900/98 p-10 shadow-2xl min-h-[500px]">
                      <Routes>
                        <Route 
                          path="/chart" 
                          element={<ChartView 
                          dataPoints={timeFrameFilteredDataPoints} 
                          selectedSeries={viewSeries}
                          timeFrame={timeFrame}
                          onTimeFrameChange={handleTimeFrameChange}
                          customRange={customRange}
                          onCustomRangeChange={setCustomRange}
                        />} />
                        <Route path="/table" element={<TableView dataPoints={seriesFilteredDataPoints} onEdit={handleEdit} onDelete={handleDelete} series={series} />} />
                        <Route path="/calendar" element={<CalendarView dataPoints={seriesFilteredDataPoints} selectedSeries={viewSeries} />} />
                        <Route path="/timeline" element={<TimelineView dataPoints={seriesFilteredDataPoints} selectedSeries={viewSeries} />} />
                        <Route path="*" element={<Navigate to="/chart" replace />} />
                      </Routes>
                    </div>
                  </Tabs>
                </section>
              </>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

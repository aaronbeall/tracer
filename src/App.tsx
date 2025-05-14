import { useState, useEffect } from 'react';
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
import { db } from './services/db';
import type { DataPoint } from './services/db';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineChart, Table, Calendar, History } from 'lucide-react';
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
import { isNumeric } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const navigate = useNavigate(); // Moved inside the App component to ensure it is used within the Router context

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>(''); // Separate state for tag input
  const [valueInput, setValueInput] = useState<string>(''); // Separate state for value input

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const points = await db.getAllDataPoints();
    console.log('Fetched data points:', points); // Debug log
    setDataPoints(points);
    const tags = Array.from(new Set(points.map((p) => p.tag)));
    console.log('Available tags:', tags); // Debug log
    setAvailableTags(tags);
  };

  const handleSubmit = async () => {
    if (tagInput && valueInput) {
      const numericValue = isNumeric(valueInput) ? Number(valueInput) : valueInput;
      await db.addDataPoint(tagInput, numericValue);
      setTagInput('');
      setValueInput('');
      loadData();
    }
  };

  const handleEdit = async (id: number, updatedData: Partial<DataPoint>) => {
    try {
      await db.updateDataPoint(id, updatedData); // Persist changes to the database
      toast.success('Data updated successfully!'); // Show success toast

      // Update the local state
      setDataPoints((prevDataPoints) => {
        const updatedDataPoints = prevDataPoints.map((dataPoint) =>
          dataPoint.id === id ? { ...dataPoint, ...updatedData } : dataPoint
        );

        // Update available tags
        const updatedTags = Array.from(new Set(updatedDataPoints.map((p) => p.tag)));
        setAvailableTags(updatedTags);

        return updatedDataPoints;
      });
    } catch (error) {
      console.error('Failed to update the database:', error);
      toast.error('Failed to update data. Please try again.'); // Show error toast
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.deleteDataPoint(id); // Remove the data point from the database
      toast.success('Data point deleted successfully!'); // Show delete confirmation toast

      // Update the local state
      setDataPoints((prevDataPoints) =>
        prevDataPoints.filter((dataPoint) => dataPoint.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete the data point:', error);
      toast.error('Failed to delete data. Please try again.'); // Show error toast
    }
  };

  const filteredDataPoints = selectedTags.length === 0
    ? dataPoints // Show all data points when 'All' is selected
    : dataPoints.filter((p) => selectedTags.includes(p.tag));

  const viewTags = selectedTags.length === 0 ? availableTags : selectedTags; // Pass all tags to the view when 'All' is selected

  const sortedDataPoints = [...filteredDataPoints].sort((a, b) => a.timestamp - b.timestamp); // Sort data points in ascending order by timestamp

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="header-left flex items-center gap-4">
            <img src={logo} alt="Tracer Logo" className="header-logo w-8 h-8" />
            <h1 className="title text-2xl font-bold">Tracer</h1>
          </div>
          <p className="header-description text-sm text-muted-foreground">Track and visualize your tagged data</p>
        </div>
      </header>
      
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Autocomplete
            options={availableTags}
            value={tagInput}
            onChange={setTagInput}
            placeholder="Select or enter a tag"
            className="flex-1"
          />
          <Input
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            placeholder="Enter value"
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={!tagInput || !valueInput} variant="default">
            <PlusIcon />
          </Button>
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <div className="flex flex-col gap-2">
          <label className="label">Select tag to display</label>
          <div className="flex flex-wrap gap-2">
            <Badge
              key="all"
              variant={selectedTags.length === 0 ? 'default' : 'outline'}
              onClick={() => setSelectedTags([])} // Clear selectedTags when 'All' is clicked
              className="cursor-pointer"
            >
              All
            </Badge>
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  );
                }}
                className="cursor-pointer"
              >
                {tag}
              </Badge>
            ))}
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
              <Route path="/chart" element={<ChartView dataPoints={sortedDataPoints} selectedTags={viewTags} />} />
              <Route path="/table" element={<TableView dataPoints={sortedDataPoints} onEdit={handleEdit} onDelete={handleDelete} availableTags={availableTags} />} />
              <Route path="/calendar" element={<CalendarView dataPoints={sortedDataPoints} selectedTags={viewTags} />} />
              <Route path="/timeline" element={<TimelineView dataPoints={sortedDataPoints} selectedTags={viewTags} />} />
              <Route path="*" element={<Navigate to="/chart" replace />} />
            </Routes>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

export default App;

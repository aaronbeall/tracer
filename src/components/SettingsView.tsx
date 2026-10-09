import React, { useState, memo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useDataStore } from '@/store/dataStore';
import { buildDemoDataset } from '@/lib/demoData';
import type { DataSeries } from '@/services/db';
import GenerateDataDialog from './GenerateDataDialog';

const SettingsView: React.FC = memo(() => {
  const navigate = useNavigate();
  const { series, deleteSeries, importPoints, updateSeries } = useDataStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDbDialogOpen, setIsDeleteDbDialogOpen] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const handleDeleteDatabase = async () => {
    try {
      for (const s of series) {
        await deleteSeries(s.id); // cascades to delete the series' data points too
      }
      toast.success('Local database deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete the database. Please try again.');
      console.error('Failed to delete the database:', error);
    } finally {
      setIsDeleteDbDialogOpen(false);
    }
  };

  const handleGenerateDemoDataset = async () => {
    setIsGeneratingDemo(true);
    try {
      const { points, seriesConfig } = buildDemoDataset();
      await importPoints(points);

      // Series matching is case-insensitive (see ensureSeriesExists in the store), so a demo
      // series can land on an existing differently-cased series — only fill in fields the
      // existing series doesn't already have set, never override a user's own configuration.
      const updatedSeries = useDataStore.getState().series;
      for (const [name, config] of Object.entries(seriesConfig)) {
        const match = updatedSeries.find((s) => s.name.toLowerCase() === name.toLowerCase());
        if (!match) continue;
        const patch: Partial<DataSeries> = {};
        if (config.unit !== undefined && match.unit === undefined) patch.unit = config.unit;
        if (config.emoji !== undefined && match.emoji === undefined) patch.emoji = config.emoji;
        if (config.aggregation !== undefined && match.aggregation === undefined) patch.aggregation = config.aggregation;
        if (config.goal !== undefined && match.goal === undefined) patch.goal = config.goal;
        if (Object.keys(patch).length > 0) await updateSeries(match.id, patch);
      }

      toast.success('Demo dataset generated — check out the Insights tab!');
    } catch (error) {
      toast.error('Failed to generate demo dataset. Please try again.');
      console.error('Failed to generate demo dataset:', error);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div>
      <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-md mb-4 flex justify-between items-center gap-2 px-2 py-2 border-b border-border">
        <Button
          variant="link"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          Back to Data
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Demo data</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Nothing to look at yet? Seed some realistic data to try out charts, insights, and goals.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            onClick={handleGenerateDemoDataset}
            disabled={isGeneratingDemo}
          >
            {isGeneratingDemo ? 'Generating…' : 'Generate demo dataset'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
          >
            Add custom dummy data…
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-destructive/40 bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <TriangleAlert size={16} className="text-destructive" />
          <h2 className="font-display text-lg font-semibold">Danger zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently erase every series and data point stored in this browser. This cannot be undone.
        </p>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDbDialogOpen(true)}
        >
          Delete local database
        </Button>
      </section>

      <GenerateDataDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <AlertDialog open={isDeleteDbDialogOpen} onOpenChange={setIsDeleteDbDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete local database?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the local database? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteDatabase}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default SettingsView;

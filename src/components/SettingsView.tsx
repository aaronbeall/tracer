import React, { useState, memo } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@/components/ui/table';
import { useDataStore } from '@/store/dataStore';
import GenerateDataDialog from './GenerateDataDialog';

const SettingsView: React.FC = memo(() => {
  const navigate = useNavigate();
  const {
    deleteDataPoint,
    dataPoints,
  } = useDataStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  return (
    <div>
      <div className="sticky top-20 z-20 bg-gradient-to-b from-white/90 via-white/80 to-transparent dark:from-slate-900/90 dark:via-slate-950/80 dark:to-transparent backdrop-blur-md mb-4 flex justify-between items-center gap-2 px-2 py-2 border-b border-slate-100 dark:border-slate-800">
        <Button 
          variant="link" 
          onClick={() => navigate('/')} 
        >
          <ArrowLeft size={16} />
          Back to Data
        </Button>
      </div>
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

        <GenerateDataDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </Card>
    </div>
  );
});

export default SettingsView;

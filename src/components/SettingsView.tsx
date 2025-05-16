import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@/components/ui/table';
import { useDataStore } from '@/store/dataStore';
import GenerateDataDialog from './GenerateDataDialog';

const SettingsView: React.FC = () => {
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

        <GenerateDataDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </Card>
    </div>
  );
};

export default SettingsView;

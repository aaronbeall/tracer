import React from 'react';
import { db } from '../services/db';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();

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

  return (
    <Card className="p-6">
      <Button 
        variant="outline" 
        onClick={() => navigate('/')} 
      >
        <ArrowLeft size={16} />
        Back to Data View
      </Button>
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      <Table className="border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-2">Setting</th>
            <th className="border border-gray-300 p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">Example Setting</td>
            <td className="border border-gray-300 p-2">Enabled</td>
          </tr>
        </tbody>
      </Table>
      <Button 
        variant="destructive" 
        onClick={handleDeleteDatabase} 
      >
        Delete Local Database
      </Button>
    </Card>
  );
};

export default SettingsView;

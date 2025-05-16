import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { saveAs } from 'file-saver';
import { chooseFile } from '@/lib/utils';
import type { DataPoint } from '@/services/db';
import AboutDialog from './AboutDialog';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/store/dataStore';

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

function importDataFromCSV(file: File, onImport: (importedData: Partial<DataPoint>[]) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    const rows = text.split('\n').slice(1); // Skip header
    const importedData: Partial<DataPoint>[] = rows.map(row => {
      const [series, value, timestamp] = row.split(',');
      return { series, value: parseFloat(value), timestamp: new Date(timestamp).getTime() };
    });
    onImport(importedData);
  };
  reader.readAsText(file);
}

const AppHeader: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navigate = useNavigate();
  const { dataPoints, addDataPoint } = useDataStore();

  const handleImport = async () => {
    const file = await chooseFile('.csv');
    if (file) {
      importDataFromCSV(file, async (importedData) => {
        for (const { series, value, timestamp } of importedData) {
          if (series && value && timestamp) {
            await addDataPoint({ series, value, timestamp });
          }
        }
      });
    }
  };

  return (
    <>
      <header className="py-4">
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
              <DropdownMenuItem onClick={handleImport}>Import</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};

export default AppHeader;

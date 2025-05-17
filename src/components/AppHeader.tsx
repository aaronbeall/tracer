import React, { useState } from 'react';
import { Settings, User } from 'lucide-react';
import logo from '@/assets/logo.svg';
import BuyMeACoffeeLogo from '@/assets/buy-me-a-coffee.svg';
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
      <header className="w-full bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer select-none" onClick={() => navigate('/')}> 
            <img src={logo} alt="Tracer Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold leading-tight">Tracer</h1>
              <p className="text-sm text-muted-foreground">Track and visualize your series data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Settings className="w-6 h-6" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAboutOpen(true)}>About</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDataAsCSV(dataPoints)}>Export</DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport}>Import</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center">
                  {/* User avatar placeholder icon from lucide-react */}
                  <span className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a
                    href="https://buymeacoffee.com/metamodernmonkey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <img src={BuyMeACoffeeLogo} alt="Buy Me A Coffee" className="h-5 w-5" />
                    Buy Me A Coffee
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};

export default AppHeader;

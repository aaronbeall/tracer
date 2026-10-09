import React, { useState } from 'react';
import { Settings, User } from 'lucide-react';
import logo from '@/assets/logo.svg';
import BuyMeACoffeeLogo from '@/assets/buy-me-a-coffee.svg';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { saveAs } from 'file-saver';
import { chooseFile } from '@/lib/utils';
import { stringifyCSV } from '@/lib/csv';
import { buildBackup, parseBackup } from '@/lib/backup';
import type { DataPoint } from '@/services/db';
import AboutDialog from './AboutDialog';
import ImportCsvDialog from './ImportCsvDialog';
import ThemeToggle from './ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/store/dataStore';
import { toast } from 'sonner';

function exportDataAsCSV(dataPoints: DataPoint[]) {
  const csvContent = stringifyCSV([
    ['Series', 'Value', 'Timestamp'],
    ...dataPoints.map(({ series, value, timestamp }) => [series, value, new Date(timestamp).toISOString()]),
  ]);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'tracer-data.csv');
}

const AppHeader: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const navigate = useNavigate();
  const { series, dataPoints, importBackup } = useDataStore();

  const handleImportCsv = async () => {
    const file = await chooseFile('.csv');
    if (file) {
      setImportFile(file);
      setIsImportCsvOpen(true);
    }
  };

  const handleExportBackup = () => {
    const backup = buildBackup(series, dataPoints);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, 'tracer-backup.json');
  };

  const handleImportBackup = async () => {
    const file = await chooseFile('.json');
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseBackup(text);
      await importBackup(backup);
      toast.success('Backup restored successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import backup.');
      console.error('Failed to import backup:', error);
    }
  };

  return (
    <>
      <header className="w-full bg-card/95 border-b border-border sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <img src={logo} alt="Tracer Logo" className="w-8 h-8" />
            <div>
              <h1 className="font-display text-xl font-semibold leading-tight tracking-tight">Tracer</h1>
              <p className="text-xs text-muted-foreground">Track and visualize your series data</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-accent transition-colors"><Settings className="w-5 h-5 text-muted-foreground" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAboutOpen(true)}>About</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportDataAsCSV(dataPoints)}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportCsv}>Import CSV...</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportBackup}>Export Backup (JSON)</DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportBackup}>Import Backup (JSON)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-accent transition-colors flex items-center">
                  {/* User avatar placeholder icon from lucide-react */}
                  <span className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
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
      <ImportCsvDialog file={importFile} open={isImportCsvOpen} onOpenChange={setIsImportCsvOpen} />
    </>
  );
};

export default AppHeader;

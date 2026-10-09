import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseCSV, guessCsvMapping, mapCsvRows, type CsvColumnMapping } from '@/lib/csv';
import { useDataStore } from '@/store/dataStore';

interface ImportCsvDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = '__none__';
const FIXED = '__fixed__';

const ImportCsvDialog: React.FC<ImportCsvDialogProps> = ({ file, open, onOpenChange }) => {
  const importPoints = useDataStore((s) => s.importPoints);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [seriesColumn, setSeriesColumn] = useState<string>(NONE);
  const [fixedSeriesName, setFixedSeriesName] = useState('');
  const [valueColumn, setValueColumn] = useState<string>(NONE);
  const [timestampColumn, setTimestampColumn] = useState<string>(NONE);
  const [descriptionColumn, setDescriptionColumn] = useState<string>(NONE);
  const [categoryColumn, setCategoryColumn] = useState<string>(NONE);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!file) return;
    file.text().then((text) => {
      const parsed = parseCSV(text);
      if (parsed.length === 0) return;
      const [headerRow, ...dataRows] = parsed;
      setHeaders(headerRow);
      setRows(dataRows);

      const guessed = guessCsvMapping(headerRow);
      setSeriesColumn(guessed.series !== null ? String(guessed.series) : NONE);
      setValueColumn(guessed.value !== null ? String(guessed.value) : NONE);
      setTimestampColumn(guessed.timestamp !== null ? String(guessed.timestamp) : NONE);
      setDescriptionColumn(guessed.description !== null ? String(guessed.description) : NONE);
      setCategoryColumn(guessed.category !== null ? String(guessed.category) : NONE);
      setFixedSeriesName('');
    });
  }, [file]);

  const mappedRows = useMemo(() => {
    const mapping: CsvColumnMapping = {
      series:
        seriesColumn === NONE ? null
        : seriesColumn === FIXED ? { fixed: fixedSeriesName }
        : { column: Number(seriesColumn) },
      value: valueColumn === NONE ? null : Number(valueColumn),
      timestamp: timestampColumn === NONE ? null : Number(timestampColumn),
      description: descriptionColumn === NONE ? null : Number(descriptionColumn),
      category: categoryColumn === NONE ? null : Number(categoryColumn),
    };
    return mapCsvRows(rows, mapping);
  }, [rows, seriesColumn, fixedSeriesName, valueColumn, timestampColumn, descriptionColumn, categoryColumn]);

  const skippedCount = rows.length - mappedRows.length;

  const handleImport = async () => {
    if (mappedRows.length === 0) return;
    setImporting(true);
    try {
      await importPoints(mappedRows);
      toast.success(`Imported ${mappedRows.length} data point${mappedRows.length === 1 ? '' : 's'}!`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to import CSV. Please try again.');
      console.error('Failed to import CSV:', error);
    } finally {
      setImporting(false);
    }
  };

  const columnOptions = headers.map((h, i) => (
    <SelectItem key={i} value={String(i)}>{h || `Column ${i + 1}`}</SelectItem>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-lg">
        <DialogTitle>Import CSV</DialogTitle>
        <DialogDescription>
          Map the columns in "{file?.name}" to Tracer fields. Works with Tracer's own export, a bank statement, a fitness log, or any other CSV.
        </DialogDescription>

        <div className="grid grid-cols-[100px_1fr] items-center gap-3 mt-2">
          <Label>Series</Label>
          <div className="flex gap-2">
            <Select value={seriesColumn} onValueChange={setSeriesColumn}>
              <SelectTrigger className="flex-1">
                {seriesColumn === FIXED ? 'Fixed name' : seriesColumn === NONE ? 'Select column...' : headers[Number(seriesColumn)]}
              </SelectTrigger>
              <SelectContent>
                {columnOptions}
                <SelectItem value={FIXED}>Fixed name for all rows...</SelectItem>
              </SelectContent>
            </Select>
            {seriesColumn === FIXED && (
              <Input
                value={fixedSeriesName}
                onChange={(e) => setFixedSeriesName(e.target.value)}
                placeholder="e.g. Expenses"
                className="flex-1"
              />
            )}
          </div>

          <Label>Value</Label>
          <Select value={valueColumn} onValueChange={setValueColumn}>
            <SelectTrigger className="w-full">
              {valueColumn === NONE ? 'Select column...' : headers[Number(valueColumn)]}
            </SelectTrigger>
            <SelectContent>{columnOptions}</SelectContent>
          </Select>

          <Label>Timestamp</Label>
          <Select value={timestampColumn} onValueChange={setTimestampColumn}>
            <SelectTrigger className="w-full">
              {timestampColumn === NONE ? 'Select column...' : headers[Number(timestampColumn)]}
            </SelectTrigger>
            <SelectContent>{columnOptions}</SelectContent>
          </Select>

          <Label>Category</Label>
          <div className="flex flex-col gap-1">
            <Select value={categoryColumn} onValueChange={setCategoryColumn}>
              <SelectTrigger className="w-full">
                {categoryColumn === NONE ? 'None' : headers[Number(categoryColumn)]}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {columnOptions}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">For a categorized series, e.g. an "Activity" column next to a Duration value.</p>
          </div>

          <Label>Description</Label>
          <Select value={descriptionColumn} onValueChange={setDescriptionColumn}>
            <SelectTrigger className="w-full">
              {descriptionColumn === NONE ? 'None' : headers[Number(descriptionColumn)]}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {columnOptions}
            </SelectContent>
          </Select>
        </div>

        {mappedRows.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">
              Preview ({mappedRows.length} row{mappedRows.length === 1 ? '' : 's'} will be imported
              {skippedCount > 0 ? `, ${skippedCount} skipped (missing/invalid value or date)` : ''}):
            </p>
            <div className="border border-border rounded-md text-xs overflow-x-auto max-h-40 overflow-y-auto">
              <table className="w-full font-mono">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-2 py-1">Series</th>
                    {categoryColumn !== NONE && <th className="text-left px-2 py-1">Category</th>}
                    <th className="text-left px-2 py-1">Value</th>
                    <th className="text-left px-2 py-1">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1">{r.series}</td>
                      {categoryColumn !== NONE && <td className="px-2 py-1">{r.category}</td>}
                      <td className="px-2 py-1">{r.value}</td>
                      <td className="px-2 py-1">{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={mappedRows.length === 0 || importing}>
            {importing ? 'Importing...' : `Import ${mappedRows.length || ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvDialog;

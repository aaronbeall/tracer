import React, { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MoreHorizontal, AlertCircle, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner'; // Corrected import for toast notifications
import type { DataSeries } from '@/services/db';

const SeriesSettingsView: React.FC = () => {
  const { series, updateSeries, deleteSeries } = useDataStore();
  const [editedSeries, setEditedSeries] = useState<Partial<DataSeries>[]>([]); // Initialize as an empty array
  const navigate = useNavigate();

  const displaySeries = useMemo(() => {
    return series.map((s) => {
      const edits = editedSeries.find((e) => e.id === s.id) || {}; // Find edits by id
      const merged = { ...s, ...edits }; // Merge edits with original series

      // Derive validation errors
      const trimmedName = merged.name?.trim();
      const error = !trimmedName
        ? 'Series name cannot be empty.'
        : edits.name && // Only check for duplicates if the name is edited
          series.some(
            (other) =>
              other.id !== s.id &&
              other.name.toLowerCase() === trimmedName.toLowerCase()
          )
        ? 'A series with this name already exists.'
        : null;

      return { ...merged, error, isValid: !error };
    });
  }, [series, editedSeries]);

  const handleSave = async (id: number) => {
    const edits = editedSeries.find((s) => s.id === id);
    if (edits) {
      await updateSeries(id, edits);
      setEditedSeries((prev) => prev.filter((item) => item.id !== id)); // Reset edit state for the saved series
      toast.success('Series saved successfully!'); // Show toast confirmation
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      await deleteSeries(id);
    }
  };

  const handleCancel = (id: number) => {
    setEditedSeries((prev) => prev.filter((item) => item.id !== id));
  };

  // Utility function to update editedSeries sparsely
  const updateEditedSeries = (id: number, changes: Partial<DataSeries>) => {
    setEditedSeries((prev) => {
      const existingEdit = prev.find((item) => item.id === id);
      if (existingEdit) {
        return prev.map((item) => (item.id === id ? { ...item, ...changes } : item));
      } else {
        return [...prev, { id, ...changes }];
      }
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Button 
        variant="outline" 
        onClick={() => navigate('/')} 
        className="mb-4 flex items-center gap-2 w-auto"
      >
        <ArrowLeft size={16} />
        Back to Data View
      </Button>
      {displaySeries.map((currentSeries) => {
        const hasEdits = Object.keys(editedSeries.find((e) => e.id === currentSeries.id) || {}).length > 1;
        return (
          <Card key={currentSeries.id} className="p-4 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 relative">
                <div className="relative w-full">
                  <Input
                    value={currentSeries.name || ''}
                    onChange={(e) => updateEditedSeries(currentSeries.id, { name: e.target.value })}
                    placeholder="Series Name"
                    className={`pr-10 ${currentSeries.error ? 'border-red-500' : ''}`}
                  />
                  {currentSeries.error && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="text-red-500" size={16} />
                        </TooltipTrigger>
                        <TooltipContent>
                          {currentSeries.error}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <Input
                  value={currentSeries.color || ''}
                  onChange={(e) => updateEditedSeries(currentSeries.id, { color: e.target.value })}
                  placeholder="Series Color"
                  type="color"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="p-2" size="icon" variant='ghost'>
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" className="flex items-center gap-2" onClick={() => handleDelete(currentSeries.id)}>
                      <Trash size={16} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {hasEdits && (
                <div className="mt-2 -mx-4 -mb-4 p-4 bg-yellow-100 border-t border-yellow-300 rounded-b-xl">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(currentSeries.id)}
                        disabled={!currentSeries.isValid}
                        className="bg-green-500 text-white"
                      >
                        <Check size={16} /> Save
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancel(currentSeries.id)}
                      >
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                    {currentSeries.error && (
                      <div className="text-red-500 flex items-center">
                        <AlertCircle size={16} className="inline-block mr-2" />
                        {currentSeries.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SeriesSettingsView;

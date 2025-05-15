import React, { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MoreHorizontal, AlertCircle, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner'; // Corrected import for toast notifications
import type { DataSeries } from '@/services/db';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Picker from '@emoji-mart/react';
import ColorSwatch from './ColorSwatch';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

const SeriesSettingsView: React.FC = () => {
  const { series, updateSeries, deleteSeries } = useDataStore();
  const [editedSeries, setEditedSeries] = useState<Partial<DataSeries>[]>([]); // Initialize as an empty array
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<'createdAt' | 'updatedAt' | 'dataAddedAt'>('createdAt');

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

  const sortedSeries = useMemo(() => {
    return [...displaySeries].sort((a, b) => {
      if (sortOption === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        return new Date(b.dataAddedAt || 0).getTime() - new Date(a.dataAddedAt || 0).getTime();
      }
    });
  }, [displaySeries, sortOption]);

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

  const handleEmojiChange = (id: number, emoji: string | undefined) => {
    updateEditedSeries(id, { emoji });
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
      <div className="mb-4 flex justify-end items-center gap-2">
        <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort by:</label>
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as 'createdAt' | 'updatedAt' | 'dataAddedAt')}>
          <SelectTrigger id="sort-select" className="w-48">
            <span>{sortOption === 'createdAt' ? 'Created Date' : sortOption === 'updatedAt' ? 'Modified Date' : 'Last Data Added'}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="updatedAt">Modified Date</SelectItem>
            <SelectItem value="dataAddedAt">Last Data Added</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {sortedSeries.map((currentSeries) => {
        const hasEdits = Object.keys(editedSeries.find((e) => e.id === currentSeries.id) || {}).length > 1;
        return (
          <Card key={currentSeries.id} className="p-4 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 relative justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    value={currentSeries.name || ''}
                    onChange={(e) => updateEditedSeries(currentSeries.id, { name: e.target.value })}
                    placeholder="Series Name"
                    className={`pr-10 flex-1 ${currentSeries.error ? 'border-red-500' : ''}`}
                  />
                  <Select
                    value={currentSeries.type || 'numeric'}
                    onValueChange={(value) => updateEditedSeries(currentSeries.id, { type: value as 'numeric' | 'text' })}
                  >
                    <SelectTrigger className="w-32">
                      <span>{currentSeries.type === 'text' ? 'Text' : 'Numeric'}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numeric</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <ColorSwatch
                    color={currentSeries.color || ''}
                    onChange={(color) => updateEditedSeries(currentSeries.id, { color })}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="p-2 text-2xl" size="icon" variant="ghost">
                        {currentSeries.emoji ? (
                          <span>{currentSeries.emoji}</span>
                        ) : (
                          <span className="text-gray-400">○</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-full h-full bg-gray-950">
                      {currentSeries.emoji && (
                        <div className="p-2 border-b border-gray-200">
                          <Button
                            variant="destructive"
                            className='w-full'
                            size="sm"
                            onClick={() => handleEmojiChange(currentSeries.id, undefined)}
                          >
                            <Trash/> Remove Emoji
                          </Button>
                        </div>
                      )}
                      <Picker
                        autoFocus
                        onEmojiSelect={(emoji: { native: string }) => handleEmojiChange(currentSeries.id, emoji.native)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
              <textarea
                value={currentSeries.description || ''}
                onChange={(e) => updateEditedSeries(currentSeries.id, { description: e.target.value })}
                placeholder="Series Description"
                className="w-full p-2 border border-gray-300 rounded-md text-sm mt-4"
              />
              <div className="text-xs text-gray-500 mt-4 flex items-center space-x-2 border-t border-gray-200 pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-light">Created: <span className="text-gray-400">{formatDistanceToNow(new Date(currentSeries.createdAt), { addSuffix: true })}</span></p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(currentSeries.createdAt).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
                <span className="text-gray-300">|</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-light">Modified: <span className="text-gray-400">{formatDistanceToNow(new Date(currentSeries.updatedAt), { addSuffix: true })}</span></p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(currentSeries.updatedAt).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
                {currentSeries.dataAddedAt && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-light">Data Added: <span className="text-gray-400">{formatDistanceToNow(new Date(currentSeries.dataAddedAt), { addSuffix: true })}</span></p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(currentSeries.dataAddedAt).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
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

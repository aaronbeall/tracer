import React, { useMemo, useState, memo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MoreHorizontal, AlertCircle, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner'; // Corrected import for toast notifications
import type { DataSeries } from '@/services/db';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import Picker from '@emoji-mart/react';
import ColorSwatch from './ColorSwatch';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { useDebounceCallback } from 'usehooks-ts';

const SeriesSettingsView: React.FC = memo(() => {
  const { series, updateSeries, deleteSeries } = useDataStore();
  const [editedSeries, setEditedSeries] = useState<Partial<DataSeries>[]>([]); // Initialize as an empty array
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<'createdAt' | 'updatedAt' | 'dataAddedAt' | 'name'>('createdAt');
  const [showDescriptionForSeries, setShowDescriptionForSeries] = useState<Record<number, boolean>>({});
  const [seriesPendingDeleteId, setSeriesPendingDeleteId] = useState<number | null>(null);

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
      } else if (sortOption === 'dataAddedAt') {
        return new Date(b.dataAddedAt || 0).getTime() - new Date(a.dataAddedAt || 0).getTime();
      } else if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
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
    await deleteSeries(id);
    setSeriesPendingDeleteId(null);
  };

  const handleCancel = (id: number) => {
    setEditedSeries((prev) => prev.filter((item) => item.id !== id));
  };

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

  const handleColorChange = useDebounceCallback((id: number, color: string) => {
    updateEditedSeries(id, { color });
  });

  const isDescriptionShowing = (series: DataSeries) => {
    return showDescriptionForSeries[series.id] !== false 
      && (showDescriptionForSeries[series.id] || !!series.description?.trim());
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <label htmlFor="sort-select" className="hidden sm:inline text-sm font-medium text-muted-foreground tracking-wide">Sort by:</label>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as 'createdAt' | 'updatedAt' | 'dataAddedAt' | 'name')}>
            <SelectTrigger id="sort-select" className="w-48">
              <span>{
                sortOption === 'createdAt'
                  ? 'Last Created'
                  : sortOption === 'updatedAt'
                  ? 'Last Updated'
                  : sortOption === 'dataAddedAt'
                  ? 'Last Data Added'
                  : 'Name'
              }</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Last Created</SelectItem>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="dataAddedAt">Last Data Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {sortedSeries.map((currentSeries) => {
        const hasEdits = Object.keys(editedSeries.find((e) => e.id === currentSeries.id) || {}).length > 1;
        return (
          <Card key={currentSeries.id} className="p-6 mb-6 rounded-lg shadow-sm border border-border bg-card transition-all">
            <div className="flex flex-col gap-4">
              <div className="relative w-full">
                {/* Responsive: all inputs in a column on mobile, row on sm+; more menu is last flex item */}
                <div className="flex flex-row items-start gap-2 sm:gap-4 w-full">
                  {/* Left: all inputs except more menu */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                    <Input
                      value={currentSeries.name || ''}
                      onChange={(e) => updateEditedSeries(currentSeries.id, { name: e.target.value })}
                      placeholder="Series Name"
                      className={`pr-10 text-lg font-display font-semibold ${currentSeries.error ? 'border-destructive focus:ring-destructive/20' : ''} flex-1`}
                    />
                    <Select
                      value={currentSeries.type}
                      onValueChange={(value) => updateEditedSeries(currentSeries.id, { type: value as DataSeries['type'] })}
                    >
                      <SelectTrigger className={`w-full sm:w-44 ${!currentSeries.type ? 'text-muted-foreground' : ''}`}>
                        <span>{ { numeric: "Numeric", text: "Text", categorized: "Text + Number", none: "Set type..." }[currentSeries.type ?? "none"] }</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">Numeric</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="categorized">Text + Number</SelectItem>
                      </SelectContent>
                    </Select>
                    <ColorSwatch
                      color={currentSeries.color || ''}
                      onChange={(color) => handleColorChange(currentSeries.id, color)}
                      className="w-full sm:w-8"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="p-2 text-2xl bg-secondary hover:bg-accent border border-border rounded-full shadow-sm transition-all w-auto" size="icon" variant="ghost">
                          {currentSeries.emoji ? (
                            <span>{currentSeries.emoji}</span>
                          ) : (
                            <span className="text-muted-foreground">∅</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-full h-full bg-popover border border-border rounded-lg shadow-xl">
                        {currentSeries.emoji && (
                          <div className="p-2 border-b border-border">
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
                          theme="auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Right: more menu */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="p-2 bg-secondary hover:bg-accent border border-border rounded-full shadow-sm transition-all" size="icon" variant='ghost'>
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg shadow-lg border border-border bg-popover">
                        <DropdownMenuItem
                          onClick={() =>
                            setShowDescriptionForSeries((prev) => ({
                              ...prev,
                              [currentSeries.id]: !isDescriptionShowing(currentSeries),
                            }))
                          }
                          className="flex items-center gap-2"
                        >
                          {isDescriptionShowing(currentSeries)
                            ? 'Hide Description'
                            : currentSeries.description
                            ? 'Show Description'
                            : 'Add Description'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                          onClick={() => setSeriesPendingDeleteId(currentSeries.id)}
                        >
                          <Trash size={16} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              {(currentSeries.type === 'numeric' || currentSeries.type === 'categorized') && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Unit</Label>
                    <Input
                      value={currentSeries.unit || ''}
                      onChange={(e) => updateEditedSeries(currentSeries.id, { unit: e.target.value || undefined })}
                      placeholder="kg, $, reps..."
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Same-day values</Label>
                    <Select
                      value={currentSeries.aggregation ?? 'sum'}
                      onValueChange={(value) => updateEditedSeries(currentSeries.id, { aggregation: value as DataSeries['aggregation'] })}
                    >
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <span>{currentSeries.aggregation === 'avg' ? 'Average' : 'Sum'}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Goal</Label>
                    <Select
                      value={currentSeries.goal?.direction ?? 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          updateEditedSeries(currentSeries.id, { goal: undefined });
                        } else {
                          updateEditedSeries(currentSeries.id, {
                            goal: { target: currentSeries.goal?.target ?? 0, direction: value as 'at-least' | 'at-most' },
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-28 h-8 text-sm">
                        <span>{currentSeries.goal?.direction === 'at-least' ? 'At least' : currentSeries.goal?.direction === 'at-most' ? 'At most' : 'No goal'}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No goal</SelectItem>
                        <SelectItem value="at-least">At least</SelectItem>
                        <SelectItem value="at-most">At most</SelectItem>
                      </SelectContent>
                    </Select>
                    {currentSeries.goal && (
                      <Input
                        type="number"
                        value={currentSeries.goal.target}
                        onChange={(e) =>
                          updateEditedSeries(currentSeries.id, {
                            goal: { target: Number(e.target.value), direction: currentSeries.goal!.direction },
                          })
                        }
                        className="w-20 h-8 text-sm"
                      />
                    )}
                  </div>
                </div>
              )}
              {isDescriptionShowing(currentSeries) && (
                <Textarea
                  value={currentSeries.description || ''}
                  onChange={(e) => updateEditedSeries(currentSeries.id, { description: e.target.value })}
                  placeholder="Series Description"
                  className="text-sm mt-4"
                />
              )}
              <div className="text-xs text-muted-foreground mt-4 flex items-center space-x-2 border-t border-border pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-light">Created: <span className="font-mono">{formatDistanceToNow(new Date(currentSeries.createdAt), { addSuffix: true })}</span></p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(currentSeries.createdAt).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
                <span className="text-border">|</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-light">Modified: <span className="font-mono">{formatDistanceToNow(new Date(currentSeries.updatedAt), { addSuffix: true })}</span></p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(currentSeries.updatedAt).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
                {currentSeries.dataAddedAt && (
                  <>
                    <span className="text-border">|</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-light">Data Added: <span className="font-mono">{formatDistanceToNow(new Date(currentSeries.dataAddedAt), { addSuffix: true })}</span></p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(currentSeries.dataAddedAt).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
              {hasEdits && (
                <div className="mt-2 -mx-4 -mb-4 p-4 bg-secondary border-t-2 border-t-foreground/15 rounded-b-lg">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(currentSeries.id)}
                        disabled={!currentSeries.isValid}
                      >
                        <Check size={16} /> Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(currentSeries.id)}
                      >
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                    {currentSeries.error && (
                      <div className="text-destructive flex items-center">
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
      <AlertDialog open={seriesPendingDeleteId !== null} onOpenChange={(open) => !open && setSeriesPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete series?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{series.find((s) => s.id === seriesPendingDeleteId)?.name}"? This will also delete all of its data points. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => seriesPendingDeleteId !== null && handleDelete(seriesPendingDeleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default SeriesSettingsView;

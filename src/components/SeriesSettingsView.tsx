import React, { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const SeriesSettingsView: React.FC = () => {
  const { series, updateSeries, deleteSeries } = useDataStore();
  const [editedSeries, setEditedSeries] = useState(
    series.map((s) => ({ id: s.id })) // Initialize as empty objects with id
  );
  const navigate = useNavigate();

  const displaySeries = useMemo(() => {
    return series.map((s) => {
      const edits = editedSeries.find((e) => e.id === s.id) || {};
      return { ...s, ...edits };
    });
  }, [series, editedSeries]);

  const handleSave = async (id: number) => {
    const edits = editedSeries.find((s) => s.id === id);
    if (edits) {
      await updateSeries(id, edits);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      await deleteSeries(id);
      setEditedSeries((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleCancel = (id: number) => {
    setEditedSeries((prev) => prev.map((item) => (item.id === id ? { id } : item)));
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
            <div className="flex items-center gap-4">
              <Input
                value={currentSeries.name || ''}
                onChange={(e) =>
                  setEditedSeries((prev) =>
                    prev.map((item) =>
                      item.id === currentSeries.id
                        ? { ...item, name: e.target.value }
                        : item
                    )
                  )
                }
                placeholder="Series Name"
              />
              <Input
                value={currentSeries.color || ''}
                onChange={(e) =>
                  setEditedSeries((prev) =>
                    prev.map((item) =>
                      item.id === currentSeries.id
                        ? { ...item, color: e.target.value }
                        : item
                    )
                  )
                }
                placeholder="Series Color"
                type="color"
              />
              {hasEdits && (
                <>
                  <Button onClick={() => handleSave(currentSeries.id)} className="icon-button">
                    <Check size={16} />
                  </Button>
                  <Button variant="outline" onClick={() => handleCancel(currentSeries.id)} className="icon-button">
                    <X size={16} />
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="p-2" size="icon" variant='ghost'>
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDelete(currentSeries.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SeriesSettingsView;

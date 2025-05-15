import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const SeriesSettingsView: React.FC = () => {
  const { series, updateSeries, deleteSeries } = useDataStore();
  const [editedSeries, setEditedSeries] = useState(
    series.map((s) => ({ ...s }))
  );

  const handleSave = async (id: number) => {
    const updated = editedSeries.find((s) => s.id === id);
    if (updated) {
      await updateSeries(id, updated);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      await deleteSeries(id);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Series Settings</h1>
      {editedSeries.map((s) => (
        <Card key={s.id} className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <Input
              value={s.name}
              onChange={(e) =>
                setEditedSeries((prev) =>
                  prev.map((item) =>
                    item.id === s.id ? { ...item, name: e.target.value } : item
                  )
                )
              }
              placeholder="Series Name"
            />
            <Input
              value={s.color}
              onChange={(e) =>
                setEditedSeries((prev) =>
                  prev.map((item) =>
                    item.id === s.id ? { ...item, color: e.target.value } : item
                  )
                )
              }
              placeholder="Series Color"
              type="color"
            />
            <Button onClick={() => handleSave(s.id)}>Save</Button>
            <Button variant="destructive" onClick={() => handleDelete(s.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SeriesSettingsView;

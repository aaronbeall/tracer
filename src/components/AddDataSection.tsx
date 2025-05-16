import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { parseTextValue } from '@/lib/utils';
import { useDataStore, useSeriesByName, useSeriesUniqueValues } from '@/store/dataStore';
import { toast } from 'sonner';

interface AddDataSectionProps {
  availableSeries: string[];
}

const AddDataSection: React.FC<AddDataSectionProps> = ({ availableSeries }) => {
  const [seriesInput, setSeriesInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const addDataPoint = useDataStore((s) => s.addDataPoint);
  const seriesByName = useSeriesByName();
  const uniqueValuesMap = useSeriesUniqueValues();

  const seriesType = seriesByName[seriesInput]?.type;

  const addData = async () => {
    if (seriesInput && valueInput) {
      await addDataPoint({ series: seriesInput, value: parseTextValue(valueInput) });
      toast.success('Data added successfully!');
      setSeriesInput('');
      setValueInput('');
    }
  };

  const handleSubmit = async () => {
    await addData();
  };

  const handleValueInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await addData();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Autocomplete
          options={availableSeries}
          value={seriesInput}
          onChange={setSeriesInput}
          placeholder="Enter a series"
          className="flex-1"
        />
        {uniqueValuesMap[seriesInput] && (
          <datalist id="unique-values">
            {uniqueValuesMap[seriesInput].map((value, index) => (
              <option key={index} value={value} />
            ))}
          </datalist>
        )}
        <Input
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          onKeyDown={handleValueInputKeyDown}
          placeholder="Enter a value"
          type={seriesType === 'numeric' ? 'number' : 'text'}
          className="flex-1"
          list={seriesType === 'text' ? 'unique-values' : undefined}
        />
        <Button onClick={handleSubmit} disabled={!seriesInput || !valueInput} variant="default">
          <PlusIcon />
        </Button>
      </div>
    </Card>
  );
};

export default AddDataSection;
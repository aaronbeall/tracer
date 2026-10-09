import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusIcon, RotateCcwIcon, PenLineIcon } from 'lucide-react';
import { cn, parseTextValue } from '@/lib/utils';
import { parseEntry, suggestCompletion, type EntrySeriesInfo } from '@/lib/parseEntry';
import { useDataStore, useSeriesUniqueValues } from '@/store/dataStore';
import { toast } from 'sonner';

interface AddDataSectionProps {
  availableSeries: string[];
}

type Field = 'series' | 'category' | 'value' | 'when';
type Overrides = Partial<Record<Field, string>>;

const toLocalInput = (ts: number) => format(ts, "yyyy-MM-dd'T'HH:mm");

const FieldLabel: React.FC<{ label: string; edited: boolean; onReset: () => void }> = ({ label, edited, onReset }) => (
  <div className="flex items-center gap-1 h-4 text-[11px] uppercase tracking-wide text-muted-foreground">
    {label}
    {edited && (
      <button type="button" onClick={onReset} title="Revert to parsed value" className="hover:text-foreground">
        <RotateCcwIcon className="w-3 h-3" />
      </button>
    )}
  </div>
);

const AddDataSection: React.FC<AddDataSectionProps> = ({ availableSeries }) => {
  const [text, setText] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [overflowing, setOverflowing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const series = useDataStore((s) => s.series);
  const addDataPoint = useDataStore((s) => s.addDataPoint);
  const uniqueValuesMap = useSeriesUniqueValues();

  // Most recently used series first so ties in parsing/completion favor them.
  const seriesInfo = useMemo<EntrySeriesInfo[]>(
    () =>
      [...series]
        .filter((s) => !s.archived)
        .sort((a, b) => (b.dataAddedAt ?? b.updatedAt) - (a.dataAddedAt ?? a.updatedAt))
        .map((s) => ({ name: s.name, type: s.type, unit: s.unit, values: uniqueValuesMap[s.name] })),
    [series, uniqueValuesMap]
  );

  const parsed = useMemo(() => parseEntry(text, seriesInfo), [text, seriesInfo]);
  const ghost = overflowing ? '' : suggestCompletion(text, seriesInfo);

  const seriesName = (overrides.series ?? parsed.series).trim();
  const existing = series.find((s) => s.name.toLowerCase() === seriesName.toLowerCase());
  const category = overrides.category ?? parsed.category ?? '';
  const valueText = overrides.value ?? (parsed.value !== undefined ? String(parsed.value) : '');
  const when = overrides.when ?? toLocalInput(parsed.timestamp);
  const unit = existing?.unit ?? parsed.unit;

  const type = existing?.type;
  const showCategory = type === 'categorized' || (!existing && (category !== '' || typeof parsed.value === 'number'));
  const needsNumber = type === 'numeric' || type === 'categorized' || category.trim() !== '';
  const valueValid = valueText.trim() !== '' && (!needsNumber || !isNaN(Number(valueText)));
  const canSubmit = seriesName !== '' && valueValid;

  const setField = (field: Field, value: string) => setOverrides((o) => ({ ...o, [field]: value }));
  const resetField = (field: Field) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[field];
      return next;
    });

  const reset = () => {
    setText('');
    setOverrides({});
    setOverflowing(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    const trimmedCategory = category.trim();
    const value = needsNumber ? Number(valueText) : parseTextValue(valueText.trim());
    const timestamp = overrides.when ? new Date(overrides.when).getTime() : parsed.hasTime ? parsed.timestamp : Date.now();
    await addDataPoint({
      series: existing?.name ?? seriesName,
      value,
      timestamp,
      ...(trimmedCategory ? { category: trimmedCategory } : {}),
      ...(!existing && parsed.unit && parsed.unit !== '$' ? { unit: parsed.unit } : {}),
    });
    toast.success(`Logged ${trimmedCategory ? `${trimmedCategory} ` : ''}${value}${unit ? ` ${unit}` : ''} to ${existing?.name ?? seriesName}`);
    reset();
    inputRef.current?.focus();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setOverflowing(e.target.scrollWidth > e.target.clientWidth);
    if (!e.target.value.trim()) setOverrides({});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const atEnd = e.currentTarget.selectionStart === text.length;
    if (ghost && atEnd && (e.key === 'Tab' || e.key === 'ArrowRight')) {
      e.preventDefault();
      setText(text + ghost + ' ');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      reset();
    }
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <PenLineIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder='Log something… e.g. "weight 182.4", "yoga 30 min yesterday", "mood great"'
          aria-label="Log an entry"
          autoComplete="off"
          spellCheck={false}
          className="h-10 pl-9"
        />
        {ghost && (
          <div aria-hidden className="absolute inset-0 flex items-center pl-9 pr-3 border border-transparent pointer-events-none whitespace-pre overflow-hidden text-base md:text-sm">
            <span className="invisible">{text}</span>
            <span className="text-muted-foreground/70">{ghost}</span>
            <kbd className="ml-2 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">tab</kbd>
          </div>
        )}
      </div>

      {text.trim() !== '' && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex flex-col gap-1 flex-[1.4] min-w-0">
            <FieldLabel label={existing || !seriesName ? 'Series' : 'Series (new)'} edited={'series' in overrides} onReset={() => resetField('series')} />
            <div className="relative">
              {existing && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-[1]" style={{ backgroundColor: existing.color }} />
              )}
              <Autocomplete
                options={availableSeries}
                value={overrides.series ?? parsed.series}
                onChange={(v) => setField('series', v)}
                placeholder="Series"
                inputClassName={cn(existing && 'pl-7')}
              />
            </div>
          </div>

          {showCategory && (
            <label className="flex flex-col gap-1 flex-1 min-w-0">
              <FieldLabel label="Category" edited={'category' in overrides} onReset={() => resetField('category')} />
              <Input
                value={category}
                onChange={(e) => setField('category', e.target.value)}
                onKeyDown={handleFieldKeyDown}
                placeholder="Optional, e.g. Running"
                list="quick-entry-categories"
              />
              <datalist id="quick-entry-categories">
                {(uniqueValuesMap[existing?.name ?? ''] ?? []).map((v) => <option key={v} value={v} />)}
              </datalist>
            </label>
          )}

          <label className="flex flex-col gap-1 flex-1 min-w-0">
            <FieldLabel label="Value" edited={'value' in overrides} onReset={() => resetField('value')} />
            <div className="relative">
              <Input
                value={valueText}
                onChange={(e) => setField('value', e.target.value)}
                onKeyDown={handleFieldKeyDown}
                placeholder={needsNumber ? 'Number' : 'Value'}
                inputMode={needsNumber ? 'decimal' : 'text'}
                aria-invalid={valueText !== '' && !valueValid}
                list={type === 'text' ? 'quick-entry-values' : undefined}
                className={cn('font-mono', unit && needsNumber && 'pr-12')}
              />
              {unit && needsNumber && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{unit}</span>
              )}
              {type === 'text' && (
                <datalist id="quick-entry-values">
                  {(uniqueValuesMap[existing!.name] ?? []).map((v) => <option key={v} value={v} />)}
                </datalist>
              )}
            </div>
          </label>

          <label className="flex flex-col gap-1 sm:w-52">
            <FieldLabel label={parsed.hasTime || overrides.when ? 'When' : 'When (now)'} edited={'when' in overrides} onReset={() => resetField('when')} />
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setField('when', e.target.value)}
              onKeyDown={handleFieldKeyDown}
              className="font-mono text-xs md:text-xs"
            />
          </label>

          <Button onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto" aria-label="Add entry">
            <PlusIcon /> <span className="sm:hidden">Add</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddDataSection;

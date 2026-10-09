import { create } from 'zustand';
import { db } from '@/services/db';
import type { DataPoint, DataSeries } from '@/services/db';
import type { TracerBackup } from '@/lib/backup';
import tinycolor from 'tinycolor2';
import { useMemo } from 'react';

interface DataStore {
  dataPoints: DataPoint[];
  series: DataSeries[];
  isLoadingDataPoints: boolean;
  isLoadingSeries: boolean;
  loadDataPoints: () => Promise<void>;
  loadSeries: () => Promise<void>;
  addDataPoint: (params: { series: string; value: number | string; timestamp?: number; category?: string; unit?: string }) => Promise<void>;
  updateDataPoint: (id: number, updatedData: Partial<DataPoint>) => Promise<void>;
  deleteDataPoint: (id: number) => Promise<void>;
  addSeries: (params: { name: string; color: string; unit?: string; description?: string; type?: DataSeries['type'] }) => Promise<void>;
  updateSeries: (id: number, updatedData: Partial<DataSeries>) => Promise<void>;
  deleteSeries: (id: number) => Promise<void>;
  importPoints: (points: { series: string; value: number | string; timestamp: number; description?: string; category?: string }[]) => Promise<void>;
  importBackup: (backup: TracerBackup) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => {
  const findSeriesByName = (seriesName: string): DataSeries | undefined => {
    const normalized = seriesName.trim().toLowerCase();
    return get().series.find((s) => s.name.trim().toLowerCase() === normalized);
  };

  const ensureSeriesExists = async (seriesName: string, initialValue?: number | string, hasCategory = false, unit?: string): Promise<DataSeries> => {
    const existingSeries = findSeriesByName(seriesName);
    if (!existingSeries) {
      const trimmedName = seriesName.trim();
      const randomHue = Math.floor(Math.random() * 360);
      const randomColor = tinycolor({ h: randomHue, s: 70, l: 50 }).toHexString();
      const seriesType = hasCategory
          ? 'categorized'
          : typeof initialValue === 'number'
            ? 'numeric'
            : typeof initialValue == 'string'
              ? 'text'
              : undefined;
      const id = await db.addSeries({
        name: trimmedName,
        color: randomColor,
        type: seriesType,
        ...(unit ? { unit } : {}),
      });
      const newSeries: DataSeries = {
        id: id as number,
        name: trimmedName,
        color: randomColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: seriesType,
        ...(unit ? { unit } : {}),
      };
      set((state) => ({ series: [...state.series, newSeries] }));
      return newSeries;
    }
    return existingSeries;
  };

  return {
    dataPoints: [],
    series: [],
    isLoadingDataPoints: false,
    isLoadingSeries: false,

    loadDataPoints: async () => {
      if (get().isLoadingDataPoints) return;
      set({ isLoadingDataPoints: true });
      const dataPoints = await db.getAllDataPoints();
      set({ dataPoints, isLoadingDataPoints: false });
    },

    loadSeries: async () => {
      if (get().isLoadingSeries) return;
      set({ isLoadingSeries: true });
      const series = await db.getAllSeries();
      set({ series, isLoadingSeries: false });
    },

    addDataPoint: async ({ series, value, timestamp, category, unit }: { series: string; value: number | string; timestamp?: number; category?: string; unit?: string }) => {
      const associatedSeries = await ensureSeriesExists(series, value, category !== undefined, unit);

      const id = await db.addDataPoint(associatedSeries.name, value, timestamp, undefined, category);
      const newPoint: DataPoint = {
        id: id as number,
        series: associatedSeries.name,
        value,
        timestamp: timestamp || Date.now(),
        ...(category !== undefined ? { category } : {}),
      };
      set((state) => ({ dataPoints: [...state.dataPoints, newPoint] }));

      get().updateSeries(associatedSeries.id, { dataAddedAt: Date.now() });
    },

    updateDataPoint: async (id, updatedData) => {
      let effectiveUpdatedData = updatedData;
      if (updatedData.series) {
        const existingPoint = get().dataPoints.find((p) => p.id === id);
        const effectiveValue = updatedData.value !== undefined ? updatedData.value : existingPoint?.value;
        const hasCategory = updatedData.category !== undefined ? !!updatedData.category : !!existingPoint?.category;
        const associatedSeries = await ensureSeriesExists(updatedData.series, effectiveValue, hasCategory);
        effectiveUpdatedData = { ...updatedData, series: associatedSeries.name };
      }

      await db.updateDataPoint(id, effectiveUpdatedData);
      set((state) => ({
        dataPoints: state.dataPoints.map((point) =>
          point.id === id ? { ...point, ...effectiveUpdatedData } : point
        ),
      }));
    },

    deleteDataPoint: async (id) => {
      await db.deleteDataPoint(id);
      set((state) => ({
        dataPoints: state.dataPoints.filter((point) => point.id !== id),
      }));
    },

    addSeries: async ({ name, color, unit, description, type }: { name: string; color: string; unit?: string; description?: string; type?: DataSeries['type'] }) => {
      const id = await db.addSeries({ name, color, unit, description, type });
      const newSeries: DataSeries = { id: id as number, name, color, unit, description, type, createdAt: Date.now(), updatedAt: Date.now() };
      set((state) => ({ series: [...state.series, newSeries] }));
    },

    updateSeries: async (id, updatedData) => {
      const existingSeries = get().series.find((s) => s.id === id);
      if (!existingSeries) {
        throw new Error(`Series with id ${id} not found`);
      }

      // Update the series in the database
      await db.updateSeries(id, updatedData);

      // If the name is being updated, update all associated data points
      if (updatedData.name && updatedData.name !== existingSeries.name) {
        const oldName = existingSeries.name;
        const newName = updatedData.name;

        // Update data points in the database
        const dataPointsToUpdate = get().dataPoints.filter((dp) => dp.series === oldName);
        for (const dp of dataPointsToUpdate) {
          await db.updateDataPoint(dp.id, { series: newName });
        }

        // Update data points in the store
        set((state) => ({
          dataPoints: state.dataPoints.map((dp) =>
            dp.series === oldName ? { ...dp, series: newName } : dp
          ),
        }));
      }

      // Update the series in the store
      set((state) => ({
        series: state.series.map((s) =>
          s.id === id ? { ...s, ...updatedData, updatedAt: Date.now() } : s
        ),
      }));
    },

    deleteSeries: async (id) => {
      const seriesToDelete = get().series.find((s) => s.id === id);
      if (!seriesToDelete) {
        throw new Error(`Series with id ${id} not found`);
      }

      // Delete associated data points from the database
      const associatedDataPoints = get().dataPoints.filter((dp) => dp.series === seriesToDelete.name);
      for (const dp of associatedDataPoints) {
        await db.deleteDataPoint(dp.id);
      }

      // Remove associated data points from the store
      set((state) => ({
        dataPoints: state.dataPoints.filter((dp) => dp.series !== seriesToDelete.name),
      }));

      // Delete the series from the database
      await db.deleteSeries(id);

      // Remove the series from the store
      set((state) => ({
        series: state.series.filter((s) => s.id !== id),
      }));
    },

    importPoints: async (points) => {
      const newPoints: DataPoint[] = [];
      const touchedSeriesIds = new Set<number>();

      for (const p of points) {
        const associatedSeries = await ensureSeriesExists(p.series, p.value, p.category !== undefined);
        const id = await db.addDataPoint(associatedSeries.name, p.value, p.timestamp, p.description, p.category);
        newPoints.push({
          id: id as number,
          series: associatedSeries.name,
          value: p.value,
          timestamp: p.timestamp,
          ...(p.description !== undefined ? { description: p.description } : {}),
          ...(p.category !== undefined ? { category: p.category } : {}),
        });
        touchedSeriesIds.add(associatedSeries.id);
      }

      set((state) => ({ dataPoints: [...state.dataPoints, ...newPoints] }));

      for (const seriesId of touchedSeriesIds) {
        await get().updateSeries(seriesId, { dataAddedAt: Date.now() });
      }
    },

    importBackup: async (backup) => {
      const nameToSeries = new Map(get().series.map((s) => [s.name.trim().toLowerCase(), s] as const));

      for (const s of backup.series) {
        const key = s.name.trim().toLowerCase();
        if (!nameToSeries.has(key)) {
          const seriesToAdd: Omit<DataSeries, 'id' | 'createdAt' | 'updatedAt'> = {
            name: s.name.trim(),
            color: s.color,
            emoji: s.emoji,
            unit: s.unit,
            description: s.description,
            type: s.type,
            archived: s.archived,
            favorite: s.favorite,
            goal: s.goal,
            aggregation: s.aggregation,
          };
          const newId = await db.addSeries(seriesToAdd);
          const newSeries: DataSeries = { ...seriesToAdd, id: newId as number, createdAt: Date.now(), updatedAt: Date.now() };
          set((state) => ({ series: [...state.series, newSeries] }));
          nameToSeries.set(key, newSeries);
        }
      }

      const newPoints: DataPoint[] = [];
      for (const p of backup.dataPoints) {
        const target = nameToSeries.get(p.series.trim().toLowerCase());
        if (!target) continue;
        const id = await db.addDataPoint(target.name, p.value, p.timestamp, p.description, p.category);
        newPoints.push({
          id: id as number,
          series: target.name,
          value: p.value,
          timestamp: p.timestamp,
          ...(p.description !== undefined ? { description: p.description } : {}),
          ...(p.category !== undefined ? { category: p.category } : {}),
        });
      }
      set((state) => ({ dataPoints: [...state.dataPoints, ...newPoints] }));
    },
  };
});

export const useSeriesByName = () => {
  const series = useDataStore((state) => state.series);
  return useMemo(() => {
    return series.reduce((map, s) => {
      map[s.name] = s;
      return map;
    }, {} as Record<string, DataSeries>);
  }, [series]);
};

export const useDataBySeries = () => {
  const dataPoints = useDataStore((state) => state.dataPoints);

  return useMemo(() => {
    const groupedData: Record<string, DataPoint[]> = {};

    for (const dp of dataPoints) {
      if (!groupedData[dp.series]) {
        groupedData[dp.series] = [];
      }
      groupedData[dp.series].push(dp);
    }

    return groupedData;
  }, [dataPoints]);
};

/** Unique text values per series — the text value itself for 'text' series, or the category label for 'categorized' series. Used for autocomplete. */
export const useSeriesUniqueValues = () => {
  const series = useDataStore((state) => state.series);
  const dataBySeries = useDataBySeries();

  return useMemo(() => {
    const relevantSeries = series.filter((s) => s.type === 'text' || s.type === 'categorized');
    const uniqueValuesMap: Record<string, string[]> = {};

    for (const s of relevantSeries) {
      const dataPoints = dataBySeries[s.name] || [];
      const values = s.type === 'categorized'
        ? dataPoints.map((dp) => dp.category).filter((v): v is string => !!v)
        : dataPoints.filter((dp) => typeof dp.value === 'string').map((dp) => dp.value as string);
      uniqueValuesMap[s.name] = Array.from(new Set(values));
    }

    return uniqueValuesMap;
  }, [series, dataBySeries]);
};


import { create } from 'zustand';
import { db } from '@/services/db';
import type { DataPoint, DataSeries } from '@/services/db';
import tinycolor from 'tinycolor2';
import { useMemo } from 'react';

interface DataStore {
  dataPoints: DataPoint[];
  series: DataSeries[];
  isLoadingDataPoints: boolean;
  isLoadingSeries: boolean;
  loadDataPoints: () => Promise<void>;
  loadSeries: () => Promise<void>;
  addDataPoint: (params: { series: string; value: number | string; timestamp?: number }) => Promise<void>;
  updateDataPoint: (id: number, updatedData: Partial<DataPoint>) => Promise<void>;
  deleteDataPoint: (id: number) => Promise<void>;
  addSeries: (params: { name: string; color: string; unit?: string; description?: string; type?: 'numeric' | 'text' }) => Promise<void>;
  updateSeries: (id: number, updatedData: Partial<DataSeries>) => Promise<void>;
  deleteSeries: (id: number) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => {
  const findSeriesByName = (seriesName: string): DataSeries | undefined => {
    return get().series.find((s) => s.name === seriesName);
  };

  const ensureSeriesExists = async (seriesName: string) => {
    const existingSeries = findSeriesByName(seriesName);
    if (!existingSeries) {
      const randomHue = Math.floor(Math.random() * 360);
      const randomColor = tinycolor({ h: randomHue, s: 70, l: 50 }).toHexString();
      const id = await db.addSeries(seriesName, randomColor);
      const newSeries: DataSeries = {
        id: id as number,
        name: seriesName,
        color: randomColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => ({ series: [...state.series, newSeries] }));
    }
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

    addDataPoint: async ({ series, value, timestamp }: { series: string; value: number | string; timestamp?: number }) => {
      await ensureSeriesExists(series);

      const id = await db.addDataPoint(series, value, timestamp);
      const newPoint: DataPoint = { id: id as number, series, value, timestamp: timestamp || Date.now() };
      set((state) => ({ dataPoints: [...state.dataPoints, newPoint] }));
    },

    updateDataPoint: async (id, updatedData) => {
      if (updatedData.series) {
        await ensureSeriesExists(updatedData.series);
      }

      await db.updateDataPoint(id, updatedData);
      set((state) => ({
        dataPoints: state.dataPoints.map((point) =>
          point.id === id ? { ...point, ...updatedData } : point
        ),
      }));
    },

    deleteDataPoint: async (id) => {
      await db.deleteDataPoint(id);
      set((state) => ({
        dataPoints: state.dataPoints.filter((point) => point.id !== id),
      }));
    },

    addSeries: async ({ name, color, unit, description, type }: { name: string; color: string; unit?: string; description?: string; type?: 'numeric' | 'text' }) => {
      const id = await db.addSeries(name, color, unit, description, type);
      const newSeries: DataSeries = { id: id as number, name, color, unit, description, type, createdAt: Date.now(), updatedAt: Date.now() };
      set((state) => ({ series: [...state.series, newSeries] }));
    },

    updateSeries: async (id, updatedData) => {
      await db.updateSeries(id, updatedData);
      set((state) => ({
        series: state.series.map((s) => (s.id === id ? { ...s, ...updatedData, updatedAt: Date.now() } : s)),
      }));
    },

    deleteSeries: async (id) => {
      await db.deleteSeries(id);
      set((state) => ({
        series: state.series.filter((s) => s.id !== id),
      }));
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

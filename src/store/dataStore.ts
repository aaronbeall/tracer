import { create } from 'zustand';
import { db } from '@/services/db';
import type { DataPoint, DataSeries } from '@/services/db';

interface DataStore {
  dataPoints: DataPoint[];
  series: DataSeries[];
  loadDataPoints: () => Promise<void>;
  loadSeries: () => Promise<void>;
  addDataPoint: (params: { series: string; value: number | string; timestamp?: number }) => Promise<void>;
  updateDataPoint: (id: number, updatedData: Partial<DataPoint>) => Promise<void>;
  deleteDataPoint: (id: number) => Promise<void>;
  addSeries: (params: { name: string; color: string; unit?: string; description?: string; type?: 'numeric' | 'text' }) => Promise<void>;
  updateSeries: (id: number, updatedData: Partial<DataSeries>) => Promise<void>;
  deleteSeries: (id: number) => Promise<void>;
}

export const useDataStore = create<DataStore>((set) => ({
  dataPoints: [],
  series: [],

  loadDataPoints: async () => {
    const dataPoints = await db.getAllDataPoints();
    set({ dataPoints });
  },

  loadSeries: async () => {
    const series = await db.getAllSeries();
    set({ series });
  },

  addDataPoint: async ({ series, value, timestamp }: { series: string; value: number | string; timestamp?: number }) => {
    const id = await db.addDataPoint(series, value, timestamp);
    const newPoint: DataPoint = { id: id as number, series, value, timestamp: timestamp || Date.now() };
    set((state) => ({ dataPoints: [...state.dataPoints, newPoint] }));
  },

  updateDataPoint: async (id, updatedData) => {
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
}));

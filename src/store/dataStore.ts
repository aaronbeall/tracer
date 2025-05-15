import { create } from 'zustand';
import { db } from '@/services/db';
import type { DataPoint } from '@/services/db';

interface DataStore {
  dataPoints: DataPoint[];
  loadDataPoints: () => Promise<void>;
  addDataPoint: (series: string, value: number | string, timestamp?: number) => Promise<void>;
  updateDataPoint: (id: number, updatedData: Partial<DataPoint>) => Promise<void>;
  deleteDataPoint: (id: number) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  dataPoints: [],

  loadDataPoints: async () => {
    const dataPoints = await db.getAllDataPoints();
    set({ dataPoints });
  },

  addDataPoint: async (series, value, timestamp) => {
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
}));

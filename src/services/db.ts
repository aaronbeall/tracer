import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

export interface DataPoint {
  id: number;
  series: string;
  value: number | string;
  timestamp: number;
}

export interface DataSeries {
  id: number;
  name: string;
  color: string;
  emoji?: string;
  unit?: string;
  description?: string;
  type?: 'numeric' | 'text';
  createdAt: number;
  updatedAt: number;
}

interface TracerDB {
  datapoints: {
    key: number;
    value: DataPoint;
    indexes: { 'by-series': string; 'by-timestamp': number };
  };
  series: {
    key: number;
    value: DataSeries;
    indexes: { 'by-name': string };
  };
}

class DatabaseService {
  private db: IDBPDatabase<TracerDB> | null = null;

  async init() {
    this.db = await openDB<TracerDB>('tracer-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const datapointsStore = db.createObjectStore('datapoints', {
            keyPath: 'id',
            autoIncrement: true,
          });
          datapointsStore.createIndex('by-series', 'series');
          datapointsStore.createIndex('by-timestamp', 'timestamp');
        }

        if (oldVersion < 2) {
          const seriesStore = db.createObjectStore('series', {
            keyPath: 'id',
            autoIncrement: true,
          });
          seriesStore.createIndex('by-name', 'name');
        }
      },
    });
  }

  async addDataPoint(series: string, value: number | string, timestamp: number = Date.now()) {
    if (!this.db) await this.init();
    const datapoint = {
      series,
      value,
      timestamp,
    };
    return this.db!.add('datapoints', datapoint);
  }

  async getAllDataPoints(): Promise<DataPoint[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('datapoints');
  }

  async updateDataPoint(id: number, updatedData: Partial<DataPoint>) {
    if (!this.db) await this.init();
    const existingData = await this.db!.get('datapoints', id);
    if (existingData) {
      const updatedDataPoint = { ...existingData, ...updatedData };
      await this.db!.put('datapoints', updatedDataPoint);
    }
  }

  async deleteDataPoint(id: number) {
    if (!this.db) await this.init();
    await this.db!.delete('datapoints', id);
  }

  async addSeries(name: string, color: string, unit?: string, description?: string, type?: 'numeric' | 'text') {
    if (!this.db) await this.init();
    const series = {
      name,
      color,
      unit,
      description,
      type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return this.db!.add('series', series);
  }

  async getAllSeries(): Promise<DataSeries[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('series');
  }

  async updateSeries(id: number, updatedData: Partial<DataSeries>) {
    if (!this.db) await this.init();
    const existingData = await this.db!.get('series', id);
    if (existingData) {
      const updatedSeries = { ...existingData, ...updatedData, updatedAt: Date.now() };
      await this.db!.put('series', updatedSeries);
    }
  }

  async deleteSeries(id: number) {
    if (!this.db) await this.init();
    await this.db!.delete('series', id);
  }

  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    await indexedDB.deleteDatabase('tracer-db');
  }
}

export const db = new DatabaseService();
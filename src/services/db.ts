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
}

class DatabaseService {
  private db: IDBPDatabase<TracerDB> | null = null;

  async init() {
    this.db = await openDB<TracerDB>('tracer-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('datapoints', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-series', 'series');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }

  async addDataPoint(series: string, value: number | string) {
    if (!this.db) await this.init();
    const timestamp = Date.now();
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

  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    await indexedDB.deleteDatabase('tracer-db');
  }
}

export const db = new DatabaseService();
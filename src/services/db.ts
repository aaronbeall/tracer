import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
// Removed unused import
// import { getCurrentDate } from '@/lib/utils';

export interface DataPoint {
  id: number;
  tag: string;
  value: number | string;
  timestamp: number;
  // Removed 'date' property as it can be derived from 'timestamp'
}

interface TracerDB {
  datapoints: {
    key: number;
    value: DataPoint;
    indexes: { 'by-tag': string; 'by-timestamp': number }; // Removed 'by-date' index
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
        store.createIndex('by-tag', 'tag');
        store.createIndex('by-timestamp', 'timestamp');
        // Removed 'by-date' index
      },
    });
  }

  async addDataPoint(tag: string, value: number | string) {
    if (!this.db) await this.init();
    const timestamp = Date.now();
    const datapoint = {
      tag,
      value,
      timestamp,
    };
    return this.db!.add('datapoints', datapoint);
  }

  async getDataPointsByTag(tag: string) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('datapoints', 'readonly');
    const index = tx.store.index('by-tag');
    return index.getAll(tag);
  }

  async getAllDataPoints() {
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
}

export const db = new DatabaseService();
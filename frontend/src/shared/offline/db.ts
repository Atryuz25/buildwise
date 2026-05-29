import Dexie, { type Table } from 'dexie';

export interface PendingReport {
  id?: number;
  reportData: any;
  status: 'pending' | 'syncing' | 'failed';
  timestamp: string;
}

export class OfflineDB extends Dexie {
  pendingReports!: Table<PendingReport, number>;

  constructor() {
    super('BuildWiseOfflineDB');
    this.version(1).stores({
      pendingReports: '++id, status, timestamp'
    });
  }
}

export const db = new OfflineDB();

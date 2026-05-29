import Dexie, { type Table } from 'dexie';

export interface PendingAction {
  id?: number;
  type: 'audit' | 'daily_report' | 'inventory_update';
  payload: any;
  createdAt: number;
}

export class OfflineDatabase extends Dexie {
  pendingActions!: Table<PendingAction, number>;

  constructor() {
    super('BuildWiseOfflineDB');
    this.version(1).stores({
      pendingActions: '++id, type, createdAt'
    });
  }
}

export const offlineDb = new OfflineDatabase();

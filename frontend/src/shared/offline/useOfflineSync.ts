import { useState, useEffect } from 'react';
import { db } from './db';
import { useToast } from '../components/ToastContext';
import { apiClient } from '../../api/apiClient';

export const useOfflineSync = () => {
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncPendingReports();
    }
  }, [isOnline]);

  const updatePendingCount = async () => {
    const count = await db.pendingReports.count();
    setPendingCount(count);
  };

  const saveReportOffline = async (reportData: any) => {
    try {
      await db.pendingReports.add({
        reportData,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      updatePendingCount();
      showToast('Offline mode: Report saved locally.', 'info');
      return true;
    } catch (e) {
      showToast('Failed to save report locally.', 'error');
      return false;
    }
  };

  const syncPendingReports = async () => {
    try {
      const reports = await db.pendingReports.where('status').equals('pending').toArray();
      if (reports.length === 0) return;

      showToast(`Syncing ${reports.length} pending reports...`, 'info');

      for (const report of reports) {
        try {
          await db.pendingReports.update(report.id!, { status: 'syncing' });
          await apiClient.post('/daily-report', report.reportData);
          await db.pendingReports.delete(report.id!);
        } catch (e) {
          await db.pendingReports.update(report.id!, { status: 'failed' });
        }
      }

      updatePendingCount();
      showToast('Offline sync completed.', 'success');
    } catch (e) {
      // ignore
    }
  };

  return { isOnline, pendingCount, saveReportOffline, syncPendingReports };
};

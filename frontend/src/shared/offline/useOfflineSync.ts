import { useState, useEffect } from 'react';
import { offlineDb } from './offlineDb';
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
      syncPendingActions();
    }
  }, [isOnline]);

  const updatePendingCount = async () => {
    const count = await offlineDb.pendingActions.count();
    setPendingCount(count);
  };

  const saveActionOffline = async (type: 'audit' | 'daily_report' | 'inventory_update', payload: any) => {
    try {
      await offlineDb.pendingActions.add({
        type,
        payload,
        createdAt: Date.now()
      });
      updatePendingCount();
      showToast(`Offline mode: ${type} saved locally.`, 'info');
      return true;
    } catch (e) {
      showToast(`Failed to save ${type} locally.`, 'error');
      return false;
    }
  };

  const syncPendingActions = async () => {
    try {
      const actions = await offlineDb.pendingActions.orderBy('createdAt').toArray();
      if (actions.length === 0) return;

      showToast(`Syncing ${actions.length} pending actions...`, 'info');

      for (const action of actions) {
        try {
          if (action.type === 'daily_report') {
            await apiClient.post('/daily-report', action.payload);
          } else if (action.type === 'audit') {
            await apiClient.post('/audit', action.payload);
          } else if (action.type === 'inventory_update') {
            await apiClient.post('/materials/delivery', action.payload);
          }
          await offlineDb.pendingActions.delete(action.id!);
        } catch (e) {
          console.error(`Failed to sync action ${action.id}:`, e);
          // Stop syncing on first error to preserve order
          break;
        }
      }

      updatePendingCount();
      showToast('Offline sync completed.', 'success');
    } catch (e) {
      console.error('Error during offline sync:', e);
    }
  };

  // Backwards compatibility for useDailyReportSync
  const saveReportOffline = (reportData: any) => saveActionOffline('daily_report', reportData);

  return { isOnline, pendingCount, saveReportOffline, saveActionOffline, syncPendingActions };
};

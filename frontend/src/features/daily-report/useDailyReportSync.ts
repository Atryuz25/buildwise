import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';
import { useOfflineSync } from '../../shared/offline/useOfflineSync';

export interface ActivityUsage {
  name: string;
  location: string;
  status: string;
  expectedPct: number;
  actualPct: number;
}

export interface MaterialUsage {
  materialId: string;
  expected: number;
  actual: number;
  unit: string;
}

export interface CrewUsage {
  crewId: string;
  actual: number;
  actualOutput: string;
}

export interface IssueDelay {
  type: string;
  severity: string;
  desc: string;
}

export interface DailyReportData {
  id?: string;
  date: string;
  projectId: string;
  engineerId: string;
  activities: ActivityUsage[];
  materials: MaterialUsage[];
  crews: CrewUsage[];
  issues: IssueDelay[];
  isDelayed: boolean;
  delayCause?: string;
  delayHours?: number;
}

export const useDailyReportSync = () => {
  const { showToast } = useToast();
  const { isOnline, saveReportOffline } = useOfflineSync();

  const syncToAuditStore = async (reportData: DailyReportData) => {
    try {
      console.log('[Sync] Sending report data:', reportData);
      
      if (!isOnline) {
        await saveReportOffline(reportData);
        return true;
      }

      const reportId = reportData.id || 'new';
      await apiClient.post(`/projects/${reportData.projectId}/daily-reports/${reportId}/submit`, reportData);

      showToast('Daily Report Submitted & Synced', 'success');
      return true;
    } catch (error) {
      console.error('Failed to sync daily report:', error);
      // Fallback to offline save if network error occurs
      await saveReportOffline(reportData);
      return true;
    }
  };

  const autoSaveDraft = async (reportData: DailyReportData) => {
    try {
      if (!isOnline) {
        // Can optionally save drafts to IndexedDB here
        return null;
      }
      
      const res = await apiClient.post(`/projects/${reportData.projectId}/daily-reports`, reportData);
      return res.reportId;
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
      return null;
    }
  };

  return { syncToAuditStore, autoSaveDraft };
};

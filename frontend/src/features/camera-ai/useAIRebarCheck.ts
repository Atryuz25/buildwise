import { useState } from 'react';
import { apiClient } from '../../api/apiClient';

export interface RebarCheckResult {
  spacingCorrect: boolean;
  tiesMissing: number;
  flagged: boolean;
  issues: string[];
  photoUrl: string;
}

export const useAIRebarCheck = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inspectRebar = async (projectId: string, file: File, gps?: string): Promise<RebarCheckResult | null> => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('projectId', projectId);
    if (gps) formData.append('gps', gps);
    formData.append('image', file);

    try {
      const res = await apiClient.post('/ai/rebar-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Unable to inspect — try again');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { inspectRebar, isLoading, error };
};

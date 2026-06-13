import { useState } from 'react';
import { apiClient } from '../../api/apiClient';

export interface PileMeasurementResult {
  estimatedVolume: number;
  inventoryVolume: number;
  divergencePct: number;
  flagged: boolean;
  photoUrl: string;
}

export const useAIPileMeasurement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const measurePile = async (projectId: string, materialType: string, file: File, gps?: string): Promise<PileMeasurementResult | null> => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('materialType', materialType);
    if (gps) formData.append('gps', gps);
    formData.append('image', file);

    try {
      // Use multipart/form-data for file upload
      const res = await apiClient.post('/ai/pile-measurement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Unable to estimate — try again');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (projectId: string) => {
    try {
      return await apiClient.get(`/ai/pile-measurement/${projectId}`);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  return { measurePile, fetchHistory, isLoading, error };
};

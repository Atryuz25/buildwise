import { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../shared/api/apiClient';

export interface AIHeadcountResult {
  detectedCount: number;
  reportedCount: number;
  divergencePct: number;
  confidence: number;
  status: 'Match' | 'Divergence' | 'Error';
  analysisNotes: string;
}

export const useAIHeadcount = () => {
  const { showToast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIHeadcountResult | null>(null);

  const analyzeImage = async (imageFile: File, reportedCount: number): Promise<AIHeadcountResult> => {
    if (import.meta.env.VITE_PHASE_4_ENABLED !== 'true') {
      showToast('Camera AI Headcount is a Phase 4 feature. Coming soon!', 'info');
      // Return a mock placeholder for Phase 3 graceful fallback
      return {
        detectedCount: reportedCount,
        reportedCount,
        divergencePct: 0,
        confidence: 100,
        status: 'Match',
        analysisNotes: 'Mocked match (Phase 4 disabled)'
      };
    }

    setIsAnalyzing(true);
    showToast('Sending image to GPT-4V for analysis...', 'info');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('reportedCount', reportedCount.toString());

      const res = await apiClient.post('/ai/headcount', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const analysisResult = res.data;

      setResult(analysisResult);
      setIsAnalyzing(false);
      
      if (analysisResult.status === 'Divergence') {
        showToast(`Warning: AI detected a ${analysisResult.divergencePct.toFixed(1)}% divergence.`, 'info');
      } else {
        showToast('AI verification successful. Counts match.', 'success');
      }

      return analysisResult;
    } catch (error) {
      console.error('AI Headcount Error:', error);
      showToast('Failed to analyze image.', 'error');
      setIsAnalyzing(false);
      throw error;
    }
  };

  return { analyzeImage, isAnalyzing, result, clearResult: () => setResult(null) };
};

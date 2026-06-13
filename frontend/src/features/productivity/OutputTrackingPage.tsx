import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';

export const OutputTrackingPage: React.FC = () => {
  const { showToast } = useToast();
  const [crews, setCrews] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCrew, setSelectedCrew] = useState('');
  const [actualQty, setActualQty] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectId = '294b2977-35cb-491f-9244-e9d983523101'; // Mocked project

  const fetchData = async () => {
    try {
      const [crewsRes, historyRes] = await Promise.all([
        apiClient.get(`/crews/${projectId}`),
        apiClient.get(`/output/${projectId}`)
      ]);
      setCrews(crewsRes.data || crewsRes);
      setHistory(historyRes.data || historyRes);
    } catch (e) {
      showToast('Failed to load output data', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrew || actualQty === '') return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/output', {
        crewId: selectedCrew,
        projectId,
        actualQty: Number(actualQty)
      });
      showToast('Output logged successfully', 'success');
      setActualQty('');
      fetchData();
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Failed to log output', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Output Tracking</h1>
          <p className="text-on-surface-variant text-sm mt-1">Log daily actual output vs targets for each crew.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-[40%] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0 p-6">
          <h2 className="font-section-heading text-lg font-bold text-primary mb-4">Log Output</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Select Crew</label>
              <select 
                value={selectedCrew} 
                onChange={e => setSelectedCrew(e.target.value)}
                required
                className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
              >
                <option value="" disabled>Select a crew...</option>
                {crews.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeType} Crew - {c.contractor?.name}</option>
                ))}
              </select>
            </div>
            {selectedCrew && (
              <div className="p-3 bg-surface-variant/20 rounded border border-outline-variant text-sm">
                <span className="font-bold text-on-surface-variant">Target: </span>
                <span className="text-primary font-bold">
                  {crews.find(c => c.id === selectedCrew)?.targetQty || 0} {crews.find(c => c.id === selectedCrew)?.targetUnit || 'units'}
                </span>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Actual Output</label>
              <input 
                type="number" 
                value={actualQty} 
                onChange={e => setActualQty(Number(e.target.value))}
                required
                min="0"
                className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary font-bold py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Log Output'}
            </button>
          </form>
        </div>

        <div className="w-[60%] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0">
          <div className="p-4 border-b border-outline-variant bg-surface-variant/20">
            <h2 className="font-section-heading text-lg font-bold text-primary">Output History</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-lowest z-10 shadow-sm">
                <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider bg-surface-variant/10">
                  <th className="p-4">Date</th>
                  <th className="p-4">Crew</th>
                  <th className="p-4 text-right">Target</th>
                  <th className="p-4 text-right">Actual</th>
                  <th className="p-4 text-center">Variance</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/30">
                    <td className="p-4 font-bold">{h.date}</td>
                    <td className="p-4">
                      <div className="text-primary font-bold">{h.crewName}</div>
                      <div className="text-xs text-on-surface-variant">{h.contractorName}</div>
                    </td>
                    <td className="p-4 text-right">{h.targetQty} {h.unit}</td>
                    <td className="p-4 text-right font-bold">{h.actualQty} {h.unit}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        h.status === 'green' ? 'bg-[#dcfce7] text-[#166534]' :
                        h.status === 'amber' ? 'bg-[#fff7ed] text-[#c2410c]' :
                        'bg-error-container text-error'
                      }`}>
                        {h.variancePct}%
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-on-surface-variant">No output history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

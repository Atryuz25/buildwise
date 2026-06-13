import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../shared/hooks/useAuth';

const ChartSkeleton = () => (
  <div className="w-full h-full bg-surface animate-pulse rounded flex items-center justify-center text-on-surface-variant font-bold text-sm">
    Loading Data...
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="w-full h-full bg-surface-lowest flex flex-col items-center justify-center text-on-surface-variant p-6 text-center border border-dashed border-outline-variant rounded">
    <span className="material-symbols-outlined text-[48px] text-outline mb-2">analytics</span>
    <p className="font-bold">{message}</p>
  </div>
);

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState('CEMENT_TREND');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const activeProjectId = user?.projectIds?.[0];

  const reports = [
    { id: 'CEMENT_TREND', label: 'Cement Wastage Trend' },
    { id: 'STEEL_SCRAP', label: 'Steel Scrap Trend' },
    { id: 'INVENTORY', label: 'Inventory Consumption' },
    { id: 'COST_BREAKDOWN', label: 'Cost Breakdown' }
  ];

  useEffect(() => {
    if (!activeProjectId) return;
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/projects/${activeProjectId}/reports?type=${activeReport}`);
        setData(res);
      } catch (err: any) {
        showToast('Failed to load report data', 'error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, [activeReport, activeProjectId]);

  const handleExportPDF = async () => {
    if (!activeProjectId) return;
    showToast(`Generating PDF...`, 'info');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3005/api/projects/${activeProjectId}/reports/export-pdf?type=${activeReport}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buildwise-${activeReport.toLowerCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast('Failed to export PDF', 'error');
    }
  };

  const handleExportCSV = async () => {
    if (!activeProjectId) return;
    showToast(`Generating CSV...`, 'info');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3005/api/projects/${activeProjectId}/reports/export-csv?type=${activeReport}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('CSV export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buildwise-${activeReport.toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const renderChart = () => {
    if (isLoading) return <ChartSkeleton />;
    if (!data || !data.items || data.items.length === 0) {
      return <EmptyState message="No data available for this report type." />;
    }

    switch (activeReport) {
      case 'CEMENT_TREND':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} unit="%" />
              <Tooltip />
              <ReferenceLine y={5} stroke="#b3261e" strokeDasharray="3 3" label="5% Target" />
              <Line type="monotone" dataKey="variance" stroke="#006a6a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'STEEL_SCRAP':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} unit="%" />
              <Tooltip />
              <Bar dataKey="scrap" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'INVENTORY':
      case 'COST_BREAKDOWN':
      default:
        return <EmptyState message="Visual chart not available. Check data table." />;
    }
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Analytics & Reports</h1>
          <p className="text-on-surface-variant text-sm mt-1">Exportable PDF reports for cost and wastage analysis.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-[25%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex-1">
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Available Reports</label>
            <div className="flex flex-col gap-1">
              {reports.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReport(rep.id)}
                  className={`text-left px-3 py-2 rounded text-sm font-bold transition-colors ${
                    activeReport === rep.id 
                      ? 'bg-primary-container text-on-primary' 
                      : 'text-on-surface-variant hover:bg-surface hover:text-primary'
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[75%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0 shrink-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="font-section-heading text-xl text-primary font-bold">
              {reports.find(r => r.id === activeReport)?.label}
            </h2>
            <div className="flex gap-3 no-print">
              <button onClick={handleExportCSV} className="px-4 py-2 bg-surface border border-outline-variant text-on-surface font-bold rounded hover:bg-surface-variant flex items-center justify-center gap-2 transition-colors text-sm">
                <span className="material-symbols-outlined text-[18px]">table</span> Export CSV
              </button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-secondary-container text-on-secondary-container font-bold rounded hover:opacity-90 flex items-center justify-center gap-2 transition-colors text-sm">
                <span className="material-symbols-outlined text-[18px]">download</span> Export PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
            <div className="border border-outline-variant rounded p-4 h-64 shrink-0 flex flex-col">
              <div className="flex-1 w-full relative">
                {renderChart()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

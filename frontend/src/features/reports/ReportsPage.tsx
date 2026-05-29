import React, { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState('Cement Wastage Trend');
  const { showToast } = useToast();

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Activity,Expected,Actual,Variance\n"
      + "Oct 24,Slab Pour - Sector 4,120,122,+1.6%\n"
      + "Oct 21,Column Retaining Wall,45,52,+15.5%\n"
      + "Oct 19,Foundation Block A,80,82,+2.5%\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeReport.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${activeReport} as CSV`, 'success');
  };

  const handleExportPDF = () => {
    showToast(`Generating ${activeReport} PDF...`, 'info');
    window.open('http://localhost:3005/api/reports/export-pdf', '_blank');
  };

  const trendData = [
    { date: '18th', variance: 0 },
    { date: '19th', variance: 2.5 },
    { date: '20th', variance: 0 },
    { date: '21st', variance: 15.5 },
    { date: '22nd', variance: 0 },
    { date: '23rd', variance: 0 },
    { date: '24th', variance: 1.6 },
  ];

  const reports = [
    'Cement Wastage Trend',
    'Steel Scrap Trend',
    'Inventory Consumption',
    'Cost Breakdown',
    'Full Project Summary'
  ];

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Analytics & Reports</h1>
          <p className="text-on-surface-variant text-sm mt-1">Exportable PDF reports for cost and wastage analysis.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left — Report Selector (25%) */}
        <div className="w-[25%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Date Range</label>
              <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This month</option>
                <option>Full project</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input type="date" className="flex-1 border-outline-variant rounded p-1.5 text-xs focus:border-primary-container" />
              <input type="date" className="flex-1 border-outline-variant rounded p-1.5 text-xs focus:border-primary-container" />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Available Reports</label>
            <div className="flex flex-col gap-1">
              {reports.map(rep => (
                <button
                  key={rep}
                  onClick={() => setActiveReport(rep)}
                  className={`text-left px-3 py-2 rounded text-sm font-bold transition-colors ${
                    activeReport === rep 
                      ? 'bg-primary-container text-on-primary' 
                      : 'text-on-surface-variant hover:bg-surface hover:text-primary'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Report Content (75%) */}
        <div className="w-[75%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0 shrink-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="font-section-heading text-xl text-primary font-bold">{activeReport}</h2>
            <div className="flex gap-3 no-print">
              <button onClick={handleExportCSV} className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface font-bold rounded flex items-center justify-center gap-2 transition-colors text-sm">
                <span className="material-symbols-outlined text-[18px]">table_view</span> Export CSV
              </button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-secondary-container text-on-secondary-container font-bold rounded hover:opacity-90 flex items-center justify-center gap-2 transition-colors text-sm">
                <span className="material-symbols-outlined text-[18px]">download</span> Export PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
            
            {/* Summary Card */}
            <div className="bg-surface border border-outline-variant rounded p-6 shrink-0 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Average Variance</div>
                <div className="text-4xl font-page-title font-bold text-[#166534] flex items-center gap-2">
                  4.2% <span className="text-sm bg-[#dcfce7] px-2 py-1 rounded-full uppercase tracking-wider">Below Target (5%)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Savings Equivalent</div>
                <div className="text-2xl font-bold text-primary">₹1.2L</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="border border-outline-variant rounded p-4 h-64 shrink-0 flex flex-col">
              <div className="text-xs font-bold text-on-surface-variant mb-2">Trend Chart (Oct 18 - Oct 24)</div>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#49454f'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10, fill: '#49454f'}} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #cac4d0', fontSize: '12px' }} />
                    <ReferenceLine y={5} stroke="#b3261e" strokeDasharray="3 3" label={{ position: 'top', value: '5% Target', fill: '#b3261e', fontSize: 10 }} />
                    <Line type="monotone" dataKey="variance" stroke="#006a6a" strokeWidth={2} dot={{ r: 4, fill: '#006a6a' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="border border-outline-variant rounded shrink-0 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
                    <th className="py-2 px-4">Date</th>
                    <th className="py-2 px-4">Activity</th>
                    <th className="py-2 px-4">Expected (bags)</th>
                    <th className="py-2 px-4">Actual (bags)</th>
                    <th className="py-2 px-4 text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-outline-variant/50">
                    <td className="py-3 px-4">Oct 24</td>
                    <td className="py-3 px-4 font-bold">Slab Pour - Sector 4</td>
                    <td className="py-3 px-4">120</td>
                    <td className="py-3 px-4">122</td>
                    <td className="py-3 px-4 text-right text-[#166534] font-bold">+1.6%</td>
                  </tr>
                  <tr className="border-b border-outline-variant/50 bg-error-container/10">
                    <td className="py-3 px-4">Oct 21</td>
                    <td className="py-3 px-4 font-bold">Column Retaining Wall</td>
                    <td className="py-3 px-4">45</td>
                    <td className="py-3 px-4">52</td>
                    <td className="py-3 px-4 text-right text-error font-bold">+15.5%</td>
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="py-3 px-4">Oct 19</td>
                    <td className="py-3 px-4 font-bold">Foundation Block A</td>
                    <td className="py-3 px-4">80</td>
                    <td className="py-3 px-4">82</td>
                    <td className="py-3 px-4 text-right text-[#166534] font-bold">+2.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const LabourCostAnalysisPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState('crew');

  const reports = [
    { id: 'crew', name: 'Labour cost by crew' },
    { id: 'combined', name: 'Labour vs Material (Combined)' },
    { id: 'activity', name: 'Labour cost by activity' },
    { id: 'trend', name: 'Daily labour spend trend' },
    { id: 'contractor', name: 'Contractor cost comparison' },
  ];

  // Mock Data
  const crewCostData = [
    { week: 'Week 1', 'Civil Team A': 120000, 'Steel Fixers': 80000, 'Masonry B': 95000 },
    { week: 'Week 2', 'Civil Team A': 125000, 'Steel Fixers': 82000, 'Masonry B': 90000 },
    { week: 'Week 3', 'Civil Team A': 118000, 'Steel Fixers': 85000, 'Masonry B': 100000 },
    { week: 'Week 4', 'Civil Team A': 130000, 'Steel Fixers': 88000, 'Masonry B': 95000 },
  ];

  // Data State
  const [crewTableData, setCrewTableData] = useState<any[]>([]);
  const [totalLabourCost, setTotalLabourCost] = useState(1250000);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const data = await apiClient.get('/productivity/labour-cost');
        setCrewTableData(data.crewTableData);
        setTotalLabourCost(data.totalLabourCost);
      } catch (err) {
        showToast('Failed to load cost data', 'error');
      }
    };
    fetchCost();
  }, [showToast]);

  const pieData = [
    { name: 'Material Cost', value: 4500000 },
    { name: 'Labour Cost', value: 1250000 },
  ];
  const COLORS = ['#0ea5e9', '#f59e0b'];

  const formatRupees = (value: number) => `₹${(value/100000).toFixed(1)}L`;

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Labour Cost Analysis</h1>
          <p className="text-on-surface-variant text-sm mt-1">Track actual labour spend against daily attendance and budgets.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded bg-surface hover:bg-surface-variant transition-colors text-sm font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Oct 1 - Oct 31
          </button>
          <button onClick={() => window.open('http://localhost:3005/api/reports/export-pdf', '_blank')} className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded bg-surface hover:bg-surface-variant transition-colors text-sm font-bold text-primary">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left — Cost Category Selector (28%) */}
        <div className="w-[28%] bg-surface-lowest border border-outline-variant rounded flex flex-col shrink-0 min-h-0">
          <div className="p-4 border-b border-outline-variant sticky top-0 bg-surface-lowest z-10">
            <h2 className="font-section-heading font-bold text-primary">Cost Reports</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
            {reports.map(report => (
              <button 
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`w-full text-left p-3 rounded font-bold transition-colors ${
                  selectedReport === report.id 
                    ? 'bg-secondary-container/10 border border-secondary text-primary' 
                    : 'bg-surface border border-transparent hover:border-outline-variant text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {report.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right — Selected Report (72%) */}
        <div className="w-[72%] flex flex-col min-h-0 bg-surface-lowest border border-outline-variant rounded overflow-y-auto custom-scroll">
          
          {selectedReport === 'crew' && (
            <div className="p-6 flex flex-col gap-6">
              {/* Headline Card */}
              <div className="bg-primary-container/10 border border-primary-container rounded p-6 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Labour Spend (Oct)</div>
                  <div className="text-4xl font-page-title font-bold text-primary">₹{(totalLabourCost / 100000).toFixed(1)}L</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-on-surface-variant mb-1">Budget: ₹{(totalLabourCost * 0.9 / 100000).toFixed(1)}L</div>
                  <div className="bg-error-container text-error px-3 py-1 rounded text-sm font-bold inline-block">
                    +11.1% Over Budget
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="border border-outline-variant rounded p-4 h-80 flex flex-col">
                <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">Spend by Crew (Weekly Stack)</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crewCostData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tickFormatter={formatRupees} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} cursor={{fill: '#f1f5f9'}} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Civil Team A" stackId="a" fill="#0ea5e9" maxBarSize={50} />
                      <Bar dataKey="Steel Fixers" stackId="a" fill="#8b5cf6" maxBarSize={50} />
                      <Bar dataKey="Masonry B" stackId="a" fill="#f59e0b" maxBarSize={50} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-outline-variant rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-variant/20">
                    <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider">
                      <th className="p-4">Crew Name</th>
                      <th className="p-4">Trade</th>
                      <th className="p-4 text-right">Daily Rate</th>
                      <th className="p-4 text-right">Days Worked</th>
                      <th className="p-4 text-right">Total Cost</th>
                      <th className="p-4 text-right">Budget</th>
                      <th className="p-4 text-right">True Cost / Unit</th>
                      <th className="p-4 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crewTableData.map(row => {
                      const variancePct = ((row.totalCost - row.budget) / row.budget) * 100;
                      return (
                        <tr key={row.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/30">
                          <td className="p-4 font-bold text-primary">{row.name}</td>
                          <td className="p-4"><span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{row.trade}</span></td>
                          <td className="p-4 text-right text-on-surface-variant">₹{row.rate.toLocaleString()}</td>
                          <td className="p-4 text-right font-bold">{row.daysWorked}</td>
                          <td className="p-4 text-right font-bold">₹{row.totalCost.toLocaleString()}</td>
                          <td className="p-4 text-right text-on-surface-variant">₹{row.budget.toLocaleString()}</td>
                          <td className="p-4 text-right font-bold text-primary">₹{row.trueCostPerUnit} / {row.unit}</td>
                          <td className={`p-4 text-right font-bold ${variancePct > 0 ? 'text-error' : 'text-[#166534]'}`}>
                            {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'combined' && (
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-surface border border-outline-variant rounded p-6 text-center shadow-sm">
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Material Cost</div>
                  <div className="text-3xl font-page-title font-bold" style={{ color: COLORS[0] }}>₹45.0L</div>
                  <div className="text-xs text-on-surface-variant mt-2">From Material Audits</div>
                </div>
                <div className="bg-surface border border-outline-variant rounded p-6 text-center shadow-sm">
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Labour Cost</div>
                  <div className="text-3xl font-page-title font-bold" style={{ color: COLORS[1] }}>₹12.5L</div>
                  <div className="text-xs text-on-surface-variant mt-2">From Attendance Reports</div>
                </div>
                <div className="bg-primary-container/20 border border-primary-container rounded p-6 text-center shadow-sm">
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Project Cost</div>
                  <div className="text-3xl font-page-title font-bold text-primary">₹57.5L</div>
                  <div className="text-xs text-[#166534] font-bold mt-2">Well within budget</div>
                </div>
              </div>

              <div className="border border-outline-variant rounded p-4 h-96 flex flex-col items-center justify-center">
                <h3 className="font-section-heading font-bold text-primary mb-4 text-sm w-full">Cost Split Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {['activity', 'trend', 'contractor'].includes(selectedReport) && (
            <div className="p-6 h-full flex items-center justify-center">
              <div className="text-center bg-surface-variant/20 p-8 rounded border border-outline-variant border-dashed max-w-md">
                <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-4">construction</span>
                <h3 className="font-bold text-lg text-primary mb-2">Detailed Breakdown Available Later</h3>
                <p className="text-sm text-on-surface-variant">Activity-level cost breakdowns and contractor-specific trend analyses will be unlocked in the upcoming Phase 3 feature drop when operation modules are fully integrated.</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

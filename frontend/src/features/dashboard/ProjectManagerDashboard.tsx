import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/components/ToastContext';
import { api } from '../../shared/api/apiClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const ProjectManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [timeFilter, setTimeFilter] = useState('THIS WEEK');
  
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const projs = await api.projects.getAll();
        if (projs.length > 0) {
          const data = await api.analytics.getSummary(projs[0].id);
          setSummary(data);
        }
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      }
    };
    fetchAnalytics();
  }, [showToast]);

  const budget = summary?.budget || 1000000;
  const spent = summary?.spent || 910000;
  const variance = summary?.weeklyVariance || 0;
  const lowStock = summary?.lowStockCount || 0;


  return (
    <div className="p-page-padding w-full flex flex-col gap-6 h-full">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Project Manager Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">Weekly oversight and variance monitoring.</p>
        </div>
        <div className="flex gap-2 bg-surface p-1 rounded border border-outline-variant">
          {['THIS WEEK', 'THIS MONTH', 'CUSTOM'].map(filter => (
            <button 
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded-sm font-label-caps text-label-caps transition-colors ${
                timeFilter === filter 
                  ? 'bg-surface-lowest shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — KPI strip */}
      <div className="grid grid-cols-5 gap-4 shrink-0">
        <KpiCard title="Material Efficiency" value="94.2%" trend="+1.2%" isGood={true} icon="precision_manufacturing" />
        <KpiCard title="Cement Variance MTD" value={`${variance}%`} trend="-0.5%" isGood={true} icon="category" />
        <KpiCard title="Steel Scrap Rate" value="2.4%" trend="-0.1%" isGood={true} icon="architecture" />
        <KpiCard title="Inventory Health" value={`${20 - lowStock} / 20`} subtext={`${lowStock} below threshold`} isGood={lowStock === 0} icon="inventory_2" />
        <KpiCard title="Pending Audits" value={summary?.recentAudits?.length || 0} subtext="Requires attention" isGood={false} icon="assignment_late" />
      </div>

      {/* Row 2 — 3 column detail */}
      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Variance monitor (40%) */}
        <div className="w-[40%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col">
          <h2 className="font-section-heading text-section-heading text-primary mb-4">Variance Monitor</h2>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Expected</th>
                  <th className="pb-2">Actual</th>
                  <th className="pb-2">Var %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-2 font-medium">Cement (bags)</td>
                  <td className="py-2">1,200</td>
                  <td className="py-2">1,250</td>
                  <td className="py-2 text-error font-bold">+4.1%</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-2 font-medium">Steel 12mm (kg)</td>
                  <td className="py-2">5,000</td>
                  <td className="py-2">4,950</td>
                  <td className="py-2 text-[#166534] font-bold">-1.0%</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-2 font-medium">River Sand (cft)</td>
                  <td className="py-2">800</td>
                  <td className="py-2">860</td>
                  <td className="py-2 text-error font-bold">+7.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h2 className="font-section-heading text-section-heading text-primary mb-4 mt-6 flex items-center justify-between">
            Contractor Payments Due
            <button onClick={() => navigate('/payments')} className="text-xs font-bold text-primary hover:underline">View All</button>
          </h2>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
                  <th className="pb-2">Contractor</th>
                  <th className="pb-2">Milestone</th>
                  <th className="pb-2 text-right">Amount ₹</th>
                  <th className="pb-2 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-error/20 bg-error-container/10">
                  <td className="py-2 font-medium">BuildTech</td>
                  <td className="py-2 text-xs">Slab 3</td>
                  <td className="py-2 text-right font-bold text-error">₹3.2L</td>
                  <td className="py-2 text-right text-error font-bold text-xs">Overdue</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-2 font-medium">IronWorks</td>
                  <td className="py-2 text-xs">Tower B Steel</td>
                  <td className="py-2 text-right font-bold">₹2.8L</td>
                  <td className="py-2 text-right text-xs">Nov 15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Summary (35%) */}
        <div className="w-[35%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col">
          <h2 className="font-section-heading text-section-heading text-primary mb-2">Cost Summary (₹)</h2>
          <div className="flex-1 flex flex-col justify-between pt-4">
            <div className="w-full flex items-end gap-8 h-48 px-8 mt-6">
              <div className="flex-1 h-full bg-outline-variant/20 relative rounded-t group flex justify-center">
                <div className="absolute bottom-0 w-full bg-primary rounded-t transition-all duration-500" style={{ height: `${Math.min(100, (budget / Math.max(budget, spent)) * 100)}%` }}></div>
                <span className="absolute -top-6 text-sm font-bold text-on-surface-variant">₹{(budget/100000).toFixed(1)}L</span>
                <span className="absolute -bottom-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Expected</span>
              </div>
              <div className="flex-1 h-full bg-outline-variant/20 relative rounded-t group flex justify-center">
                <div className={`absolute bottom-0 w-full rounded-t transition-all duration-500 ${spent > budget ? 'bg-error' : 'bg-[#166534]'}`} style={{ height: `${Math.min(100, (spent / Math.max(budget, spent)) * 100)}%` }}></div>
                <span className={`absolute -top-6 text-sm font-bold ${spent > budget ? 'text-error' : 'text-[#166534]'}`}>₹{(spent/100000).toFixed(1)}L</span>
                <span className="absolute -bottom-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actual</span>
              </div>
            </div>
            <div className="mt-6 border-t border-outline-variant pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Labour Cost vs Budget</span>
                <span className="text-xs font-bold text-error">₹45k Overrun</span>
              </div>
              <div className="w-full h-3 bg-outline-variant/30 rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: '60%' }}></div>
                <div className="h-full bg-error" style={{ width: '15%' }}></div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
                <span>Spent: ₹1.8L</span>
                <span>Budget: ₹1.35L</span>
              </div>
            </div>

            <div className={`mt-4 ${spent > budget ? 'bg-error-container text-on-error-container border-error' : 'bg-[#dcfce7] text-[#166534] border-[#166534]'} border p-4 rounded text-center w-full shadow-sm`}>
              <div className="font-card-label text-sm uppercase tracking-wider mb-1">{spent > budget ? 'Overall Overrun' : 'Under budget'}</div>
              <div className="font-page-title text-2xl font-bold">₹{(Math.abs(spent - budget)/100000).toFixed(1)}L</div>
            </div>
          </div>
        </div>

        {/* Delay Impact (25%) */}
        <div className="w-[25%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col">
          <h2 className="font-section-heading text-section-heading text-primary mb-2 flex items-center justify-between">
            Delay Impact
            <button onClick={() => navigate('/delays')} className="text-xs font-bold text-primary hover:underline">Log</button>
          </h2>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Weather', value: 14, color: '#0d9488' }, // Teal
                    { name: 'Labour', value: 8, color: '#c2410c' }, // Amber
                    { name: 'Material', value: 4, color: '#0369a1' }, // Blue
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {
                    [
                      { name: 'Weather', value: 14, color: '#0d9488' },
                      { name: 'Labour', value: 8, color: '#c2410c' },
                      { name: 'Material', value: 4, color: '#0369a1' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-page-title font-bold text-primary">26h</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Lost</span>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-600"></span> Weather</div>
              <span className="font-bold">14 hrs</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#c2410c]"></span> Labour</div>
              <span className="font-bold">8 hrs</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-700"></span> Material</div>
              <span className="font-bold">4 hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, trend, isGood, icon, subtext }: any) => (
  <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-primary border border-outline-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      {trend && (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-[#dcfce7] text-[#166534]' : 'bg-error-container text-on-error-container'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-2xl font-page-title font-bold text-on-surface">{value}</div>
      <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">{title}</div>
      {subtext && <div className="text-[10px] text-outline mt-1">{subtext}</div>}
    </div>
  </div>
);

const PendingAuditCard = ({ engineer, days }: any) => {
  const { showToast } = useToast();
  return (
    <div className="border border-outline-variant rounded p-3 bg-surface flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <span className="font-card-label text-sm text-on-surface font-bold">{engineer}</span>
        <span className="text-xs text-error font-bold">{days}d overdue</span>
      </div>
      <button onClick={() => showToast(`Reminder sent to ${engineer}`, 'success')} className="mt-1 w-full text-xs font-bold text-[#166534] border border-[#166534] py-1.5 rounded hover:bg-[#dcfce7] transition-colors flex justify-center items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">chat</span>
        Send Reminder
      </button>
    </div>
  );
};

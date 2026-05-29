import React, { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';

export const MaterialAuditPage: React.FC = () => {
  const { showToast } = useToast();
  const [actCement, setActCement] = useState(110);
  const estCement = 100;
  
  const [actSteel, setActSteel] = useState(1010);
  const estSteel = 1000;

  const calcVariance = (act: number, est: number) => {
    if (est === 0) return 0;
    return ((act - est) / est) * 100;
  };

  const getVarianceBadge = (variance: number) => {
    const v = Math.abs(variance);
    if (v <= 5) return { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', label: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}% Variance` };
    if (v <= 15) return { bg: 'bg-[#fff7ed]', text: 'text-[#c2410c]', label: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}% Variance` };
    return { bg: 'bg-error-container', text: 'text-error', label: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}% Variance` };
  };

  const cementVar = calcVariance(actCement, estCement);
  const cementBadge = getVarianceBadge(cementVar);
  const isCementRisk = Math.abs(cementVar) > 5;

  const steelVar = calcVariance(actSteel, estSteel);
  const steelBadge = getVarianceBadge(steelVar);
  const isSteelRisk = Math.abs(steelVar) > 5;

  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,Date,Activity,Engineer,Variance,Status\n";
    csv += "Oct 24 2023,Slab Pour - Sector 4,Raj Patel,14.5%,Warning\n";
    csv += "Oct 23 2023,Column Reinforcement,Raj Patel,2.1%,Healthy\n";
    csv += "Oct 22 2023,Foundation Block A,Amit Singh,4.5%,Healthy\n";
    
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "audit_history.csv";
    link.click();
    showToast('Downloaded Audit History', 'success');
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Material Audit</h1>
          <p className="text-on-surface-variant text-sm mt-1">Reconcile expected vs actual usage every day.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Audit Form (50%) */}
        <div className="w-1/2 bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col overflow-y-auto">
          <h2 className="font-section-heading text-lg text-primary font-bold mb-6">New Audit Submission</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Date</label>
              <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">Activity</label>
              <input type="text" placeholder="e.g. Column pour - Tower B" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <h3 className="font-section-heading text-sm text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant pb-2">Material Reconciliation</h3>
            
            {/* Material Row */}
            <div className={`bg-surface p-4 border rounded transition-colors ${isCementRisk ? 'border-[#c2410c]/50 bg-[#fff7ed]/30' : 'border-outline-variant'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-primary">Cement (bags)</span>
                <span className={`${cementBadge.bg} ${cementBadge.text} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>{cementBadge.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Estimated (Pre-filled)</label>
                  <input type="number" value={estCement} className="w-full border-outline-variant rounded p-2 bg-surface-variant/30 font-bold" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Actual Used</label>
                  <input type="number" value={actCement} onChange={e => setActCement(Number(e.target.value))} className={`w-full rounded p-2 font-bold ${isCementRisk ? 'border-error focus:border-error focus:ring-1 focus:ring-error text-error' : 'border-outline-variant focus:border-primary-container'}`} />
                </div>
              </div>
            </div>

            {/* Material Row */}
            <div className={`bg-surface p-4 border rounded transition-colors ${isSteelRisk ? 'border-[#c2410c]/50 bg-[#fff7ed]/30' : 'border-outline-variant'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-primary">Steel 12mm (kg)</span>
                <span className={`${steelBadge.bg} ${steelBadge.text} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>{steelBadge.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Estimated (Pre-filled)</label>
                  <input type="number" value={estSteel} className="w-full border-outline-variant rounded p-2 bg-surface-variant/30 font-bold" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Actual Used</label>
                  <input type="number" value={actSteel} onChange={e => setActSteel(Number(e.target.value))} className={`w-full rounded p-2 font-bold ${isSteelRisk ? 'border-error focus:border-error focus:ring-1 focus:ring-error text-error' : 'border-outline-variant focus:border-primary-container'}`} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Weather Condition</label>
                <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                  <option>Clear</option><option>Cloudy</option><option>Light rain</option><option>Heavy rain</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Site Notes (Optional)</label>
                <textarea className="w-full border-outline-variant rounded p-2 focus:border-primary-container h-10" placeholder="Any issues..." />
              </div>
            </div>
          </div>

          <div className="mt-6 shrink-0 pt-4 border-t border-outline-variant flex justify-end">
            <button onClick={() => {
              setActCement(estCement);
              setActSteel(estSteel);
              showToast('Audit submitted successfully', 'success');
            }} className="bg-primary-container text-on-primary px-8 py-3 rounded font-bold hover:opacity-90 transition-colors w-full">
              Submit Audit
            </button>
          </div>
        </div>

        {/* Right — Audit History (50%) */}
        <div className="w-1/2 bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2 shrink-0">
            <h2 className="font-section-heading text-lg text-primary font-bold">Audit History</h2>
            <div className="flex gap-2 no-print">
              <select className="border border-outline-variant rounded p-1 text-xs font-bold text-on-surface-variant bg-surface"><option>All Risks</option></select>
              <button onClick={handleExportCSV} className="text-xs font-bold text-secondary-container flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            <AuditHistoryCard date="Oct 24, 2023" activity="Slab Pour - Sector 4" variance="14.5%" isRisk={true} engineer="Raj Patel" />
            <AuditHistoryCard date="Oct 23, 2023" activity="Column Reinforcement" variance="2.1%" isRisk={false} engineer="Raj Patel" />
            <AuditHistoryCard date="Oct 22, 2023" activity="Foundation Block A" variance="4.5%" isRisk={false} engineer="Amit Singh" />
          </div>
        </div>
      </div>
    </div>
  );
};

const AuditHistoryCard = ({ date, activity, variance, isRisk, engineer }: any) => (
  <div className="border border-outline-variant rounded p-4 bg-surface hover:border-primary-container cursor-pointer transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div>
        <div className="font-bold text-on-surface">{activity}</div>
        <div className="text-xs text-on-surface-variant mt-1">{date} • {engineer}</div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
        isRisk ? 'bg-[#fff7ed] text-[#c2410c]' : 'bg-[#dcfce7] text-[#166534]'
      }`}>
        {isRisk ? 'Warning' : 'Healthy'}
      </span>
    </div>
    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50 mt-2">
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Overall Variance</span>
      <span className={`font-bold ${isRisk ? 'text-[#ea580c]' : 'text-[#166534]'}`}>{variance}</span>
    </div>
  </div>
);

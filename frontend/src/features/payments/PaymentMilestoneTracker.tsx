import React, { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';

interface Milestone {
  id: number;
  contractor: string;
  trade: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'paid';
  paidDate?: string;
  daysRemaining?: number;
  daysOverdue?: number;
}

export const PaymentMilestoneTracker: React.FC = () => {
  const { showToast } = useToast();
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, contractor: 'BuildTech Solutions', trade: 'Civil', name: 'Slab 4 Completion', amount: 450000, dueDate: 'Oct 30, 2023', status: 'upcoming', daysRemaining: 6 },
    { id: 2, contractor: 'IronWorks Ltd', trade: 'Steel', name: 'Tower B Level 2 Steel', amount: 280000, dueDate: 'Nov 15, 2023', status: 'upcoming', daysRemaining: 22 },
    { id: 3, contractor: 'BuildTech Solutions', trade: 'Civil', name: 'Slab 3 Completion', amount: 320000, dueDate: 'Oct 22, 2023', status: 'overdue', daysOverdue: 2 },
    { id: 4, contractor: 'Volt Experts', trade: 'Electrical', name: 'Basement Conduit Layout', amount: 150000, dueDate: 'Oct 15, 2023', status: 'paid', paidDate: 'Oct 16, 2023' },
  ]);

  const upcoming = milestones.filter(m => m.status === 'upcoming').sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
  const overdue = milestones.filter(m => m.status === 'overdue');
  const paid = milestones.filter(m => m.status === 'paid');

  const totalOutstanding = milestones.filter(m => m.status !== 'paid').reduce((acc, m) => acc + m.amount, 0);
  const totalOverdue = overdue.reduce((acc, m) => acc + m.amount, 0);
  const totalPaid = paid.reduce((acc, m) => acc + m.amount, 0);

  const formatRupees = (amount: number) => `₹${(amount / 100000).toFixed(2)}L`;

  const handleMarkPaid = (id: number) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status: 'paid', paidDate: 'Oct 24, 2023' } : m));
    showToast('Milestone marked as paid', 'success');
  };

  const handleUndoPaid = (id: number) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        // Simple logic for prototype to determine if it was overdue
        const isPast = new Date(m.dueDate) < new Date();
        return { ...m, status: isPast ? 'overdue' : 'upcoming', daysRemaining: 5, daysOverdue: isPast ? 3 : undefined };
      }
      return m;
    }));
    showToast('Payment undone', 'info');
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now(),
      contractor: 'BuildTech Solutions',
      trade: 'Civil',
      name: 'New Custom Milestone',
      amount: 100000,
      dueDate: 'Nov 30, 2023',
      status: 'upcoming',
      daysRemaining: 30
    };
    setMilestones(prev => [...prev, newMilestone]);
    setIsAddPanelOpen(false);
    showToast('Milestone Added', 'success');
  };

  const handleWhatsApp = (contractor: string, amount: number) => {
    const text = encodeURIComponent(`Hi ${contractor} team, just a reminder regarding the overdue payment milestone of ${formatRupees(amount)}.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden relative">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Payment Milestone Tracker</h1>
          <p className="text-on-surface-variant text-sm mt-1">Track contractor milestones to prevent disputes and project delays.</p>
        </div>
        <button 
          onClick={() => setIsAddPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> Add Milestone
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-6 shrink-0">
        <div className={`bg-surface-lowest border rounded p-4 flex items-center justify-between ${totalOverdue > 0 ? 'border-[#c2410c]/50 bg-[#fff7ed]' : 'border-outline-variant'}`}>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Outstanding</div>
            <div className={`text-3xl font-page-title font-bold ${totalOverdue > 0 ? 'text-[#c2410c]' : 'text-primary'}`}>
              {formatRupees(totalOutstanding)}
            </div>
          </div>
          <span className={`material-symbols-outlined text-4xl ${totalOverdue > 0 ? 'text-[#c2410c]/30' : 'text-primary-fixed-dim'}`}>account_balance_wallet</span>
        </div>
        <div className={`bg-surface-lowest border rounded p-4 flex items-center justify-between ${totalOverdue > 0 ? 'border-error bg-error-container/20' : 'border-[#dcfce7] bg-[#f0fdf4]'}`}>
           <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Overdue</div>
            <div className={`text-3xl font-page-title font-bold ${totalOverdue > 0 ? 'text-error' : 'text-[#166534]'}`}>
              {totalOverdue > 0 ? formatRupees(totalOverdue) : '₹0'}
            </div>
          </div>
          <span className={`material-symbols-outlined text-4xl ${totalOverdue > 0 ? 'text-error/30' : 'text-[#166534]/30'}`}>warning</span>
        </div>
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex items-center justify-between">
           <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Paid this month</div>
            <div className="text-3xl font-page-title font-bold text-primary">
              {formatRupees(totalPaid)}
            </div>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary-fixed-dim">check_circle</span>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-6 flex-1 min-h-0 overflow-x-auto pb-4">
        
        {/* Column 1: Upcoming */}
        <div className="flex-1 min-w-[320px] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0">
          <div className="p-4 border-b border-outline-variant bg-surface-variant/20 sticky top-0 flex justify-between items-center">
            <h2 className="font-section-heading font-bold text-primary">Upcoming</h2>
            <span className="bg-primary-container text-on-primary px-2 py-0.5 rounded-full text-xs font-bold">{upcoming.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-surface-variant/5">
            {upcoming.map(m => (
              <div key={m.id} className={`bg-surface rounded shadow-sm border p-4 ${m.daysRemaining! <= 7 ? 'border-[#c2410c] ring-1 ring-[#c2410c]/20' : 'border-outline-variant'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-primary text-base">{m.contractor}</div>
                    <span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{m.trade}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-page-title font-bold text-lg">{formatRupees(m.amount)}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-on-surface mb-3">{m.name}</div>
                <div className="flex justify-between items-center border-t border-outline-variant/50 pt-3">
                  <div className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {m.dueDate}
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${m.daysRemaining! <= 7 ? 'bg-[#fff7ed] text-[#c2410c]' : 'bg-surface-variant text-on-surface-variant'}`}>
                    {m.daysRemaining} days left
                  </div>
                </div>
                <button onClick={() => handleMarkPaid(m.id)} className="w-full mt-3 bg-primary-container/30 text-on-primary-container hover:bg-primary-container py-2 rounded text-xs font-bold transition-colors">
                  Mark as Paid
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Overdue */}
        <div className="flex-1 min-w-[320px] bg-surface-lowest border border-error/50 rounded flex flex-col min-h-0 ring-1 ring-error/20">
          <div className="p-4 border-b border-error/30 bg-error-container/20 sticky top-0 flex justify-between items-center">
            <h2 className="font-section-heading font-bold text-error">Overdue</h2>
            <span className="bg-error text-on-error px-2 py-0.5 rounded-full text-xs font-bold">{overdue.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-error-container/5">
            {overdue.map(m => (
              <div key={m.id} className="bg-surface rounded shadow-sm border border-error p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-error"></div>
                <div className="flex justify-between items-start mb-2 pr-4">
                  <div>
                    <div className="font-bold text-primary text-base">{m.contractor}</div>
                    <span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{m.trade}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-page-title font-bold text-lg text-error">{formatRupees(m.amount)}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-on-surface mb-3">{m.name}</div>
                <div className="flex justify-between items-center border-t border-error/20 pt-3">
                  <div className="text-xs font-bold text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Due: {m.dueDate}
                  </div>
                  <div className="text-xs font-bold bg-error text-on-error px-2 py-1 rounded">
                    {m.daysOverdue} days overdue
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => handleWhatsApp(m.contractor, m.amount)} className="flex items-center justify-center gap-1 bg-[#25D366]/10 text-[#166534] border border-[#25D366]/30 hover:bg-[#25D366]/20 py-2 rounded text-[11px] font-bold transition-colors">
                    <span className="material-symbols-outlined text-[14px]">chat</span>
                    Remind
                  </button>
                  <button onClick={() => handleMarkPaid(m.id)} className="bg-primary text-on-primary hover:opacity-90 py-2 rounded text-[11px] font-bold transition-colors">
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Paid */}
        <div className="flex-1 min-w-[320px] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0 opacity-70 hover:opacity-100 transition-opacity">
          <div className="p-4 border-b border-outline-variant bg-surface-variant/20 sticky top-0 flex justify-between items-center">
            <h2 className="font-section-heading font-bold text-on-surface-variant">Paid</h2>
            <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-bold">{paid.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
            {paid.map(m => (
              <div key={m.id} className="bg-surface rounded border border-outline-variant p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-on-surface-variant text-base">{m.contractor}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-page-title font-bold text-lg text-on-surface-variant line-through">{formatRupees(m.amount)}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-on-surface-variant mb-3">{m.name}</div>
                <div className="flex justify-between items-center border-t border-outline-variant/50 pt-3">
                  <div className="text-xs font-bold text-[#166534] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Paid {m.paidDate}
                  </div>
                  <button onClick={() => handleUndoPaid(m.id)} className="text-xs font-bold text-primary hover:underline">
                    Undo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Milestone Slide-in Panel */}
      {isAddPanelOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-[380px] bg-surface-lowest border-l border-outline-variant shadow-2xl flex flex-col z-20 animate-in slide-in-from-right">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/10">
            <h2 className="font-section-heading font-bold text-primary">Add New Milestone</h2>
            <button onClick={() => setIsAddPanelOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Contractor</label>
              <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm">
                <option>BuildTech Solutions</option>
                <option>IronWorks Ltd</option>
                <option>Volt Experts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Milestone Name</label>
              <input type="text" placeholder="e.g. Slab completion Tower B" className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Amount (₹)</label>
              <input type="number" placeholder="e.g. 500000" className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Due Date</label>
              <input type="date" className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Linked Activity (Optional)</label>
              <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm">
                <option>-- Select from Daily Reports --</option>
                <option>Slab Pour Sector 4 (Completed Oct 24)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">Notes</label>
              <textarea rows={3} className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm"></textarea>
            </div>
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-variant/10">
            <button 
              onClick={handleAddMilestone} 
              className="w-full bg-primary text-on-primary font-bold py-2.5 rounded shadow hover:opacity-90 transition-opacity"
            >
              Save Milestone
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

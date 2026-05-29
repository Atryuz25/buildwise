import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/components/ToastContext';

export const SiteEngineerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Site Engineer Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">Daily tasks and immediate actions.</p>
        </div>
      </div>

      {/* 3 column grid: 30% / 40% / 30% */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Column 1 — Today's actions (30%) */}
        <div className="w-[30%] flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/estimator')} className="w-full h-[44px] bg-surface-lowest border border-primary text-primary font-bold rounded flex items-center justify-start px-4 gap-3 hover:bg-primary-container/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">calculate</span>
              + New concrete estimate
            </button>
            <button onClick={() => navigate('/optimizer')} className="w-full h-[44px] bg-surface-lowest border border-primary text-primary font-bold rounded flex items-center justify-start px-4 gap-3 hover:bg-primary-container/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
              + Optimize steel cuts
            </button>
            <button onClick={() => navigate('/daily-report')} className="w-full h-[44px] bg-primary text-on-primary font-bold rounded flex items-center justify-start px-4 gap-3 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              Submit Daily Site Report
            </button>
            <button onClick={() => navigate('/inventory')} className="w-full h-[44px] bg-surface-lowest border border-primary text-primary font-bold rounded flex items-center justify-start px-4 gap-3 hover:bg-primary-container/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">warehouse</span>
              + Update inventory
            </button>
          </div>

          <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex-1 flex flex-col min-h-0">
            <h2 className="font-section-heading text-section-heading text-primary mb-4">Today's checklist</h2>
            <div className="flex-1 overflow-y-auto space-y-2">
              <label className="flex items-start gap-3 p-2 hover:bg-surface-container rounded cursor-pointer group">
                <input type="checkbox" className="mt-1" onChange={(e) => {
                  if (e.target.checked) showToast('Task marked as complete', 'success');
                }} />
                <span className="text-sm font-bold text-error group-hover:text-error peer-checked:line-through peer-checked:text-on-surface-variant">Audit overdue — 2 days</span>
              </label>
              <label className="flex items-start gap-3 p-2 hover:bg-surface-container rounded cursor-pointer group">
                <input type="checkbox" className="mt-1" onChange={(e) => {
                  if (e.target.checked) showToast('Task marked as complete', 'success');
                }} />
                <span className="text-sm font-bold text-on-surface-variant peer-checked:line-through">Inventory: sand below threshold</span>
              </label>
              <label className="flex items-start gap-3 p-2 hover:bg-surface-container rounded cursor-pointer group">
                <input type="checkbox" className="mt-1" onChange={(e) => {
                  if (e.target.checked) showToast('Task marked as complete', 'success');
                }} />
                <span className="text-sm font-bold text-on-surface-variant peer-checked:line-through">Receive 50 bags cement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Column 2 — Status cards (40%) */}
        <div className="w-[40%] flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-surface-lowest border border-outline-variant rounded p-4">
              <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Today's Material Need</div>
              <div className="text-xl font-bold text-primary">24.5 m³</div>
              <div className="text-xs text-on-surface-variant mt-1">Concrete (M20)</div>
            </div>
            <div className="bg-surface-lowest border border-outline-variant rounded p-4">
              <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Last Audit Result</div>
              <div className="text-xl font-bold text-[#166534]">-0.5%</div>
              <div className="text-xs text-on-surface-variant mt-1">Healthy variance</div>
            </div>
            <div className="bg-surface-lowest border border-outline-variant rounded p-4">
              <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Inventory Alerts</div>
              <div className="text-xl font-bold text-error">2</div>
              <div className="text-xs text-on-surface-variant mt-1">Materials below threshold</div>
            </div>
            <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col items-start">
              <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Weather Risk</div>
              <span className="bg-[#fff7ed] text-[#c2410c] px-2 py-0.5 rounded text-xs font-bold uppercase mb-1">Medium</span>
              <div className="text-xs text-on-surface-variant">Rain likely at 2 PM.</div>
            </div>
          </div>

          <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex-1 flex flex-col min-h-0">
            <h2 className="font-section-heading text-section-heading text-primary mb-4 flex items-center justify-between">
              Crew Attendance (Today)
              <button onClick={() => navigate('/attendance')} className="text-xs font-bold text-primary hover:underline">View All</button>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scroll">
              <div className="border border-outline-variant rounded p-3 bg-surface flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-on-surface">Civil Team A</div>
                  <div className="text-xs text-on-surface-variant">Expected: 45</div>
                </div>
                <div className="font-bold text-[#166534] bg-[#dcfce7] px-2 py-1 rounded text-xs">93%</div>
              </div>
              <div className="border border-outline-variant rounded p-3 bg-surface flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-on-surface">Steel Fixers</div>
                  <div className="text-xs text-on-surface-variant">Expected: 30</div>
                </div>
                <div className="font-bold text-error bg-error-container px-2 py-1 rounded text-xs">66%</div>
              </div>
              <div className="border border-outline-variant rounded p-3 bg-surface flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-on-surface">Masonry B</div>
                  <div className="text-xs text-on-surface-variant">Expected: 50</div>
                </div>
                <div className="font-bold text-[#166534] bg-[#dcfce7] px-2 py-1 rounded text-xs">96%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 — Warnings (30%) */}
        <div className="w-[30%] bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col min-h-0">
          <h2 className="font-section-heading text-section-heading text-error mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span> Alerts & Warnings
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            
            <div className="border border-error/30 bg-error-container/20 rounded p-3 border-l-4 border-l-error cursor-pointer hover:bg-error-container/40 transition-colors">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">inventory_2</span>
                <div>
                  <div className="font-bold text-sm text-error">Cement audit variance 18%</div>
                  <div className="text-xs text-on-surface-variant mt-1">High risk detected in yesterday's audit.</div>
                  <div className="text-[10px] text-outline mt-2">2 hours ago</div>
                </div>
              </div>
            </div>

            <div className="border border-[#fed7aa] bg-[#fff7ed] rounded p-3 border-l-4 border-l-[#ea580c] cursor-pointer hover:bg-[#ffedd5] transition-colors">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ea580c] text-[18px] mt-0.5">warehouse</span>
                <div>
                  <div className="font-bold text-sm text-[#ea580c]">Sand stock: 3 days remaining</div>
                  <div className="text-xs text-on-surface-variant mt-1">Below minimum threshold of 5 days.</div>
                  <div className="text-[10px] text-outline mt-2">5 hours ago</div>
                </div>
              </div>
            </div>

            <div className="border border-[#fed7aa] bg-[#fff7ed] rounded p-3 border-l-4 border-l-[#ea580c] cursor-pointer hover:bg-[#ffedd5] transition-colors">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ea580c] text-[18px] mt-0.5">rainy</span>
                <div>
                  <div className="font-bold text-sm text-[#ea580c]">Rain likely tomorrow</div>
                  <div className="text-xs text-on-surface-variant mt-1">Avoid slab pour.</div>
                  <div className="text-[10px] text-outline mt-2">Yesterday</div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant flex-1 flex flex-col min-h-0">
             <h2 className="font-section-heading text-section-heading text-primary mb-4 flex items-center justify-between">
              Delays Logged
              <button onClick={() => navigate('/delays')} className="text-xs font-bold text-primary hover:underline">View Log</button>
            </h2>
            <div className="border border-[#fed7aa] bg-[#fff7ed] rounded p-3 border-l-4 border-l-[#ea580c] cursor-pointer hover:bg-[#ffedd5] transition-colors mb-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ea580c] text-[18px] mt-0.5">group_off</span>
                <div>
                  <div className="font-bold text-sm text-[#ea580c]">Labour Shortage</div>
                  <div className="text-xs text-on-surface-variant mt-1">Masonry B missing 15 personnel. Blockwork halted.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

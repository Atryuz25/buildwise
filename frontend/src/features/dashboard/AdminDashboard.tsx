import React from 'react';
import { useToast } from '../../shared/components/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Admin Overview</h1>
          <p className="text-on-surface-variant text-sm mt-1">Multi-project portfolio and resource management.</p>
        </div>
      </div>

      <div className="bg-surface-lowest border border-outline-variant rounded p-4 shrink-0 overflow-x-auto">
        <h2 className="font-section-heading text-primary mb-4">Project Comparison</h2>
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
              <th className="pb-2">Project</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Budget</th>
              <th className="pb-2">Spent %</th>
              <th className="pb-2">Cement Waste %</th>
              <th className="pb-2">Steel Waste %</th>
              <th className="pb-2">Inventory Health</th>
              <th className="pb-2">Last Audit</th>
              <th className="pb-2">Risk Flag</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-outline-variant/50 hover:bg-surface transition-colors cursor-pointer">
              <td className="py-3 font-bold text-primary">Sector 5 Clinic</td>
              <td className="py-3">Bangalore</td>
              <td className="py-3">₹1.2Cr</td>
              <td className="py-3">45%</td>
              <td className="py-3 text-[#166534] font-bold">3.2%</td>
              <td className="py-3 text-[#166534] font-bold">2.1%</td>
              <td className="py-3">Good</td>
              <td className="py-3 text-on-surface-variant text-xs">Today</td>
              <td className="py-3"><span className="bg-[#dcfce7] text-[#166534] px-2 py-1 rounded text-xs font-bold uppercase">Healthy</span></td>
            </tr>
            <tr className="border-b border-outline-variant/50 hover:bg-surface transition-colors cursor-pointer">
              <td className="py-3 font-bold text-primary">Horizon Towers</td>
              <td className="py-3">Mumbai</td>
              <td className="py-3">₹8.5Cr</td>
              <td className="py-3">82%</td>
              <td className="py-3 text-error font-bold">14.5%</td>
              <td className="py-3 text-error font-bold">8.4%</td>
              <td className="py-3 text-error font-bold">Critical</td>
              <td className="py-3 text-on-surface-variant text-xs">Yesterday</td>
              <td className="py-3"><span className="bg-error-container text-error px-2 py-1 rounded text-xs font-bold uppercase">High Risk</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col min-h-0">
          <h2 className="font-section-heading text-primary mb-4">Wastage Leaderboard</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#166534]">Sector 5 Clinic</span>
                <span className="text-[#166534]">3.2% (Best)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-[#166534]" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#ea580c]">Project Alpha</span>
                <span className="text-[#ea580c]">8.5%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-[#ea580c]" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-error">Horizon Towers</span>
                <span className="text-error">14.5% (Worst)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col min-h-0">
          <h2 className="font-section-heading text-error mb-4">Cost Overrun Alerts</h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="border border-error/30 bg-error-container/20 rounded p-3 border-l-4 border-l-error flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-error">Horizon Towers</div>
                <div className="text-xs text-on-surface-variant mt-1">Cement usage exceeded budget by &gt;10%</div>
              </div>
              <div className="text-right">
                <div className="font-page-title text-lg font-bold text-error">₹4.2L</div>
                <button onClick={() => showToast('Alert sent to Project Manager', 'success')} className="text-[10px] uppercase font-bold text-[#166534] border border-[#166534] px-2 py-0.5 rounded mt-1 hover:bg-[#dcfce7] transition-colors">Alert PM</button>
              </div>
            </div>
            <div className="border border-[#fed7aa] bg-[#fff7ed] rounded p-3 border-l-4 border-l-[#ea580c] flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-[#ea580c]">Project Alpha</div>
                <div className="text-xs text-on-surface-variant mt-1">Steel usage nearing 10% overrun</div>
              </div>
              <div className="text-right">
                <div className="font-page-title text-lg font-bold text-[#ea580c]">₹1.8L</div>
                <button onClick={() => showToast('Alert sent to Project Manager', 'success')} className="text-[10px] uppercase font-bold text-[#166534] border border-[#166534] px-2 py-0.5 rounded mt-1 hover:bg-[#dcfce7] transition-colors">Alert PM</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

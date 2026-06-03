import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export const CrewProductivityPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedCrewId, setSelectedCrewId] = useState<string | 'all'>('all');
  const [detailView, setDetailView] = useState<'daily' | 'weekly'>('daily');
  const [crews, setCrews] = useState<any[]>([]);

  useEffect(() => {
    const fetchCrews = async () => {
      try {
        const data = await apiClient.get('/productivity/crews');
        setCrews(data);
      } catch (error) {
        showToast('Failed to fetch productivity data', 'error');
      }
    };
    fetchCrews();
  }, [showToast]);

  const selectedCrew = selectedCrewId !== 'all' ? crews.find(c => c.id === selectedCrewId) : null;

  // Data for the "All crews" bar chart
  const allCrewsChartData = crews.map(c => ({
    name: c.name,
    efficiency: c.efficiency,
  })).sort((a, b) => a.efficiency - b.efficiency);

  const dailyData = selectedCrew ? selectedCrew.dailyData : [];

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 85) return '#166534'; // Green
    if (eff >= 70) return '#c2410c'; // Amber
    return '#b91c1c'; // Red
  };

  const getEfficiencyBadge = (eff: number) => {
    if (eff >= 85) return 'bg-[#dcfce7] text-[#166534]';
    if (eff >= 70) return 'bg-[#fff7ed] text-[#c2410c]';
    return 'bg-error-container text-error';
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Crew Productivity Analytics</h1>
          <p className="text-on-surface-variant text-sm mt-1">Track output per crew against daily and weekly targets.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left — Crew Selector (25%) */}
        <div className="w-[25%] bg-surface-lowest border border-outline-variant rounded flex flex-col shrink-0 min-h-0">
          <div className="p-4 border-b border-outline-variant sticky top-0 bg-surface-lowest z-10">
            <h2 className="font-section-heading font-bold text-primary mb-2">Select Crew</h2>
            <button 
              onClick={() => setSelectedCrewId('all')}
              className={`w-full text-left px-3 py-2 rounded font-bold transition-colors ${selectedCrewId === 'all' ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-variant/50 text-on-surface'}`}
            >
              All Crews Comparison
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
            {crews.map(crew => (
              <button 
                key={crew.id}
                onClick={() => setSelectedCrewId(crew.id)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedCrewId === crew.id 
                    ? 'bg-secondary-container/10 border-secondary' 
                    : 'bg-surface border-transparent hover:border-outline-variant'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${selectedCrewId === crew.id ? 'text-primary' : 'text-on-surface'}`}>{crew.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getEfficiencyBadge(crew.efficiency)}`}>
                    {crew.efficiency}%
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant mb-1">{crew.contractor}</div>
                <span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">
                  {crew.trade}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Main Area (75%) */}
        <div className="w-[75%] flex flex-col min-h-0">
          
          {selectedCrewId === 'all' ? (
            /* All Crews Comparison View */
            <div className="flex flex-col gap-6 h-full min-h-0">
              
              {/* Comparison Bar Chart */}
              <div className="bg-surface-lowest border border-outline-variant rounded p-6 shrink-0">
                <h3 className="font-section-heading font-bold text-primary mb-4">Overall Efficiency (Last 30 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allCrewsChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <ReferenceLine x={85} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target: 85%', fill: '#64748b', fontSize: 12 }} />
                      <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} barSize={24}>
                        {allCrewsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-surface-lowest border border-outline-variant rounded flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-outline-variant bg-surface-variant/20 sticky top-0">
                  <h3 className="font-section-heading font-bold text-primary">Efficiency Leaderboard</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface-lowest z-10 shadow-sm">
                      <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider bg-surface-variant/10">
                        <th className="p-4">Crew Name</th>
                        <th className="p-4">Trade</th>
                        <th className="p-4">Contractor</th>
                        <th className="p-4 text-center">Avg Efficiency</th>
                        <th className="p-4 text-center">Delay Incidents</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crews.sort((a,b) => a.efficiency - b.efficiency).map(crew => (
                        <tr key={crew.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors">
                          <td className="p-4 font-bold text-primary">{crew.name}</td>
                          <td className="p-4"><span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{crew.trade}</span></td>
                          <td className="p-4 text-on-surface-variant">{crew.contractor}</td>
                          <td className="p-4 text-center font-bold text-on-surface">{crew.efficiency}%</td>
                          <td className="p-4 text-center text-on-surface-variant">{Math.floor(Math.random() * 5)}</td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${getEfficiencyBadge(crew.efficiency)}`}>
                              {crew.efficiency >= 85 ? 'Performing' : crew.efficiency >= 70 ? 'Watch' : 'Underperforming'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* Selected Crew View (Center + Right Split) */
            <div className="flex gap-6 h-full min-h-0">
              
              {/* Center — Crew Detail (66% of remaining space) */}
              <div className="w-[66%] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0">
                <div className="p-6 border-b border-outline-variant shrink-0 bg-surface-variant/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-section-heading text-xl font-bold text-primary mb-1">{selectedCrew?.name}</h2>
                      <div className="text-sm text-on-surface-variant">{selectedCrew?.contractor} • Foreman: <span className="font-bold">{selectedCrew?.foreman}</span></div>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded ${getEfficiencyBadge(selectedCrew?.efficiency || 0)}`}>
                      Efficiency: {selectedCrew?.efficiency}%
                    </span>
                  </div>
                  <div className="bg-primary-container/20 border border-primary-container/50 rounded p-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Output Metric</span>
                    <span className="font-bold text-primary">{selectedCrew?.metric}</span>
                  </div>
                </div>

                <div className="p-4 border-b border-outline-variant flex gap-2 shrink-0">
                  <button onClick={() => setDetailView('daily')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${detailView === 'daily' ? 'bg-primary-container text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}>Daily View (14 Days)</button>
                  <button onClick={() => setDetailView('weekly')} className={`px-4 py-2 text-sm font-bold rounded transition-colors ${detailView === 'weekly' ? 'bg-primary-container text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}>Weekly Summary</button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  {detailView === 'daily' ? (
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target', fill: '#64748b', fontSize: 12 }} />
                          <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={40}>
                             {dailyData.map((entry: any, index: any) => (
                              <Cell key={`cell-${index}`} fill={entry.actual < entry.target * 0.8 ? '#b91c1c' : '#0f172a'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider">
                          <th className="pb-3">Week</th>
                          <th className="pb-3 text-right">Target</th>
                          <th className="pb-3 text-right">Actual</th>
                          <th className="pb-3 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4].map(w => (
                          <tr key={w} className="border-b border-outline-variant/50">
                            <td className="py-3 font-bold">Week {w} (Oct)</td>
                            <td className="py-3 text-right">700</td>
                            <td className="py-3 text-right font-bold">640</td>
                            <td className="py-3 text-right text-error font-bold">-8.5%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right — Performance Summary (34% of remaining space) */}
              <div className="w-[34%] bg-surface-lowest border border-outline-variant rounded flex flex-col shrink-0 min-h-0">
                <div className="p-4 border-b border-outline-variant bg-surface-variant/20 sticky top-0">
                  <h3 className="font-section-heading font-bold text-primary">Performance Summary</h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  
                  <div>
                    <div className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Avg Efficiency (30d)</div>
                    <div className={`text-3xl font-page-title font-bold ${selectedCrew?.efficiency && selectedCrew.efficiency < 70 ? 'text-error' : 'text-[#166534]'}`}>
                      {selectedCrew?.efficiency}%
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                      <span className="text-sm text-on-surface-variant">Best Day</span>
                      <span className="font-bold text-[#166534]">Oct 21 (115%)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                      <span className="text-sm text-on-surface-variant">Worst Day</span>
                      <span className="font-bold text-error">Oct 14 (42%)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                      <span className="text-sm text-on-surface-variant">Days below target</span>
                      <span className="font-bold text-error">4 days</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-sm text-on-surface-variant">Delay Incidents</span>
                      <span className="font-bold text-on-surface hover:underline cursor-pointer">2 logs</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant">
                    <button 
                      onClick={async () => {
                        const note = window.prompt('Enter note for Project Manager:');
                        if (note) {
                          try {
                            // Hit the specific productivity flag endpoint
                            await apiClient.post(`/productivity/crews/${selectedCrew.id}/flag`, { note });
                            
                            // Dispatch WhatsApp notification
                            await apiClient.post('/notifications/whatsapp', {
                              type: 'pm-manual-reminder',
                              payload: {
                                engineerName: 'Site Engineer',
                                message: note
                              }
                            });

                            showToast('Flagged for PM review & notification sent', 'success');
                          } catch(e) {
                            showToast('Failed to flag crew', 'error');
                          }
                        }
                      }} 
                      className="w-full border border-[#c2410c] text-[#c2410c] hover:bg-[#fff7ed] transition-colors py-2 rounded font-bold text-sm flex justify-center items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">flag</span> Flag for review
                    </button>
                    <div className="mt-4 p-3 bg-surface-variant/20 border border-outline-variant rounded">
                      <div className="text-xs font-bold text-on-surface-variant mb-1">PM Notes</div>
                      <div className="text-sm">Consistently struggling with material availability on Floor 3. Monitor next week.</div>
                      <div className="text-[10px] text-on-surface-variant mt-2">— Added by Raj Patel (Oct 22)</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ContractorModal, CrewModal } from './ContractorModals';

export const ContractorsManagementPage: React.FC = () => {
  const { showToast } = useToast();
  
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isEditContractorOpen, setIsEditContractorOpen] = useState(false);
  const [isAddCrewOpen, setIsAddCrewOpen] = useState(false);
  
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Profile' | 'Crews' | 'Performance' | 'Payment'>('Profile');
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedContractorData, setSelectedContractorData] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const data = await apiClient.get('/contractors/leaderboard');
      setContractors(data);
      if (data.length > 0 && !selectedContractorId) {
        setSelectedContractorId(data[0].id);
      }
    } catch (e) {
      showToast('Failed to load contractors', 'error');
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [showToast]);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await apiClient.get('/milestones');
        setMilestones(data);
      } catch (e) {
        // ignore
      }
    };
    fetchMilestones();
  }, []);

  const fetchDetail = async () => {
    if (!selectedContractorId) return;
    try {
      const data = await apiClient.get(`/contractors/${selectedContractorId}`);
      setSelectedContractorData(data);
    } catch(e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [selectedContractorId]);

  const selectedContractor = contractors.find(c => c.id === selectedContractorId);

  const getEfficiencyBadge = (eff: number) => {
    if (eff >= 85) return 'bg-[#dcfce7] text-[#166534] border-[#166534]/30';
    if (eff >= 70) return 'bg-[#fff7ed] text-[#c2410c] border-[#c2410c]/30';
    return 'bg-error-container text-error border-error/30';
  };

  const performanceTrend = [
    { project: 'Project X', efficiency: 72 },
    { project: 'Project Y', efficiency: 81 },
    { project: 'Project Alpha', efficiency: 88 },
  ];

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Contractors Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage contractor profiles, crew assignments, and track portfolio performance.</p>
        </div>
        <button onClick={() => setIsAddContractorOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Contractor
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left — Contractor List (35%) */}
        <div className="w-[35%] bg-surface-lowest border border-outline-variant rounded flex flex-col shrink-0 min-h-0">
          <div className="p-4 border-b border-outline-variant sticky top-0 bg-surface-lowest z-10 flex gap-2">
            <input type="text" placeholder="Search contractors..." className="flex-1 border border-outline-variant rounded p-2 text-sm focus:border-primary-container" />
            <button className="p-2 border border-outline-variant rounded hover:bg-surface-variant text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
            {contractors.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedContractorId(c.id)}
                className={`p-4 rounded border cursor-pointer transition-colors ${
                  selectedContractorId === c.id ? 'border-primary shadow-sm bg-surface ring-1 ring-primary' : 'border-outline-variant hover:border-primary-container bg-surface-lowest'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-primary text-base">{c.name}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getEfficiencyBadge(c.efficiency)}`}>
                    {c.efficiency}% Eff
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{c.trade}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${c.status === 'Active' ? 'text-[#166534]' : 'text-on-surface-variant'}`}>
                    • {c.status}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant">{c.contact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Detail Panel (65%) */}
        <div className="w-[65%] flex flex-col min-h-0 bg-surface-lowest border border-outline-variant rounded overflow-hidden">
          {selectedContractor ? (
            <>
              {/* Detail Header */}
              <div className="p-6 border-b border-outline-variant bg-surface-variant/10 shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-page-title font-bold text-primary mb-1">{selectedContractor.name}</h2>
                    <div className="text-sm text-on-surface-variant">Partner since {selectedContractor.since}</div>
                  </div>
                  <button onClick={() => setIsEditContractorOpen(true)} className="px-3 py-1.5 border border-outline-variant rounded bg-surface text-sm font-bold text-primary hover:bg-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-6 border-b border-outline-variant">
                  {['Profile', 'Crews', 'Performance', 'Payment'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                
                {/* PROFILE TAB */}
                {activeTab === 'Profile' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Primary Contact</div>
                        <div className="font-bold text-on-surface">{selectedContractor.contact}</div>
                        <div className="text-sm text-on-surface-variant">{selectedContractor.phone}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Trades</div>
                        <div className="text-sm bg-surface-variant/50 border border-outline-variant inline-block px-2 py-1 rounded">{selectedContractor.trade}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">GST Number</div>
                        <div className="text-sm text-on-surface font-mono">27AADCB2230M1Z2</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Bank Details</div>
                        <div className="text-sm text-on-surface font-mono">HDFC Bank • 50100234567890 • HDFC0001234</div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-outline-variant">
                      <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">Cross-Project Summary (BuildWise Portfolio)</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-surface border border-outline-variant rounded p-4 text-center">
                          <div className="text-2xl font-bold text-primary mb-1">3</div>
                          <div className="text-xs text-on-surface-variant">Projects Worked</div>
                        </div>
                        <div className="bg-surface border border-outline-variant rounded p-4 text-center">
                          <div className={`text-2xl font-bold mb-1 ${selectedContractor.efficiency >= 85 ? 'text-[#166534]' : 'text-error'}`}>{selectedContractor.efficiency}%</div>
                          <div className="text-xs text-on-surface-variant">Avg Efficiency</div>
                        </div>
                        <div className="bg-surface border border-outline-variant rounded p-4 text-center">
                          <div className="text-2xl font-bold text-error mb-1">2</div>
                          <div className="text-xs text-on-surface-variant">Delay Incidents</div>
                        </div>
                        <div className="bg-surface border border-outline-variant rounded p-4 text-center">
                          <div className="text-2xl font-bold text-[#c2410c] mb-1">14</div>
                          <div className="text-xs text-on-surface-variant">Issues Logged</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-2 italic text-center">Based on 3 projects on BuildWise platform.</div>
                    </div>
                  </div>
                )}

                {/* CREWS TAB */}
                {activeTab === 'Crews' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-section-heading font-bold text-primary text-sm">Crews assigned to Project Alpha</h3>
                      <button onClick={() => setIsAddCrewOpen(true)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">add</span> Add Crew
                      </button>
                    </div>
                    <div className="border border-outline-variant rounded overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-variant/20">
                          <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider">
                            <th className="p-3">Crew Name</th>
                            <th className="p-3">Trade</th>
                            <th className="p-3">Foreman</th>
                            <th className="p-3 text-center">Standard Size</th>
                            <th className="p-3 text-right">Output Metric</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/10">
                            <td className="p-3 font-bold text-primary">Civil Team A</td>
                            <td className="p-3">Civil</td>
                            <td className="p-3">Ramesh</td>
                            <td className="p-3 text-center">45</td>
                            <td className="p-3 text-right text-xs">m³ poured / day</td>
                          </tr>
                          <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/10">
                            <td className="p-3 font-bold text-primary">Civil Team B</td>
                            <td className="p-3">Civil</td>
                            <td className="p-3">Suresh</td>
                            <td className="p-3 text-center">30</td>
                            <td className="p-3 text-right text-xs">m³ poured / day</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PERFORMANCE TAB */}
                {activeTab === 'Performance' && (
                  <div className="space-y-8">
                    <div>
                       <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">Overall Efficiency Trend</h3>
                       <div className="h-64 bg-surface border border-outline-variant rounded p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="project" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="efficiency" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                       </div>
                    </div>

                    <div>
                      <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">Project History</h3>
                      <div className="border border-outline-variant rounded overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-surface-variant/20">
                            <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider">
                              <th className="p-3">Project</th>
                              <th className="p-3 text-center">Avg Efficiency</th>
                              <th className="p-3 text-center">Delays</th>
                              <th className="p-3 text-center">Issues</th>
                              <th className="p-3 text-center">PM Rating</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/10">
                              <td className="p-3 font-bold text-primary">Project Alpha</td>
                              <td className="p-3 text-center font-bold text-[#166534]">88%</td>
                              <td className="p-3 text-center">1</td>
                              <td className="p-3 text-center">5</td>
                              <td className="p-3 text-center">In Progress</td>
                            </tr>
                            <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/10">
                              <td className="p-3 font-bold text-primary">Project Y</td>
                              <td className="p-3 text-center font-bold text-[#c2410c]">81%</td>
                              <td className="p-3 text-center">1</td>
                              <td className="p-3 text-center">4</td>
                              <td className="p-3 text-center text-[#f59e0b]">★★★★☆</td>
                            </tr>
                            <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/10">
                              <td className="p-3 font-bold text-primary">Project X</td>
                              <td className="p-3 text-center font-bold text-error">72%</td>
                              <td className="p-3 text-center">0</td>
                              <td className="p-3 text-center">5</td>
                              <td className="p-3 text-center text-[#f59e0b]">★★★☆☆</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYMENT TAB */}
                {activeTab === 'Payment' && (
                  <div className="space-y-6">
                    <div className="bg-[#fff7ed] border border-[#c2410c]/30 rounded p-6 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-[#c2410c] uppercase tracking-wider mb-1">Total Outstanding (All Projects)</div>
                        <div className="text-3xl font-page-title font-bold text-[#c2410c]">₹3,20,000</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Total Paid to Date</div>
                        <div className="text-xl font-bold text-primary">₹14,50,000</div>
                      </div>
                    </div>

                    <div className="border border-outline-variant rounded overflow-hidden">
                      <div className="p-4 border-b border-outline-variant bg-surface-variant/20 flex justify-between items-center">
                        <h3 className="font-section-heading font-bold text-primary text-sm">Milestone History</h3>
                        <button onClick={() => showToast('Exporting Payments...', 'info')} className="text-xs font-bold text-primary hover:underline">Export CSV</button>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider">
                            <th className="p-3">Project</th>
                            <th className="p-3">Milestone</th>
                            <th className="p-3 text-right">Amount ₹</th>
                            <th className="p-3 text-right">Due Date</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {milestones.map(m => (
                            <tr key={m.id} className={`border-b border-outline-variant/50 ${m.status === 'OVERDUE' ? 'bg-[#fff7ed]/50' : ''}`}>
                              <td className="p-3 font-bold">{m.project}</td>
                              <td className="p-3">{m.milestone}</td>
                              <td className="p-3 text-right font-bold">₹{m.amount.toLocaleString()}</td>
                              <td className={`p-3 text-right ${m.status === 'OVERDUE' ? 'text-error font-bold' : ''}`}>{m.dueDate}</td>
                              <td className="p-3 text-center">
                                {m.status === 'OVERDUE' && <span className="bg-error-container text-error px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Overdue</span>}
                                {m.status === 'PAID' && <span className="bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Paid</span>}
                                {m.status === 'UPCOMING' && <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Upcoming</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant p-8">
              Select a contractor from the list to view their profile, crews, and performance history.
            </div>
          )}
        </div>

      </div>
      </div>
      
      <ContractorModal 
        isOpen={isAddContractorOpen} 
        onClose={() => setIsAddContractorOpen(false)} 
        onSuccess={fetchLeaderboard}
      />
      <ContractorModal 
        isOpen={isEditContractorOpen} 
        onClose={() => setIsEditContractorOpen(false)} 
        onSuccess={() => { fetchLeaderboard(); fetchDetail(); }}
        contractorData={selectedContractorData}
      />
      <CrewModal 
        isOpen={isAddCrewOpen}
        onClose={() => setIsAddCrewOpen(false)}
        onSuccess={fetchDetail}
        contractorId={selectedContractorId || ''}
      />
    </div>
  );
};

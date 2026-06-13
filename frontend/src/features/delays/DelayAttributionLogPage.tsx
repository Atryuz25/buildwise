import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const DelayAttributionLogPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeFilters, setActiveFilters] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Data State
  const [delayEntries, setDelayEntries] = useState<any[]>([]);
  const [, setTotalDays] = useState(0);
  const [causeData, setCauseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDelays = async () => {
      try {
        const data = await apiClient.get('/productivity/delays');
        // map backend keys to frontend expected keys
        const mapped = data.map((d: any) => ({
          id: d.id,
          date: d.date,
          cause: d.cause,
          description: d.cause + ' incident reported on ' + d.date,
          hoursLost: d.impactDays * 8, // mock hours from days
          activities: [d.project],
          reportedBy: d.crew,
          severity: d.severity,
          pmNote: d.status
        }));
        setDelayEntries(mapped);
        
        let days = 0;
        const causesMap: Record<string, number> = {};
        data.forEach((d: any) => { 
          days += d.impactDays; 
          causesMap[d.cause] = (causesMap[d.cause] || 0) + 1;
        });
        setTotalDays(days);
        
        const chartData = Object.keys(causesMap).map(key => ({ name: key, value: causesMap[key] }));
        setCauseData(chartData);
      } catch (err) {
        showToast('Failed to load delays', 'error');
      }
    };
    fetchDelays();
  }, [showToast]);

  const handleSaveNote = (id: number) => {
    setDelayEntries(prev => prev.map(entry => entry.id === id ? { ...entry, pmNote: editingNoteText } : entry));
    setEditingNoteId(null);
    showToast('PM Note saved', 'success');
  };

  const getCauseColor = (cause: string) => {
    switch(cause) {
      case 'Labour': return 'bg-[#fff7ed] text-[#c2410c] border-[#c2410c]/30'; // Amber
      case 'Material': return 'bg-sky-50 text-sky-700 border-sky-200'; // Blue
      case 'Weather': return 'bg-teal-50 text-teal-700 border-teal-200'; // Teal
      case 'Design change': return 'bg-purple-50 text-purple-700 border-purple-200'; // Purple
      case 'Client hold': return 'bg-rose-50 text-rose-700 border-rose-200'; // Coral
      default: return 'bg-slate-50 text-slate-700 border-slate-200'; // Gray
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch(sev) {
      case 'High': return 'bg-error text-on-error';
      case 'Medium': return 'bg-[#c2410c] text-white';
      default: return 'bg-secondary-container text-on-secondary-container';
    }
  };

  const getPieColor = (index: number) => {
    const colors = ['#c2410c', '#0ea5e9', '#14b8a6', '#a855f7', '#f43f5e', '#64748b'];
    return colors[index % colors.length];
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Delay Attribution Log</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review and manage project delays pulled from daily site reports.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => {
            const csvContent = "data:text/csv;charset=utf-8,Date,Project,Crew,Cause,Severity,Impact Days,Cost Impact\nOct 23,Project Alpha,Civil,Weather,Low,1,-\n";
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `delay_log.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Exported CSV', 'success');
          }} className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded bg-surface hover:bg-surface-variant transition-colors text-sm font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <button onClick={() => {
            showToast('Generating PDF Report...', 'info');
            window.open('http://localhost:3005/api/reports/export-pdf', '_blank');
          }} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Export Project Delay Report
          </button>
        </div>
      </div>

      {/* Filter Bar (Top) */}
      <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex gap-4 items-center shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-primary border-r border-outline-variant pr-4">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          Filters
          {activeFilters > 0 && (
            <span className="bg-primary-container text-on-primary px-2 py-0.5 rounded-full text-[10px] ml-1">{activeFilters}</span>
          )}
        </div>
        
        <select className="border border-outline-variant rounded p-2 text-sm text-on-surface-variant bg-surface min-w-[150px]">
          <option>All Causes</option>
          <option>Labour</option>
          <option>Material</option>
          <option>Weather</option>
          <option>Design change</option>
        </select>
        
        <select className="border border-outline-variant rounded p-2 text-sm text-on-surface-variant bg-surface min-w-[150px]">
          <option>All Severities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        <button className="flex items-center gap-2 px-3 py-2 border border-outline-variant rounded bg-surface text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">date_range</span>
          Oct 2023
        </button>
        
        {activeFilters > 0 && (
          <button onClick={() => setActiveFilters(0)} className="text-sm text-primary hover:underline ml-auto font-bold">Clear filters</button>
        )}
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error">calendar_clock</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Delayed Days</div>
            <div className="text-2xl font-page-title font-bold text-primary">3.5 Days</div>
          </div>
        </div>
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex items-center gap-4">
           <div className="w-16 h-16 shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={causeData} innerRadius={20} outerRadius={30} dataKey="value" stroke="none">
                   {causeData.map((_entry, index) => <Cell key={`cell-${index}`} fill={getPieColor(index)} />)}
                 </Pie>
                 <Tooltip contentStyle={{ fontSize: '10px', padding: '4px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Most Common Cause</div>
            <div className="text-lg font-bold text-primary">{causeData.length > 0 ? [...causeData].sort((a,b) => b.value - a.value)[0].name : 'N/A'}</div>
          </div>
        </div>
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">timer</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Hours Lost</div>
            <div className="text-2xl font-page-title font-bold text-primary">34 hrs</div>
          </div>
        </div>
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-[#fff7ed] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#c2410c]">payments</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Est. Cost Impact</div>
            <div className="text-2xl font-page-title font-bold text-[#c2410c]">₹42,500</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 min-h-0 bg-surface-lowest border border-outline-variant rounded overflow-y-auto p-8 custom-scroll relative">
        <div className="absolute left-[163px] top-8 bottom-8 w-0.5 bg-outline-variant/50"></div>
        
        <div className="space-y-8 relative">
          {delayEntries.map(entry => (
            <div key={entry.id} className="flex gap-6 items-start relative z-10">
              
              {/* Date Badge */}
              <div className="w-[100px] text-right pt-2 shrink-0">
                <div className="font-bold text-primary text-sm">{entry.date.split(',')[0]}</div>
                <div className="text-xs text-on-surface-variant">{entry.date.split(',')[1]}</div>
              </div>

              {/* Node Marker */}
              <div className="w-4 h-4 rounded-full bg-surface-lowest border-4 border-primary mt-3 shrink-0"></div>

              {/* Content Card */}
              <div className="flex-1 bg-surface border border-outline-variant rounded shadow-sm overflow-hidden hover:border-primary-container transition-colors">
                <div className="p-4 border-b border-outline-variant/50 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${getCauseColor(entry.cause)}`}>
                      {entry.cause}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(entry.severity)}`}>
                      {entry.severity} Severity
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-error bg-error-container/10 px-2 py-1 rounded">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    {entry.hoursLost} Hours Lost
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-sm font-bold text-on-surface mb-3">{entry.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                      Reported by {entry.reportedBy}
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">category</span>
                      {entry.activities.map((act: any) => (
                        <span key={act} className="bg-surface-variant/30 px-1.5 py-0.5 rounded border border-outline-variant/50">{act}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PM Note Section */}
                <div className="bg-surface-variant/10 p-3 border-t border-outline-variant/50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-[18px] mt-0.5">speaker_notes</span>
                  <div className="flex-1">
                    {editingNoteId === entry.id ? (
                      <div className="space-y-2">
                        <textarea 
                          className="w-full text-sm border-outline-variant rounded p-2 focus:border-primary-container"
                          rows={2}
                          value={editingNoteText}
                          onChange={e => setEditingNoteText(e.target.value)}
                          placeholder="Add a note..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveNote(entry.id)} className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded hover:opacity-90 transition-opacity">Save</button>
                          <button onClick={() => setEditingNoteId(null)} className="text-on-surface-variant hover:text-on-surface text-xs font-bold px-3 py-1.5 rounded transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {entry.pmNote ? (
                          <div className="group relative">
                            <div className="text-xs font-bold text-primary mb-1">PM Note</div>
                            <div className="text-sm text-on-surface-variant pr-8">{entry.pmNote}</div>
                            <button 
                              onClick={() => { setEditingNoteId(entry.id); setEditingNoteText(entry.pmNote || ''); }} 
                              className="absolute top-0 right-0 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingNoteId(entry.id); setEditingNoteText(''); }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">add</span> Add PM Note
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

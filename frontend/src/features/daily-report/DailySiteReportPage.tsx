import React, { useState, useEffect } from 'react';
import { useDailyReportSync } from './useDailyReportSync';
import { useToast } from '../../shared/components/ToastContext';

export const DailySiteReportPage: React.FC = () => {
  const { syncToAuditStore, autoSaveDraft } = useDailyReportSync();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [activeSections, setActiveSections] = useState({
    work: true,
    materials: true,
    labour: true,
    issues: true,
    photos: true
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const toggleSection = (section: keyof typeof activeSections) => {
    setActiveSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [activities, setActivities] = useState([{ id: 1, name: '', location: '', status: 'In progress', expectedPct: 50, actualPct: 50 }]);
  const [materials] = useState([
    { id: 1, name: 'Cement (bags)', expected: 100, actual: 110, isRisk: true },
    { id: 2, name: 'River Sand (cft)', expected: 800, actual: 800, isRisk: false }
  ]);
  const [crews] = useState([
    { id: 1, name: 'Civil Team A', expected: 20, actual: 18, foreman: 'Ramesh', target: '200 sqft', actualOutput: '180 sqft' }
  ]);
  const [issues, setIssues] = useState<{id: number, type: string, desc: string, severity: string}[]>([]);
  
  const [isDelayed, setIsDelayed] = useState(false);

  const [history, setHistory] = useState([
    { id: 1, date: new Date(Date.now() - 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), engineer: 'Raj Patel', status: 'Submitted', headcount: '42/45', issues: 2, delay: 'Material shortage (4h)' },
    { id: 2, date: new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), engineer: 'Raj Patel', status: 'Submitted', headcount: '44/45', issues: 0, delay: null },
    { id: 3, date: new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), engineer: 'Raj Patel', status: 'Submitted', headcount: '45/45', issues: 1, delay: null },
  ]);

  const completedSectionsCount = Object.values(activeSections).filter(Boolean).length; // Just a dummy metric for the "progress indicator" for now

  useEffect(() => {
    const timer = setTimeout(async () => {
      const payload = {
        id: draftId,
        date: new Date().toISOString().split('T')[0],
        projectId: '294b2977-35cb-491f-9244-e9d983523101', // seeded project
        engineerId: '5bc1708a-3627-475d-88cb-bdc5e116ffbd', // seeded user
        activities: activities.map(a => ({
          name: a.name,
          location: a.location,
          status: a.status,
          expectedPct: a.expectedPct,
          actualPct: a.actualPct
        })),
        materials: materials.map(m => ({ 
          materialId: 'a06fa80c-ba61-4933-9543-2f9de5b3327e', // seeded material for testing 
          expected: m.expected, 
          actual: m.actual, 
          unit: 'bags' 
        })),
        crews: crews.map(c => ({
          crewId: '5ba19552-4c05-4698-95d8-9305538a8cbe', // seeded crew for testing
          actual: c.actual,
          actualOutput: String(c.actualOutput)
        })),
        issues: issues.map(i => ({
          type: i.type,
          severity: i.severity,
          desc: i.desc
        })),
        isDelayed,
        delayCause: 'Weather', // mocked for now
        delayHours: 4 // mocked for now
      };

      const newDraftId = await autoSaveDraft(payload);
      if (newDraftId) {
        setDraftId(newDraftId);
      }
    }, 2000); // Debounce saves by 2 seconds
    
    return () => clearTimeout(timer);
  }, [activities, materials, crews, issues, isDelayed, autoSaveDraft, draftId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await syncToAuditStore({
      id: draftId,
      date: new Date().toISOString().split('T')[0],
      projectId: '294b2977-35cb-491f-9244-e9d983523101', // seeded project
      engineerId: '5bc1708a-3627-475d-88cb-bdc5e116ffbd', // seeded user
      activities: activities.map(a => ({
        name: a.name,
        location: a.location,
        status: a.status,
        expectedPct: a.expectedPct,
        actualPct: a.actualPct
      })),
      materials: materials.map(m => ({ 
        materialId: 'a06fa80c-ba61-4933-9543-2f9de5b3327e', // seeded material for testing 
        expected: m.expected, 
        actual: m.actual, 
        unit: 'bags' 
      })),
      crews: crews.map(c => ({
        crewId: '5ba19552-4c05-4698-95d8-9305538a8cbe', // seeded crew for testing
        actual: c.actual,
        actualOutput: String(c.actualOutput)
      })),
      issues: issues.map(i => ({
        type: i.type,
        severity: i.severity,
        desc: i.desc
      })),
      isDelayed,
      delayCause: isDelayed ? 'Material shortage' : undefined,
      delayHours: isDelayed ? 4 : undefined
    });
    
    if (success) {
      // Add to history
      const newHistoryEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        engineer: 'Raj Patel',
        status: 'Submitted',
        headcount: '45/45',
        issues: issues.length,
        delay: isDelayed ? 'Delay Logged' : null,
      };
      setHistory([newHistoryEntry, ...history]);
    }
    
    setIsSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    // Simulate Supabase upload delay
    setTimeout(() => {
      setUploadedPhotos(prev => [...prev, 'photo_1.jpg']);
      showToast('Photo uploaded successfully', 'success');
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Daily Site Report</h1>
          <p className="text-on-surface-variant text-sm mt-1">Submit daily progress, labour, and material consumption.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Submission Form (52%) */}
        <div className="w-[52%] flex flex-col min-h-0 bg-surface-lowest border border-outline-variant rounded relative">
          
          {/* Sticky Header */}
          <div className="sticky top-0 bg-surface-lowest border-b border-outline-variant p-4 z-10 flex justify-between items-center rounded-t">
            <div>
              <div className="font-bold text-primary">Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="text-xs text-on-surface-variant">Project Alpha • Raj Patel</div>
            </div>
            <div className="bg-primary-container text-on-primary text-xs font-bold px-3 py-1 rounded-full">
              Form Progress: {completedSectionsCount}/5
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Section 1: Work Done */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <button onClick={() => toggleSection('work')} className="w-full bg-surface-variant/30 p-3 flex justify-between items-center font-bold text-primary">
                <span>1. Work Done Today</span>
                <span className="material-symbols-outlined">{activeSections.work ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeSections.work && (
                <div className="p-4 space-y-4 bg-surface">
                  {activities.map((act, _idx) => (
                    <div key={act.id} className="grid grid-cols-2 gap-4 pb-4 border-b border-outline-variant/50 last:border-0">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Activity Name</label>
                        <input type="text" placeholder="e.g. Slab pour" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Status</label>
                        <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                          <option>Completed</option>
                          <option>In progress</option>
                          <option>Delayed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Expected % Complete</label>
                        <input type="number" defaultValue={act.expectedPct} className="w-full border-outline-variant rounded p-2 bg-surface-variant/30" readOnly />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Actual % Complete</label>
                        <input type="number" defaultValue={act.actualPct} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setActivities([...activities, { id: Date.now(), name: '', location: '', status: 'In progress', expectedPct: 0, actualPct: 0 }])} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add</span> Add activity
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Materials */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <button onClick={() => toggleSection('materials')} className="w-full bg-surface-variant/30 p-3 flex justify-between items-center font-bold text-primary">
                <span>2. Materials Used</span>
                <span className="material-symbols-outlined">{activeSections.materials ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeSections.materials && (
                <div className="p-4 space-y-4 bg-surface">
                  <div className="text-xs text-on-surface-variant mb-2">Note: Submitting this section will automatically create a Phase 1 Material Audit entry.</div>
                  {materials.map(mat => (
                    <div key={mat.id} className="grid grid-cols-3 gap-4 pb-4 border-b border-outline-variant/50 last:border-0">
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Material</label>
                        <div className="font-bold py-2">{mat.name}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Expected</label>
                        <input type="number" value={mat.expected} readOnly className="w-full border-outline-variant rounded p-2 bg-surface-variant/30 font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Actual</label>
                        <input type="number" defaultValue={mat.actual} className={`w-full border-outline-variant rounded p-2 focus:border-primary-container ${mat.isRisk ? 'text-error border-error' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Labour */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <button onClick={() => toggleSection('labour')} className="w-full bg-surface-variant/30 p-3 flex justify-between items-center font-bold text-primary">
                <span>3. Labour & Attendance</span>
                <span className="material-symbols-outlined">{activeSections.labour ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeSections.labour && (
                <div className="p-4 space-y-4 bg-surface">
                  {crews.map(crew => (
                    <div key={crew.id} className="pb-4 border-b border-outline-variant/50 last:border-0">
                      <div className="font-bold text-primary mb-2">{crew.name} <span className="text-xs font-normal text-on-surface-variant ml-2">(Foreman: {crew.foreman})</span></div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Expected Headcount</label>
                          <input type="number" value={crew.expected} readOnly className="w-full border-outline-variant rounded p-2 bg-surface-variant/30" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Present Today</label>
                          <input type="number" defaultValue={crew.actual} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Today's Target</label>
                          <input type="text" value={crew.target} readOnly className="w-full border-outline-variant rounded p-2 bg-surface-variant/30 text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Actual Output</label>
                          <input type="text" defaultValue={crew.actualOutput} className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Issues & Delays */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <button onClick={() => toggleSection('issues')} className="w-full bg-surface-variant/30 p-3 flex justify-between items-center font-bold text-primary">
                <span>4. Issues & Delays</span>
                <span className="material-symbols-outlined">{activeSections.issues ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeSections.issues && (
                <div className="p-4 space-y-4 bg-surface">
                  <div className="flex items-center gap-4 p-3 bg-surface-variant/20 rounded border border-outline-variant">
                    <label className="font-bold text-sm">Was today delayed?</label>
                    <div className="flex gap-2">
                      <button onClick={() => setIsDelayed(true)} className={`px-4 py-1 rounded text-sm font-bold ${isDelayed ? 'bg-error text-on-error' : 'bg-surface border border-outline-variant text-on-surface-variant'}`}>Yes</button>
                      <button onClick={() => setIsDelayed(false)} className={`px-4 py-1 rounded text-sm font-bold ${!isDelayed ? 'bg-primary-container text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant'}`}>No</button>
                    </div>
                  </div>
                  
                  {isDelayed && (
                    <div className="grid grid-cols-2 gap-4 p-3 border-l-4 border-error bg-error-container/10">
                       <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Delay Cause</label>
                        <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                          <option>Material shortage</option>
                          <option>Labour shortage</option>
                          <option>Weather</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Hours Lost</label>
                        <input type="number" placeholder="e.g. 4" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                      </div>
                    </div>
                  )}

                  {issues.map((issue, _idx) => (
                     <div key={issue.id} className="grid grid-cols-2 gap-4 pb-4 border-b border-outline-variant/50 relative">
                        <button onClick={() => setIssues(issues.filter(i => i.id !== issue.id))} className="absolute top-0 right-0 text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Issue Type</label>
                          <select 
                            value={issue.type}
                            onChange={(e) => setIssues(issues.map(i => i.id === issue.id ? { ...i, type: e.target.value } : i))}
                            className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm"
                          >
                            <option>Material</option>
                            <option>Labour</option>
                            <option>Equipment</option>
                            <option>Weather</option>
                            <option>Design</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Severity</label>
                          <select 
                            value={issue.severity}
                            onChange={(e) => setIssues(issues.map(i => i.id === issue.id ? { ...i, severity: e.target.value } : i))}
                            className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm"
                          >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Description</label>
                          <input 
                            type="text" 
                            placeholder="Describe the issue..." 
                            value={issue.desc}
                            onChange={(e) => setIssues(issues.map(i => i.id === issue.id ? { ...i, desc: e.target.value } : i))}
                            className="w-full border-outline-variant rounded p-2 focus:border-primary-container text-sm" 
                          />
                        </div>
                     </div>
                  ))}
                  <button onClick={() => setIssues([...issues, { id: Date.now(), type: 'Material', desc: '', severity: 'Low' }])} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[16px]">add</span> Add issue
                  </button>
                </div>
              )}
            </div>

             {/* Section 5: Photos */}
             <div className="border border-outline-variant rounded overflow-hidden">
              <button onClick={() => toggleSection('photos')} className="w-full bg-surface-variant/30 p-3 flex justify-between items-center font-bold text-primary">
                <span>5. Photos</span>
                <span className="material-symbols-outlined">{activeSections.photos ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeSections.photos && (
                <div className="p-4 bg-surface space-y-4">
                  <label className="border-2 border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-surface-variant/20 transition-colors cursor-pointer relative">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isUploading} accept="image/jpeg, image/png" multiple />
                    {isUploading ? (
                      <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-2">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-primary-fixed-dim mb-2">add_a_photo</span>
                    )}
                    <div className="font-bold text-primary">{isUploading ? 'Uploading to Supabase...' : 'Drag & drop or click to upload photos'}</div>
                    <div className="text-xs text-on-surface-variant mt-1">Accepts JPG/PNG. Max 10 photos. Auto-tagged with GPS.</div>
                  </label>
                  {uploadedPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {uploadedPhotos.map((p, idx) => (
                        <div key={idx} className="bg-surface-variant/20 border border-outline-variant rounded px-3 py-1 text-xs font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-primary">image</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-surface-lowest border-t border-outline-variant p-4 z-10">
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded shadow hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Submitting...
                </>
              ) : (
                'Submit Daily Report'
              )}
            </button>
          </div>
        </div>

        {/* Right — Report History (48%) */}
        <div className="w-[48%] bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/20">
            <h2 className="font-section-heading text-lg font-bold text-primary">Report History</h2>
            <button onClick={() => showToast('CSV Exported', 'success')} className="text-xs font-bold text-primary border border-outline-variant bg-surface px-3 py-1.5 rounded flex items-center gap-1 hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
            </button>
          </div>
          
          <div className="p-4 border-b border-outline-variant flex gap-2">
            <select className="border border-outline-variant rounded p-1.5 text-xs text-on-surface-variant bg-surface flex-1">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
            <select className="border border-outline-variant rounded p-1.5 text-xs text-on-surface-variant bg-surface flex-1">
              <option>All Engineers</option>
              <option>Raj Patel</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.map((item) => (
              <div key={item.id} className="border border-outline-variant rounded p-3 hover:border-primary-container cursor-pointer transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-primary group-hover:text-primary-fixed-dim transition-colors">
                      {item.date}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">By {item.engineer}</div>
                  </div>
                  <span className="bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
                <div className="text-sm">
                  Headcount: {item.headcount} • {item.issues} Issues Logged
                </div>
                {item.delay && (
                  <div className="mt-2 text-xs text-error font-bold bg-error-container/20 p-1.5 rounded inline-block">
                    Delayed: {item.delay}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

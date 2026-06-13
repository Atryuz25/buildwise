import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { api } from '../../shared/api/apiClient';

export const ProjectsPage: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState('Overview');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { showToast } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.projects.getAll();
        setProjects(data);
      } catch (err) {
        showToast('Failed to load projects', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [showToast]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  const [newProjectType, setNewProjectType] = useState('Residential');
  const [newProjectBudget, setNewProjectBudget] = useState('');

  const handleSaveProject = async () => {
    if (!newProjectName || !newProjectBudget) {
      showToast('Please enter a project name and budget', 'error');
      return;
    }
    try {
      const newProj = await api.projects.create({
        name: newProjectName,
        location: newProjectLocation || 'Unknown',
        type: newProjectType,
        budget: Number(newProjectBudget)
      });
      setProjects([...projects, newProj]);
      setIsPanelOpen(false);
      setNewProjectName('');
      setNewProjectLocation('');
      setNewProjectBudget('');
      showToast('Project created successfully', 'success');
    } catch (err) {
      showToast('Failed to create project', 'error');
    }
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 relative overflow-hidden">
      {view === 'LIST' ? (
        <>
          <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
            <div>
              <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Projects Portfolio</h1>
              <p className="text-on-surface-variant text-sm mt-1">Create, view, and manage construction sites.</p>
            </div>
            <button 
              onClick={() => setIsPanelOpen(true)}
              className="bg-primary-container text-on-primary py-2 px-4 rounded font-card-label font-bold hover:opacity-90 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-4 pr-2">
            {projects.map((p, i) => (
              <ProjectCard key={i} onClick={() => setView('DETAIL')} name={p.name} location={p.location} type={p.type} progress={p.progress} status={p.status} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 pb-4 shrink-0 border-b border-outline-variant">
            <button onClick={() => setView('LIST')} className="w-8 h-8 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Project Alpha</h1>
                <span className="bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
              </div>
              <p className="text-on-surface-variant text-sm flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span> Mumbai, MH
                <span className="text-outline-variant">•</span>
                <span>Residential</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 border-b border-outline-variant shrink-0 mt-4">
            {['Overview', 'Estimates History', 'Audit History', 'Team'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard title="Budget Spent" value="45%" />
              <StatCard title="Material Var" value="-0.5%" isGood />
              <StatCard title="Total Estimates" value="124" />
              <StatCard title="Team Members" value="4" />
            </div>
            
            <div className="bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-64 text-on-surface">
              {activeTab === 'Overview' && (
                <div className="animate-in fade-in">
                  <h3 className="font-bold text-lg text-primary mb-4">Project Overview</h3>
                  <p className="text-on-surface-variant">Project Alpha is proceeding on schedule. Foundation work is completed. Currently executing sector 4 slab pouring.</p>
                </div>
              )}
              {activeTab === 'Estimates History' && (
                <div className="animate-in fade-in space-y-4">
                  <h3 className="font-bold text-lg text-primary mb-4">Recent Estimates</h3>
                  <div className="border border-outline-variant rounded p-4 bg-surface flex justify-between items-center">
                    <div>
                      <div className="font-bold">Sector 4 Slab (M20)</div>
                      <div className="text-xs text-on-surface-variant">12.0 m³ • Oct 24, 2023</div>
                    </div>
                    <div className="font-bold text-[#166534]">₹78,120</div>
                  </div>
                  <div className="border border-outline-variant rounded p-4 bg-surface flex justify-between items-center">
                    <div>
                      <div className="font-bold">Tower A Columns</div>
                      <div className="text-xs text-on-surface-variant">8.5 m³ • Oct 18, 2023</div>
                    </div>
                    <div className="font-bold text-[#166534]">₹55,300</div>
                  </div>
                </div>
              )}
              {activeTab === 'Audit History' && (
                <div className="animate-in fade-in space-y-4">
                  <h3 className="font-bold text-lg text-primary mb-4">Material Audits</h3>
                  <div className="border border-outline-variant rounded p-4 bg-surface flex justify-between items-center">
                    <div>
                      <div className="font-bold">Slab Pour - Sector 4</div>
                      <div className="text-xs text-on-surface-variant">Cement Var: <span className="text-error font-bold">+10%</span></div>
                    </div>
                    <div className="text-xs text-on-surface-variant">Oct 24, 2023</div>
                  </div>
                </div>
              )}
              {activeTab === 'Team' && (
                <div className="animate-in fade-in">
                  <h3 className="font-bold text-lg text-primary mb-4">Project Team</h3>
                  <div className="flex items-center gap-4 border-b border-outline-variant/50 pb-3 mb-3">
                    <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary font-bold">RP</div>
                    <div>
                      <div className="font-bold">Raj Patel</div>
                      <div className="text-xs text-on-surface-variant">Site Engineer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container font-bold">AS</div>
                    <div>
                      <div className="font-bold">Amit Singh</div>
                      <div className="text-xs text-on-surface-variant">Project Manager</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Slide-in Panel */}
      {isPanelOpen && (
        <div className="absolute inset-0 bg-background/50 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-surface-lowest border-l border-outline-variant shadow-2xl h-full flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface shrink-0">
              <h2 className="font-section-heading text-xl font-bold text-primary">New Project</h2>
              <button onClick={() => setIsPanelOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Project Name</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Location</label>
                <input type="text" value={newProjectLocation} onChange={e => setNewProjectLocation(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Project Type</label>
                <select value={newProjectType} onChange={e => setNewProjectType(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Concrete Grade</label>
                  <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container"><option>M20</option><option>M25</option></select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Steel Grade</label>
                  <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container"><option>Fe500</option></select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Total Budget (₹)</label>
                <input type="number" value={newProjectBudget} onChange={e => setNewProjectBudget(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface shrink-0 flex justify-end gap-3">
              <button onClick={() => setIsPanelOpen(false)} className="px-4 py-2 font-bold text-on-surface-variant hover:text-on-surface">Cancel</button>
              <button onClick={handleSaveProject} className="px-6 py-2 bg-primary-container text-on-primary rounded font-bold hover:opacity-90">Save Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ name, location, type, progress, status, onClick }: any) => {
  const isAtRisk = status === 'At Risk';
  const isCompleted = status === 'Completed';
  
  return (
    <div onClick={onClick} className="bg-surface-lowest border border-outline-variant rounded-xl overflow-hidden hover:border-primary-container hover:shadow-md transition-all cursor-pointer flex flex-col">
      <div className="p-4 border-b border-outline-variant">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-[16px] font-bold text-primary">{name}</h3>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {location} <span className="text-outline-variant mx-1">•</span> {type}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
            isAtRisk ? 'bg-error-container text-error' : isCompleted ? 'bg-surface-variant text-on-surface-variant' : 'bg-[#dcfce7] text-[#166534]'
          }`}>
            {status}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-on-surface-variant">Budget Spent</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full ${isAtRisk ? 'bg-error' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant/50">
          <span>Last active 2 hrs ago</span>
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-[16px] hover:text-primary transition-colors">analytics</span>
            <span className="material-symbols-outlined text-[16px] hover:text-primary transition-colors">settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, isGood }: any) => (
  <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex flex-col gap-1">
    <span className="text-xs font-card-label uppercase tracking-wider text-on-surface-variant">{title}</span>
    <span className={`text-2xl font-page-title font-bold ${isGood ? 'text-[#166534]' : 'text-primary'}`}>{value}</span>
  </div>
);

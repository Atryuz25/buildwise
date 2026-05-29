import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-on-primary font-bold">BW</div>
        <span className="font-page-title text-xl font-bold text-primary">BuildWise</span>
      </div>
      <button 
        onClick={() => {
          const role = localStorage.getItem('userRole');
          if (role === 'admin') navigate('/dashboard/admin');
          else if (role === 'engineer') navigate('/dashboard/engineer');
          else navigate('/dashboard');
        }}
        className="absolute top-6 right-8 text-on-surface-variant font-bold text-sm hover:underline"
      >
        Skip setup
      </button>

      <div className="w-full max-w-[560px]">
        {/* Step Progress Bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-secondary' : 'bg-surface-variant'}`}></div>
          ))}
        </div>

        <div className="bg-surface-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 flex-1 min-h-[400px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h2 className="font-section-heading text-xl text-primary font-bold mb-6">1. Project Basics</h2>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Project Name</label>
                  <input type="text" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" placeholder="e.g. Horizon Towers" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Location (City, District)</label>
                    <input type="text" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" placeholder="Mumbai, MH" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Project Type</label>
                    <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Infrastructure</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Start Date</label>
                    <input type="date" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Expected End Date</label>
                    <input type="date" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Total Budget (₹)</label>
                  <input type="number" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" placeholder="₹" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h2 className="font-section-heading text-xl text-primary font-bold mb-6">2. Material Grades</h2>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Default Concrete Grade</label>
                  <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                    <option>M20 (1:1.5:3)</option>
                    <option>M25 (1:1:2)</option>
                    <option>M30 (Design Mix)</option>
                    <option>M35 (Design Mix)</option>
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">IS 456:2000 standard nominal mixes.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Default Steel Grade</label>
                  <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                    <option>Fe500</option>
                    <option>Fe415</option>
                    <option>Fe550</option>
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">IS 1786 standard TMT bars.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Primary Cement Brand (Optional)</label>
                  <input type="text" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" placeholder="e.g. UltraTech, Ambuja" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h2 className="font-section-heading text-xl text-primary font-bold mb-6">3. Material Rates</h2>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Market City</label>
                  <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                    <option>Mumbai</option>
                    <option>Pune</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">OPC Cement (₹/bag)</label>
                    <input type="number" defaultValue={420} className="w-full border-outline-variant rounded p-2 focus:border-primary-container font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">TMT Steel (₹/kg)</label>
                    <input type="number" defaultValue={65} className="w-full border-outline-variant rounded p-2 focus:border-primary-container font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">River Sand (₹/cft)</label>
                    <input type="number" defaultValue={70} className="w-full border-outline-variant rounded p-2 focus:border-primary-container font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Aggregate (₹/cft)</label>
                    <input type="number" defaultValue={70} className="w-full border-outline-variant rounded p-2 focus:border-primary-container font-bold" />
                  </div>
                </div>
                <div className="bg-[#fff7ed] border border-[#ffedd5] text-[#c2410c] p-3 rounded text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Rates are updated monthly. You can edit these at any time.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h2 className="font-section-heading text-xl text-primary font-bold mb-2">4. Team Setup</h2>
                <p className="text-sm text-on-surface-variant mb-6">Add team members to receive WhatsApp invite links.</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Phone Number</label>
                    <input type="tel" className="w-full border-outline-variant rounded p-2 focus:border-primary-container" placeholder="+91" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">Role</label>
                    <select className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                      <option>Site Engineer</option>
                      <option>Project Manager</option>
                    </select>
                  </div>
                  <button className="bg-surface-variant px-4 py-2 rounded font-bold hover:bg-outline-variant transition-colors border border-outline-variant">Add</button>
                </div>
                
                <div className="mt-4 border border-outline-variant rounded overflow-hidden">
                  <div className="p-3 bg-surface border-b border-outline-variant flex justify-between items-center text-sm">
                    <span className="font-bold text-primary">+91 9876543210</span>
                    <span className="text-on-surface-variant font-bold">Site Engineer</span>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 flex flex-col items-center text-center justify-center h-full">
                <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center text-[#166534] mb-4">
                  <span className="material-symbols-outlined text-[32px]">check</span>
                </div>
                <h2 className="font-section-heading text-2xl text-primary font-bold">Setup Complete!</h2>
                <p className="text-on-surface-variant mb-8">Horizon Towers is ready. Materials and team are configured.</p>
                
                <h3 className="font-bold text-lg text-on-surface mb-2">Proceed to Dashboard</h3>
                <div className="flex gap-4 w-full mt-4">
                  <button 
                    onClick={() => {
                      const role = localStorage.getItem('userRole');
                      if (role === 'admin') navigate('/dashboard/admin');
                      else if (role === 'engineer') navigate('/dashboard/engineer');
                      else navigate('/dashboard');
                    }} 
                    className="flex-1 px-4 py-3 bg-primary-container text-on-primary font-bold rounded hover:opacity-90 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          {step < 5 && (
            <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-between items-center">
              <button 
                disabled={step === 1}
                onClick={() => setStep(s => Math.max(1, s - 1))}
                className="px-4 py-2 text-on-surface-variant font-bold disabled:opacity-50 hover:text-on-surface"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(s => Math.min(5, s + 1))}
                className="px-6 py-2 bg-primary-container text-on-primary rounded font-bold hover:opacity-90"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

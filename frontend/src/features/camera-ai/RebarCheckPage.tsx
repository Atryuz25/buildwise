import React, { useState, useRef } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { useAIRebarCheck, type RebarCheckResult } from './useAIRebarCheck';

export const RebarCheckPage: React.FC = () => {
  const { user } = useAuth();
  const projectId = user?.projectIds?.[0] || '294b2977-35cb-491f-9244-e9d983523101'; // Fallback
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { inspectRebar, isLoading, error } = useAIRebarCheck();
  const [result, setResult] = useState<RebarCheckResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null); // Reset previous result
    }
  };

  const handleInspect = async () => {
    if (!file) return;

    let gps = '';
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        gps = `${position.coords.latitude}, ${position.coords.longitude}`;
      } catch (e) {
        console.warn('GPS not available', e);
      }
    }

    const res = await inspectRebar(projectId, file, gps);
    if (res) {
      setResult(res);
    }
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Structural Rebar Check</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Upload a photo of the rebar layout to automatically detect missing ties, incorrect spacing, and rust before pouring concrete.
        </p>
      </div>

      <div className="flex gap-6 min-h-0 flex-1">
        
        {/* Left Column - Input Panel */}
        <div className="w-[400px] flex flex-col gap-4 overflow-y-auto shrink-0 pr-2 custom-scroll">
          
          <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                1. Upload Rebar Photo <span className="text-error">*</span>
              </label>
              
              <input 
                type="file" 
                accept="image/jpeg, image/png" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {!preview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[40px] text-primary-fixed-dim mb-2">add_a_photo</span>
                  <div className="font-bold text-sm text-on-surface">Click or drag photo here</div>
                  <div className="text-[11px] text-on-surface-variant mt-1">JPG/PNG up to 10MB</div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-black">
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover opacity-90" />
                  <button 
                    onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    Photo selected
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleInspect}
              disabled={!file || isLoading}
              className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-sm
                ${(!file || isLoading) 
                  ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-50' 
                  : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Inspecting Rebar...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                  Run Inspection
                </>
              )}
            </button>
            
            {error && (
              <div className="bg-error-container/20 text-error text-xs p-3 rounded border border-error/30 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Result Panel */}
          {result && (
            <div className={`bg-surface-lowest rounded-lg border shadow-sm p-6 shrink-0 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4
              ${result.flagged ? 'border-error/50 ring-1 ring-error/20' : 'border-[#dcfce7] ring-1 ring-[#166534]/20'}`}>
              
              {result.flagged && (
                <div className="absolute top-0 right-0 w-2 h-full bg-error"></div>
              )}
              {!result.flagged && (
                <div className="absolute top-0 right-0 w-2 h-full bg-[#166534]"></div>
              )}

              <div className="flex justify-between items-start mb-6">
                <h2 className="font-section-heading font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">policy</span>
                  Inspection Complete
                </h2>
                <div className="text-xs text-on-surface-variant bg-surface-variant/30 px-2 py-1 rounded">
                  {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">straighten</span>
                    Spacing Status
                  </div>
                  {result.spacingCorrect ? (
                     <div className="text-xl font-bold text-[#166534] flex items-center gap-2 bg-[#f0fdf4] p-2 rounded border border-[#166534]/20">
                       <span className="material-symbols-outlined">check_circle</span>
                       Correct
                     </div>
                  ) : (
                    <div className="text-xl font-bold text-error flex items-center gap-2 bg-error-container/20 p-2 rounded border border-error/20">
                       <span className="material-symbols-outlined">cancel</span>
                       Incorrect Spacing
                     </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-l border-outline-variant pl-6">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">link_off</span>
                    Missing Ties
                  </div>
                  <div className={`text-3xl font-page-title font-bold ${result.tiesMissing > 0 ? 'text-[#c2410c]' : 'text-[#166534]'}`}>
                    {result.tiesMissing}
                  </div>
                </div>
              </div>

              {/* Detected Issues List */}
              <div className="bg-surface border border-outline-variant rounded-lg p-4">
                <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Detected Issues</h3>
                {result.issues && result.issues.length > 0 ? (
                  <ul className="space-y-2">
                    {result.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant bg-surface-variant/20 p-2 rounded">
                        <span className="material-symbols-outlined text-error text-[16px] mt-0.5">warning</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-on-surface-variant flex items-center gap-2 bg-[#f0fdf4] text-[#166534] p-2 rounded">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    No structural issues detected. Ready for pour.
                  </div>
                )}
              </div>

              {result.flagged && (
                <div className="mt-4 pt-4 border-t border-outline-variant">
                  <div className="text-xs font-bold bg-error text-on-error px-2 py-1 rounded inline-flex items-center gap-1 w-max">
                    <span className="material-symbols-outlined text-[14px]">campaign</span>
                    Flagged for Rework
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

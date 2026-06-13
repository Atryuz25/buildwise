import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { useAIPileMeasurement, type PileMeasurementResult } from './useAIPileMeasurement';

export const PileMeasurementPage: React.FC = () => {
  const { user } = useAuth();
  const projectId = user?.projectIds?.[0] || '294b2977-35cb-491f-9244-e9d983523101'; // Fallback to demo project
  const [materialType, setMaterialType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { measurePile, fetchHistory, isLoading, error } = useAIPileMeasurement();
  const [result, setResult] = useState<PileMeasurementResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [filterMaterial, setFilterMaterial] = useState<string>('All');

  const loadHistory = async () => {
    const data = await fetchHistory(projectId);
    setHistory(data || []);
  };

  useEffect(() => {
    loadHistory();
  }, [projectId]);

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

  const handleMeasure = async () => {
    if (!materialType || !file) return;

    // Get GPS
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

    const res = await measurePile(projectId, materialType, file, gps);
    if (res) {
      setResult(res);
      loadHistory(); // refresh history
    }
  };

  const filteredHistory = filterMaterial === 'All' 
    ? history 
    : history.filter(h => h.materialType === filterMaterial);

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="shrink-0">
        <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Material Pile Measurement</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Upload a photo of a stockpile to instantly estimate its volume and compare it against your manual inventory records.
        </p>
      </div>

      <div className="flex gap-6 min-h-0 flex-1">
        
        {/* Left Column - Input Panel */}
        <div className="w-[400px] flex flex-col gap-4 overflow-y-auto shrink-0 pr-2 custom-scroll">
          
          <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                1. Select Material <span className="text-error">*</span>
              </label>
              <select 
                value={materialType} 
                onChange={e => setMaterialType(e.target.value)}
                className="w-full border-outline-variant rounded p-3 focus:border-primary-container text-sm bg-surface"
              >
                <option value="">-- Choose material --</option>
                <option value="Sand">Sand</option>
                <option value="Aggregate">Aggregate</option>
                <option value="Stone">Stone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                2. Upload Photo <span className="text-error">*</span>
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
                  <span className="material-symbols-outlined text-[40px] text-primary-fixed-dim mb-2">cloud_upload</span>
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
              onClick={handleMeasure}
              disabled={!materialType || !file || isLoading}
              className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-sm
                ${(!materialType || !file || isLoading) 
                  ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-50' 
                  : 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Analysing pile...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">straighten</span>
                  Measure Pile
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

        {/* Right Column - Results & History */}
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
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  Measurement Complete
                </h2>
                <div className="text-xs text-on-surface-variant bg-surface-variant/30 px-2 py-1 rounded">
                  {new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI Estimate
                  </div>
                  <div className="text-4xl font-page-title font-bold text-primary">
                    {result.estimatedVolume.toLocaleString()} <span className="text-lg text-primary/60 font-normal">cft</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-l border-outline-variant pl-6">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    Manual Inventory
                  </div>
                  <div className="text-4xl font-page-title font-bold text-on-surface-variant">
                    {result.inventoryVolume.toLocaleString()} <span className="text-lg text-on-surface-variant/60 font-normal">cft</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l border-outline-variant pl-6 justify-center">
                  {result.flagged ? (
                    <>
                      <div className="bg-[#fff7ed] text-[#c2410c] px-3 py-1.5 rounded inline-flex items-center gap-1 w-max border border-[#c2410c]/30">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        <span className="font-bold text-sm">{result.divergencePct.toFixed(1)}% Divergence</span>
                      </div>
                      <div className="text-xs font-bold bg-error text-on-error px-2 py-1 rounded inline-flex items-center gap-1 w-max">
                        <span className="material-symbols-outlined text-[14px]">campaign</span>
                        Flagged for PM Review
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-[#25D366]">chat</span>
                        PM notified via WhatsApp
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#f0fdf4] text-[#166534] px-3 py-1.5 rounded inline-flex items-center gap-1 w-max border border-[#166534]/30">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span className="font-bold text-sm">Valid ({result.divergencePct.toFixed(1)}% gap)</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-1">
                        Matches expected inventory.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="flex-1 bg-surface-lowest border border-outline-variant rounded-lg flex flex-col min-h-0">
            <div className="p-4 border-b border-outline-variant bg-surface-variant/10 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-on-surface">Measurement History</h3>
              <select 
                value={filterMaterial}
                onChange={e => setFilterMaterial(e.target.value)}
                className="border-outline-variant rounded p-1.5 text-xs bg-surface"
              >
                <option value="All">All Materials</option>
                <option value="Sand">Sand</option>
                <option value="Aggregate">Aggregate</option>
                <option value="Stone">Stone</option>
              </select>
            </div>
            
            <div className="flex-1 overflow-auto custom-scroll">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface sticky top-0 border-b border-outline-variant shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-bold tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 font-bold tracking-wider">Material</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-right">AI Estimate</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-right">Inventory</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-right">Divergence</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                    <tr key={item.id} className={`hover:bg-surface-variant/30 transition-colors ${item.flagged ? 'bg-[#fff7ed]/50' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-on-surface font-medium text-xs">
                        {new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-surface-variant px-2 py-0.5 rounded text-xs font-bold text-on-surface-variant">{item.materialType}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                        {item.estimatedVolume} <span className="text-[10px] font-normal text-on-surface-variant">cft</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-on-surface-variant">
                        {item.inventoryVolume} <span className="text-[10px]">cft</span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-right font-bold ${item.flagged ? 'text-[#c2410c]' : 'text-on-surface-variant'}`}>
                        {item.divergencePct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {item.flagged ? (
                          <span className="bg-error text-on-error px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Flagged</span>
                        ) : (
                          <span className="bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Verified</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                        No pile measurements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

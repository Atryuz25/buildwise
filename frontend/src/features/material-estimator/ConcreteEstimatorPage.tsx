import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';

export const ConcreteEstimatorPage: React.FC = () => {
  const { showToast } = useToast();
  const [structure, setStructure] = useState('Slab');
  const [buffer, setBuffer] = useState(5);
  const [unit, setUnit] = useState('Metres');
  const [grade, setGrade] = useState('M20');
  const [pourType, setPourType] = useState('Pump');
  
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(8);
  const [thickness, setThickness] = useState(0.15);
  
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load history
    const loadHistory = async () => {
      try {
        const projectId = localStorage.getItem('projectId') || 'demo-project';
        const data = await apiClient.get(`/estimates/concrete?projectId=${projectId}`);
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };
    loadHistory();
  }, []);

  const handleExportPDF = () => {
    showToast('Generating Estimate PDF...', 'info');
    window.open('http://localhost:3005/api/reports/export-pdf', '_blank');
  };

  // Convert to meters if input is in feet (1 ft = 0.3048 m)
  const multiplier = unit === 'Feet' ? 0.3048 : 1;
  const lengthM = length * multiplier;
  const widthM = width * multiplier;
  const thicknessM = thickness * multiplier;

  // Calculations
  const baseVolume = lengthM * widthM * thicknessM;
  const totalVolume = baseVolume * (1 + buffer / 100);

  // M20 rough rules of thumb per cubic meter
  const cementBags = Math.ceil(totalVolume * 8);
  const sandCft = Math.ceil(totalVolume * 15);
  const aggCft = Math.ceil(totalVolume * 30);

  // Costs
  const cementCost = cementBags * 420;
  const sandCost = sandCft * 70;
  const aggCost = aggCft * 70;
  const totalCost = cementCost + sandCost + aggCost;

  const handleSaveEstimate = async () => {
    setIsSaving(true);
    try {
      const projectId = localStorage.getItem('projectId') || 'demo-project';
      const engineerId = localStorage.getItem('userId') || 'demo-user';
      
      const payload = {
        projectId,
        engineerId,
        structure,
        grade: grade.split(' ')[0], // M20
        volume: baseVolume,
        wastageBuffer: buffer,
        currentRates: { cement: 420, sand: 70, aggregate: 70 }
      };

      const res = await apiClient.post('/estimates/concrete', payload);
      
      if (res.success) {
        showToast('Estimate saved to project BOQ', 'success');
        setHistory([res.estimate, ...history].slice(0, 5));
      }
    } catch (err) {
      showToast('Failed to save estimate', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Concrete Estimator</h1>
          <p className="text-on-surface-variant text-sm mt-1">Calculate exact material quantities and costs.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column — Inputs (45%) */}
        <div className="w-[45%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Structure type tabs */}
          <div className="flex gap-2 border-b border-outline-variant">
            {['Slab', 'Beam', 'Column', 'Footing', 'Staircase'].map(tab => (
              <button 
                key={tab}
                onClick={() => setStructure(tab)}
                className={`px-3 py-2 font-bold text-sm border-b-2 transition-colors ${
                  structure === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center bg-surface-variant/30 p-2 rounded">
            <span className="text-sm font-bold text-on-surface-variant">Units</span>
            <div className="flex bg-surface border border-outline-variant rounded overflow-hidden">
              <button onClick={() => setUnit('Metres')} className={`px-3 py-1 text-xs font-bold ${unit === 'Metres' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}>Metres</button>
              <button onClick={() => setUnit('Feet')} className={`px-3 py-1 text-xs font-bold ${unit === 'Feet' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}>Feet</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-section-heading text-lg text-primary font-bold">Dimensions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Length ({unit === 'Metres' ? 'm' : 'ft'})</label>
                <input type="number" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Width ({unit === 'Metres' ? 'm' : 'ft'})</label>
                <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Thickness/Depth ({unit === 'Metres' ? 'm' : 'ft'})</label>
                <input type="number" value={thickness} onChange={e => setThickness(Number(e.target.value))} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant">
            <h3 className="font-section-heading text-lg text-primary font-bold">Mix Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Concrete Grade</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                  <option>M15 (1:2:4)</option>
                  <option>M20 (1:1.5:3)</option>
                  <option>M25 (1:1:2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Pour Type</label>
                <select value={pourType} onChange={e => setPourType(e.target.value)} className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
                  <option>Pump</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-1">
                <label>Wastage Buffer</label>
                <span>{buffer}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="20" 
                value={buffer} 
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="w-full accent-primary" 
              />
              <div className="text-xs text-[#ea580c] font-bold mt-1 text-right">Adding {buffer}% buffer adds {(baseVolume * (buffer/100)).toFixed(2)}m³</div>
            </div>
          </div>
        </div>

        {/* Right Column — Live Output (55%) */}
        <div className="w-[55%] flex flex-col gap-4 min-h-0">
          <div className="bg-surface-lowest border border-outline-variant rounded p-6 flex-1 overflow-y-auto">
            <h2 className="font-section-heading text-lg text-primary font-bold mb-4">Estimated Requirements</h2>
            
            <div className="bg-primary-container/10 border border-primary-container rounded p-6 text-center mb-6 transition-all">
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Volume</div>
              <div className="text-4xl font-page-title font-bold text-primary">{totalVolume.toFixed(2)} <span className="text-xl">m³</span></div>
            </div>

            <table className="w-full text-left text-sm mb-6">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 font-medium">Cement</td>
                  <td className="py-3 font-bold">{cementBags} bags</td>
                  <td className="py-3 text-right">₹{cementCost.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 font-medium">Sand</td>
                  <td className="py-3 font-bold">{sandCft} cft</td>
                  <td className="py-3 text-right">₹{sandCost.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-outline-variant/50">
                  <td className="py-3 font-medium">Aggregate</td>
                  <td className="py-3 font-bold">{aggCft} cft</td>
                  <td className="py-3 text-right">₹{aggCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded p-4 flex justify-between items-center mb-6 transition-all">
              <div className="font-bold text-[#166534]">Total Estimated Cost</div>
              <div className="text-2xl font-page-title font-bold text-[#166534]">₹{totalCost.toLocaleString()}</div>
            </div>
            
            <div className="mt-8 flex gap-4 shrink-0 no-print">
              <button 
                onClick={handleSaveEstimate} 
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary-container text-on-primary font-bold rounded hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save to Project BOQ'}
              </button>
              <button onClick={handleExportPDF} className="flex-1 px-4 py-3 border border-outline-variant text-on-surface font-bold rounded hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">download</span> Export PDF
              </button>
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-surface-lowest border border-outline-variant rounded p-4 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-section-heading font-bold text-primary text-sm">Recent Estimates</h3>
            </div>
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-xs text-on-surface-variant">No estimates saved yet.</div>
              ) : (
                history.map((est, i) => {
                  const date = new Date(est.createdAt).toLocaleDateString();
                  const data = est.data ? JSON.parse(est.data) : {};
                  return (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-surface rounded cursor-pointer border border-transparent hover:border-outline-variant transition-colors">
                      <div>
                        <div className="text-xs font-bold text-on-surface">{est.structure} ({data.inputs?.grade || 'M20'})</div>
                        <div className="text-[10px] text-on-surface-variant">{date} • {data.inputs?.volume?.toFixed(2) || 0} m³</div>
                      </div>
                      <div className="text-xs font-bold text-[#166534]">₹{est.totalCost.toLocaleString()}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

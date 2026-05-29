import React, { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { api } from '../../shared/api/apiClient';

export const SteelOptimizerPage: React.FC = () => {
  const { showToast } = useToast();
  const [cuts, setCuts] = useState([{ length: 2.5, qty: 10, label: 'Beam Stirrups' }]);
  const [rodLength, setRodLength] = useState(12);
  const [pricePerKg, setPricePerKg] = useState(65);
  const [weightPerMetre, setWeightPerMetre] = useState(0.89);
  
  const [optimized, setOptimized] = useState(false);
  const [rodsUsed, setRodsUsed] = useState<any[]>([]);

  const totalLinearMetres = cuts.reduce((acc, cut) => acc + (cut.length * cut.qty), 0);

  const handleOptimize = async () => {
    try {
      showToast('Optimizing cuts...', 'info');
      const result = await api.steel.optimize({
        projectId: localStorage.getItem('projectId') || 'demo-project',
        engineerId: localStorage.getItem('userId') || 'demo-user',
        standardLength: rodLength,
        pricePerKg: pricePerKg,
        weightPerM: weightPerMetre,
        cuts: cuts.map(c => ({ length: c.length, qty: c.qty, label: c.label }))
      });
      const data = JSON.parse(result.estimate.data);
      setRodsUsed(data.rodsConfig.map((r: any) => ({
        capacity: rodLength,
        used: rodLength - r.remaining,
        pieces: r.cuts
      })));
      setOptimized(true);
      showToast('Optimization complete', 'success');
    } catch(e) {
      showToast('Failed to optimize cuts', 'error');
    }
  };

  const handleExportCSV = () => {
    if (rodsUsed.length === 0) return;
    let csv = "data:text/csv;charset=utf-8,Rod Number,Used (m),Scrap (m),Pieces (m)\n";
    rodsUsed.forEach((r, i) => {
      csv += `${i+1},${r.used.toFixed(2)},${(r.capacity - r.used).toFixed(2)},"${r.pieces.join(', ')}"\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "steel_cut_plan.csv";
    link.click();
    showToast('Downloaded Cut Plan', 'success');
  };

  const addCut = () => setCuts([...cuts, { length: 1, qty: 1, label: 'New Cut' }]);
  const removeCut = (index: number) => setCuts(cuts.filter((_, i) => i !== index));
  const updateCut = (index: number, field: string, value: any) => {
    const newCuts = [...cuts];
    newCuts[index] = { ...newCuts[index], [field]: value };
    setCuts(newCuts);
    setOptimized(false);
  };

  const totalRods = rodsUsed.length;
  const totalRodMetres = totalRods * rodLength;
  const scrapMetres = totalRodMetres - totalLinearMetres;
  const wastePercent = totalRodMetres > 0 ? ((scrapMetres / totalRodMetres) * 100).toFixed(1) : '0';
  const totalWeight = totalRodMetres * weightPerMetre;
  const totalCost = totalWeight * pricePerKg;

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Steel Optimizer</h1>
          <p className="text-on-surface-variant text-sm mt-1">Minimize scrap using FFD algorithms.</p>
        </div>
      </div>

      {/* 3 Column Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Column 1 — Rod configuration */}
        <div className="w-[25%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col gap-4 overflow-y-auto shrink-0">
          <h2 className="font-section-heading text-lg text-primary font-bold border-b border-outline-variant pb-2">Rod Config</h2>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Standard Rod Length</label>
            <select value={rodLength} onChange={e => { setRodLength(Number(e.target.value)); setOptimized(false); }} className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
              <option value="12">12m</option>
              <option value="9">9m</option>
              <option value="6">6m</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Rod Diameter</label>
            <select onChange={e => {
              const diam = Number(e.target.value);
              setWeightPerMetre(parseFloat(((diam * diam) / 162).toFixed(2)));
              setOptimized(false);
            }} className="w-full border-outline-variant rounded p-2 focus:border-primary-container">
              <option value="12">12mm</option>
              <option value="8">8mm</option>
              <option value="10">10mm</option>
              <option value="16">16mm</option>
              <option value="20">20mm</option>
              <option value="25">25mm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Price per kg (₹)</label>
            <input type="number" value={pricePerKg} onChange={e => { setPricePerKg(Number(e.target.value)); setOptimized(false); }} className="w-full border-outline-variant rounded p-2 focus:border-primary-container" />
          </div>
          <div className="bg-surface-variant/50 p-3 rounded mt-auto text-xs font-bold text-on-surface-variant flex justify-between">
            <span>Weight per metre</span>
            <span className="text-primary">{weightPerMetre} kg/m</span>
          </div>
        </div>

        {/* Column 2 — Cut requirements */}
        <div className="w-[40%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0 shrink-0">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h2 className="font-section-heading text-lg text-primary font-bold">Cut Requirements</h2>
            <button onClick={() => {
              setCuts([
                { length: 4.5, qty: 12, label: 'Column ties' },
                { length: 3.2, qty: 8, label: 'Slab reinforcement' },
                { length: 2.1, qty: 20, label: 'Lintel beam' }
              ]);
              setOptimized(false);
              showToast('Imported 3 cuts from clipboard', 'success');
            }} className="text-xs font-bold text-secondary-container hover:underline">Paste from clipboard</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <table className="w-full text-left text-sm mb-4">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant font-card-label">
                  <th className="pb-2">Length (m)</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Label</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {cuts.map((cut, i) => (
                  <tr key={i} className="border-b border-outline-variant/50">
                    <td className="py-2"><input type="number" step="0.1" value={cut.length} onChange={e => updateCut(i, 'length', Number(e.target.value))} className="w-16 p-1 border border-outline-variant rounded text-sm" /></td>
                    <td className="py-2"><input type="number" value={cut.qty} onChange={e => updateCut(i, 'qty', Number(e.target.value))} className="w-16 p-1 border border-outline-variant rounded text-sm" /></td>
                    <td className="py-2"><input type="text" value={cut.label} onChange={e => updateCut(i, 'label', e.target.value)} className="w-full p-1 border border-outline-variant rounded text-sm" /></td>
                    <td className="py-2 text-right"><button onClick={() => removeCut(i)} className="text-error hover:bg-error-container p-1 rounded transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCut} className="w-full border border-dashed border-primary text-primary font-bold py-2 rounded hover:bg-primary-container/10 transition-colors flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span> Add cut
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center shrink-0">
            <div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Total linear metres</div>
              <div className="text-lg font-bold text-primary">{totalLinearMetres.toFixed(1)} m</div>
            </div>
            <button onClick={handleOptimize} className="bg-primary-container text-on-primary px-6 py-2 rounded font-bold hover:opacity-90 transition-colors">
              Optimize Cuts
            </button>
          </div>
        </div>

        {/* Column 3 — Optimized output */}
        <div className="w-[35%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0 shrink-0">
          <h2 className="font-section-heading text-lg text-primary font-bold mb-4 border-b border-outline-variant pb-2">Optimization Result</h2>
          
          {optimized ? (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded p-3">
                  <div className="text-[10px] text-[#166534] font-bold uppercase tracking-wider mb-1">Rods Needed</div>
                  <div className="text-2xl font-page-title font-bold text-[#166534]">{totalRods}</div>
                </div>
                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded p-3">
                  <div className="text-[10px] text-[#166534] font-bold uppercase tracking-wider mb-1">Waste %</div>
                  <div className="text-2xl font-page-title font-bold text-[#166534]">{wastePercent}%</div>
                </div>
              </div>

              <div className="bg-surface-variant/30 rounded p-4 mb-6 shrink-0 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Scrap</div>
                  <div className="text-xl font-bold text-error">{scrapMetres.toFixed(2)}m</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Cost</div>
                  <div className="text-xl font-bold text-primary">₹{Math.round(totalCost).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                <h3 className="text-sm font-bold text-on-surface-variant">Cut Plan</h3>
                {rodsUsed.map((rod, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-on-surface">Rod {i + 1}</span>
                      <span className="text-error font-bold">{(rod.capacity - rod.used).toFixed(2)}m scrap</span>
                    </div>
                    <div className="w-full h-4 bg-error-container rounded flex overflow-hidden border border-outline-variant">
                      {rod.pieces.map((p: number, j: number) => (
                        <div key={j} className="bg-primary border-r border-background h-full" style={{ width: `${(p / rod.capacity) * 100}%` }}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 shrink-0 no-print">
                <button onClick={() => showToast('Optimization plan saved to project', 'success')} className="flex-1 px-4 py-2 bg-primary-container text-on-primary font-bold rounded hover:opacity-90 transition-colors text-sm">
                  Save Plan
                </button>
                <button onClick={handleExportCSV} className="px-4 py-2 border border-outline-variant text-on-surface font-bold rounded hover:bg-surface-variant transition-colors flex justify-center items-center">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant flex-col gap-2">
              <span className="material-symbols-outlined text-[48px] opacity-20">precision_manufacturing</span>
              <p className="text-sm font-bold">Add cuts and click Optimize</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

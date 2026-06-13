import React, { useState, useEffect } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { api } from '../../shared/api/apiClient';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export const InventoryPage: React.FC = () => {
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const { showToast } = useToast();
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryMaterialId, setDeliveryMaterialId] = useState('');
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Hardcode a projectId for demo since we don't have project selection yet
  // const projectId = 'Project Alpha'; // In real app, this comes from context or route

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // We seeded Project Alpha, let's fetch projects and get its ID first,
        // or just fetch all projects and use the first one's ID.
        const projs = await api.projects.getAll();
        if (projs.length > 0) {
          const inv = await api.materials.getInventory(projs[0].id);
          setMaterials(inv);
        }
      } catch (err) {
        showToast('Failed to load inventory', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [showToast]);

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Inventory Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Live stock levels and automated burn rate tracking.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Main Table (65%) */}
        <div className={`${selectedMaterial ? 'w-[65%]' : 'w-full'} bg-surface-lowest border border-outline-variant rounded flex flex-col min-h-0 transition-all duration-300`}>
          <div className="p-4 border-b border-outline-variant flex justify-between items-center shrink-0 bg-surface/50">
            <h2 className="font-section-heading text-primary font-bold">Current Stock</h2>
            <button 
              onClick={() => {
                setDeliveryMaterialId(selectedMaterial ? selectedMaterial.id : (materials.length > 0 ? materials[0].id : ''));
                setIsDeliveryModalOpen(true);
              }} 
              className="bg-primary-container text-on-primary py-1.5 px-3 rounded text-sm font-bold hover:opacity-90 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">add</span> Log Delivery
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="sticky top-0 bg-surface-lowest z-10 shadow-sm">
                <tr className="border-b border-outline-variant text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Min Threshold</th>
                  <th className="py-3 px-4">Burn Rate (7d)</th>
                  <th className="py-3 px-4">Est. Days Left</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {materials.map((m: any) => {
                  const daysLeft = m.burnRate7Day > 0 ? (m.currentStock / m.burnRate7Day).toFixed(1) : '—';
                  let status = 'Good';
                  if (m.currentStock <= m.minThreshold) status = 'Critical';
                  else if (m.currentStock <= m.minThreshold * 1.5) status = 'Warning';
                  
                  return (
                    <InventoryRow 
                      key={m.id}
                      material={m.name} 
                      stock={`${m.currentStock} ${m.unit}`} 
                      threshold={`${m.minThreshold} ${m.unit}`} 
                      burn={`${m.burnRate7Day > 0 ? m.burnRate7Day.toFixed(1) : 0} ${m.unit}/day`} 
                      days={daysLeft} 
                      status={status} 
                      onClick={() => setSelectedMaterial(m)} 
                      selected={selectedMaterial?.id === m.id} 
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel (35%) */}
        {selectedMaterial && (
          <div className="w-[35%] bg-surface-lowest border border-outline-variant rounded p-6 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-300 shrink-0">
            <div className="flex justify-between items-start mb-6 border-b border-outline-variant pb-4 shrink-0">
              <div>
                <h2 className="font-section-heading text-xl text-primary font-bold">{selectedMaterial.name}</h2>
                <p className="text-sm text-on-surface-variant mt-1">Stock & Consumption History</p>
              </div>
              <button onClick={() => setSelectedMaterial(null)} className="w-8 h-8 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Stock Trend (14 days)</h3>
                </div>
                <div className="h-32 bg-surface border border-outline-variant rounded relative overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[60, 55, 50, 45, 40, 100, 95, 90, 85, 80, 75, 70, 65, 45].map((h, i) => ({ day: i+1, stock: h }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006a6a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#006a6a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #cac4d0', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="stock" stroke="#006a6a" fillOpacity={1} fill="url(#colorStock)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Recent Consumption Events</h3>
                <div className="space-y-2">
                  <EventCard date="Today, 5:30 PM" event="Audit: Column pour" qty="-110 bags" />
                  <EventCard date="Yesterday, 6:00 PM" event="Audit: Slab prep" qty="-95 bags" />
                  <EventCard date="Oct 23, 10:00 AM" event="Delivery: Supplier XYZ" qty="+500 bags" isPositive />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant shrink-0">
              <button onClick={() => setIsAdjustmentModalOpen(true)} className="w-full bg-primary-container text-on-primary py-3 rounded font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit_note</span> Log Manual Adjustment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Delivery Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-lowest rounded-lg border border-outline-variant w-[400px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
              <h2 className="font-section-heading font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                Log Material Delivery
              </h2>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Select Material *</label>
                <select 
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
                  value={deliveryMaterialId}
                  onChange={(e) => setDeliveryMaterialId(e.target.value)}
                >
                  <option value="" disabled>-- Choose Material --</option>
                  {materials.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Delivered Amount *</label>
                <input 
                  required
                  type="number"
                  value={deliveryAmount}
                  onChange={e => setDeliveryAmount(e.target.value)}
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
                  placeholder="e.g. 500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reference ID / Invoice #</label>
                <input 
                  type="text"
                  value={deliveryReference}
                  onChange={e => setDeliveryReference(e.target.value)}
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
                  placeholder="e.g. INV-98765"
                />
              </div>
              
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded font-bold hover:bg-surface-variant transition-colors text-on-surface-variant text-sm">
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const amt = Number(deliveryAmount);
                    if (!deliveryMaterialId || isNaN(amt) || amt <= 0) {
                      showToast('Please select a material and enter a valid positive amount', 'error');
                      return;
                    }
                    try {
                      await api.materials.logDelivery(deliveryMaterialId, amt, deliveryReference || 'DELIVERY');
                      const mInfo = materials.find(m => m.id === deliveryMaterialId);
                      showToast(`Successfully logged delivery of ${amt} ${mInfo?.unit || ''} ${mInfo?.name || ''}`, 'success');
                      
                      setIsDeliveryModalOpen(false);
                      setDeliveryAmount('');
                      setDeliveryReference('');
                      
                      // Refresh
                      const projs = await api.projects.getAll();
                      if (projs.length > 0) {
                        const inv = await api.materials.getInventory(projs[0].id);
                        setMaterials(inv);
                        if (selectedMaterial?.id === deliveryMaterialId) {
                          setSelectedMaterial(inv.find((m: any) => m.id === deliveryMaterialId) || null);
                        }
                      }
                    } catch(e) {
                      showToast('Failed to log delivery', 'error');
                    }
                  }} 
                  className="px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Save Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {isAdjustmentModalOpen && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-lowest rounded-lg border border-outline-variant w-[400px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
              <h2 className="font-section-heading font-bold text-primary">Manual Stock Adjustment</h2>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Material</label>
                <div className="text-sm font-bold text-primary">{selectedMaterial.name} ({selectedMaterial.unit})</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Current Stock</label>
                <div className="text-sm text-on-surface">{selectedMaterial.currentStock} {selectedMaterial.unit}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Adjustment Amount (can be negative) *</label>
                <input 
                  required
                  type="number"
                  value={adjustmentAmount}
                  onChange={e => setAdjustmentAmount(e.target.value)}
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
                  placeholder="e.g. -50 or 20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reason *</label>
                <input 
                  required
                  type="text"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
                  placeholder="e.g. Spoilage, recount, etc."
                />
              </div>
              
              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded font-bold hover:bg-surface-variant transition-colors text-on-surface-variant text-sm">
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const amt = Number(adjustmentAmount);
                    if (isNaN(amt) || !adjustmentReason) {
                      showToast('Please enter a valid amount and reason', 'error');
                      return;
                    }
                    try {
                      // Adjust stock
                      await api.materials.logDelivery(selectedMaterial.id, amt, 'INV-ADJUST');
                      showToast(`Successfully adjusted stock by ${amt} ${selectedMaterial.unit}`, 'success');
                      setIsAdjustmentModalOpen(false);
                      setAdjustmentAmount('');
                      setAdjustmentReason('');
                      
                      // Refresh
                      const projs = await api.projects.getAll();
                      if (projs.length > 0) {
                        const inv = await api.materials.getInventory(projs[0].id);
                        setMaterials(inv);
                        setSelectedMaterial(inv.find((m: any) => m.id === selectedMaterial.id) || null);
                      }
                    } catch(e) {
                      showToast('Failed to adjust stock', 'error');
                    }
                  }} 
                  className="px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryRow = ({ material, stock, threshold, burn, days, status, onClick, selected }: any) => {
  let daysColor = 'text-on-surface';
  if (days !== '—') {
    const d = Number(days);
    daysColor = d < 3 ? 'text-error' : d < 5 ? 'text-[#c2410c]' : 'text-[#166534]';
  }
  return (
  <tr onClick={onClick} className={`border-b border-outline-variant/50 hover:bg-surface transition-colors cursor-pointer ${selected ? 'bg-primary-container/10' : ''}`}>
    <td className="py-4 px-4 font-bold text-primary">{material}</td>
    <td className="py-4 px-4 font-medium text-on-surface">{stock}</td>
    <td className="py-4 px-4 text-on-surface-variant border-b border-dashed border-outline-variant inline-block mt-4 hover:border-primary">{threshold}</td>
    <td className="py-4 px-4 text-on-surface-variant">{burn}</td>
    <td className={`py-4 px-4 font-bold ${daysColor}`}>{days}</td>
    <td className="py-4 px-4">
      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
        status === 'Critical' ? 'bg-error-container text-error' : 
        status === 'Warning' ? 'bg-[#fff7ed] text-[#c2410c]' : 
        'bg-[#dcfce7] text-[#166534]'
      }`}>
        {status}
      </span>
    </td>
  </tr>
  );
};

const EventCard = ({ date, event, qty, isPositive }: any) => (
  <div className="border border-outline-variant rounded p-3 bg-surface flex justify-between items-center">
    <div>
      <div className="font-bold text-sm text-on-surface">{event}</div>
      <div className="text-[10px] text-on-surface-variant mt-1">{date}</div>
    </div>
    <div className={`font-bold text-sm ${isPositive ? 'text-primary' : 'text-on-surface-variant'}`}>{qty}</div>
  </div>
);

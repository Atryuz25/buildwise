import React, { useState } from 'react';
import { useToast } from '../../shared/components/ToastContext';
import { apiClient } from '../../api/apiClient';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractorData?: any; // Used for editing
}

export const ContractorModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess, contractorData }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: contractorData?.name || '',
    trade: contractorData?.trade || 'Civil',
    phone: contractorData?.phone || '',
    bankDetails: contractorData?.bankDetails || '',
    status: contractorData?.status || 'Active'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (contractorData) {
        // Edit mode
        await apiClient.put(`/contractors/${contractorData.id}`, formData);
        showToast('Contractor updated successfully', 'success');
      } else {
        // Add mode
        await apiClient.post('/contractors', { ...formData, crews: [] });
        showToast('Contractor added successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save contractor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-surface-lowest rounded-lg border border-outline-variant w-[500px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
          <h2 className="font-section-heading font-bold text-primary">
            {contractorData ? 'Edit Contractor' : 'Add New Contractor'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scroll flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Company Name *</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Trade Specialty *</label>
            <select 
              value={formData.trade}
              onChange={e => setFormData({...formData, trade: e.target.value})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
            >
              <option value="Civil">Civil</option>
              <option value="MEP">MEP</option>
              <option value="Finishing">Finishing</option>
              <option value="Earthwork">Earthwork</option>
              <option value="Carpentry">Carpentry</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Contact Phone *</label>
            <input 
              required
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Bank Details (Account No. / IFSC)</label>
            <textarea 
              value={formData.bankDetails}
              onChange={e => setFormData({...formData, bankDetails: e.target.value})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface resize-none" 
              rows={3}
            />
            <div className="text-[10px] text-on-surface-variant mt-1">Bank details will be encrypted before saving.</div>
          </div>
          {contractorData && (
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>
            </div>
          )}
          <div className="mt-4 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-outline-variant rounded font-bold hover:bg-surface-variant transition-colors text-on-surface-variant text-sm">
              Cancel
            </button>
            <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              Save Contractor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CrewModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; contractorId: string }> = ({ isOpen, onClose, onSuccess, contractorId }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    tradeType: 'Civil',
    size: 10,
    dailyRate: 500
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      showToast('Project ID is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/crew', { ...formData, contractorId });
      showToast('Crew added successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save crew', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-surface-lowest rounded-lg border border-outline-variant w-[500px] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
          <h2 className="font-section-heading font-bold text-primary">Add Crew</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Project ID *</label>
            <input 
              required
              type="text" 
              value={formData.projectId}
              onChange={e => setFormData({...formData, projectId: e.target.value})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Trade *</label>
              <select 
                value={formData.tradeType}
                onChange={e => setFormData({...formData, tradeType: e.target.value})}
                className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface"
              >
                <option value="Civil">Civil</option>
                <option value="Steel">Steel</option>
                <option value="Formwork">Formwork</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Size (Headcount) *</label>
              <input 
                required
                type="number"
                min="1"
                value={formData.size}
                onChange={e => setFormData({...formData, size: parseInt(e.target.value)})}
                className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Daily Blended Rate (₹) *</label>
            <input 
              required
              type="number"
              min="1"
              value={formData.dailyRate}
              onChange={e => setFormData({...formData, dailyRate: parseInt(e.target.value)})}
              className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
            />
          </div>
          
          <div className="mt-4 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-outline-variant rounded font-bold hover:bg-surface-variant transition-colors text-on-surface-variant text-sm">
              Cancel
            </button>
            <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              Add Crew
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

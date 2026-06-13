import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../shared/components/ToastContext';

export const AICalibrationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PILE_MEASUREMENT' | 'REBAR_CHECK' | 'PROGRESS_DETECTION'>('PILE_MEASUREMENT');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadMetadata, setUploadMetadata] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hardcode for demo
  const projectId = '294b2977-35cb-491f-9244-e9d983523101';

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3005/api/ai/reference-photos/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load reference photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUploadClick = (category: string) => {
    setUploadCategory(category);
    setUploadMetadata('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const submitUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a photo to upload', 'error');
      return;
    }
    if (activeTab === 'PILE_MEASUREMENT' && (!uploadMetadata || isNaN(Number(uploadMetadata)))) {
      showToast('Valid volume is required for Pile Measurement calibration', 'error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('File must be less than 10MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('projectId', projectId);
      formData.append('feature', activeTab);
      formData.append('category', uploadCategory);
      if (uploadMetadata) formData.append('metadata', uploadMetadata);

      const res = await fetch('http://localhost:3005/api/ai/reference-photos', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      
      showToast('Reference photo uploaded successfully', 'success');
      setIsModalOpen(false);
      await fetchPhotos();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getPhotosForTab = () => photos.filter(p => p.feature === activeTab);

  const getLatestPhoto = (category: string) => {
    return getPhotosForTab().find(p => p.category === category);
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-primary">tune</span>
            AI Calibration Center
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Upload baseline reference photos for your specific site to ensure maximum AI accuracy.
          </p>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button 
          onClick={() => setActiveTab('PILE_MEASUREMENT')}
          className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'PILE_MEASUREMENT' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
        >
          Pile Measurement
        </button>
        <button 
          onClick={() => setActiveTab('REBAR_CHECK')}
          className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'REBAR_CHECK' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
        >
          Rebar Check
        </button>
        <button 
          onClick={() => setActiveTab('PROGRESS_DETECTION')}
          className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'PROGRESS_DETECTION' ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
        >
          Progress Detection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-surface-lowest border border-outline-variant rounded p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant">Loading references...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            
            {activeTab === 'PILE_MEASUREMENT' && ['Sand', 'Aggregate', 'Stone'].map(mat => {
              const photo = getLatestPhoto(mat);
              return (
                <ReferenceCard 
                  key={mat}
                  title={`${mat} Pile Baseline`}
                  description="Upload a photo of a known quantity to set the scale."
                  photo={photo}
                  onUpload={() => handleUploadClick(mat)}
                  uploading={uploading && uploadCategory === mat}
                  metadataLabel="Calibrated Volume"
                  metadataUnit="cft"
                />
              )
            })}

            {activeTab === 'REBAR_CHECK' && ['Clean', 'Flagged'].map(mat => {
              const photo = getLatestPhoto(mat);
              return (
                <ReferenceCard 
                  key={mat}
                  title={`${mat} Rebar Baseline`}
                  description={`Upload an example of what ${mat.toLowerCase()} rebar looks like on this site.`}
                  photo={photo}
                  onUpload={() => handleUploadClick(mat)}
                  uploading={uploading && uploadCategory === mat}
                />
              )
            })}

            {activeTab === 'PROGRESS_DETECTION' && ['Zone 1 - 30%', 'Zone 1 - 65%', 'Zone 1 - 90%'].map(mat => {
              const photo = getLatestPhoto(mat);
              return (
                <ReferenceCard 
                  key={mat}
                  title={`${mat} Baseline`}
                  description="Upload visual state for this completion milestone."
                  photo={photo}
                  onUpload={() => handleUploadClick(mat)}
                  uploading={uploading && uploadCategory === mat}
                />
              )
            })}

          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/jpeg, image/png" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
          }
        }} 
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-lowest rounded-lg border border-outline-variant w-[400px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/30">
              <h2 className="font-section-heading font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                Upload {uploadCategory} Baseline
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              {activeTab === 'PILE_MEASUREMENT' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Exact Calibrated Volume (cft) *</label>
                  <p className="text-xs text-on-surface-variant mb-2">How many cubic feet of {uploadCategory.toLowerCase()} is in the photo you are uploading?</p>
                  <input 
                    required
                    type="number"
                    value={uploadMetadata}
                    onChange={e => setUploadMetadata(e.target.value)}
                    className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container bg-surface" 
                    placeholder="e.g. 150"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Reference Photo *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-primary-container/10 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-primary">
                      <span className="material-symbols-outlined text-3xl mb-1">check_circle</span>
                      <span className="text-sm font-bold truncate max-w-[250px]">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                      <span className="text-sm font-bold">Click to select photo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-3 justify-end">
                <button disabled={uploading} type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded font-bold hover:bg-surface-variant transition-colors text-on-surface-variant text-sm">
                  Cancel
                </button>
                <button 
                  disabled={uploading}
                  onClick={submitUpload} 
                  className="px-4 py-2 bg-primary text-on-primary rounded font-bold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    'Uploading...'
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">upload</span> Save Baseline</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReferenceCard = ({ title, description, photo, onUpload, uploading, metadataLabel, metadataUnit }: any) => (
  <div className="border border-outline-variant rounded-lg overflow-hidden bg-surface flex flex-col">
    <div className="p-4 border-b border-outline-variant bg-surface-lowest">
      <h3 className="font-bold text-on-surface text-lg">{title}</h3>
      <p className="text-xs text-on-surface-variant mt-1">{description}</p>
    </div>
    
    <div className="h-48 relative bg-surface-variant/30 flex items-center justify-center">
      {photo ? (
        <>
          <img src={photo.photoUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button onClick={onUpload} className="bg-primary text-on-primary px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span> Replace Photo
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">hide_image</span>
          <p className="text-sm font-bold">No baseline set</p>
          <button onClick={onUpload} disabled={uploading} className="mt-3 bg-surface-lowest border border-outline-variant text-primary px-4 py-2 rounded font-bold text-sm hover:bg-primary-container/10 transition-colors flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span> {uploading ? 'Uploading...' : 'Upload Reference'}
          </button>
        </div>
      )}
    </div>

    {photo && photo.metadata && metadataLabel && (
      <div className="p-3 bg-primary-container/20 border-t border-outline-variant flex justify-between items-center text-sm">
        <span className="font-bold text-on-surface-variant">{metadataLabel}</span>
        <span className="font-bold text-primary">{photo.metadata} {metadataUnit}</span>
      </div>
    )}
  </div>
);

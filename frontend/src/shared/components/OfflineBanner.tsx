import React from 'react';
import { useOfflineSync } from '../offline/useOfflineSync';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline) return null;

  return (
    <div className="bg-[#b91c1c] text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold shadow-md z-50 fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full">
      <span className="material-symbols-outlined text-[18px]">wifi_off</span>
      You are offline
      {pendingCount > 0 && (
        <span className="ml-2 bg-white text-[#b91c1c] px-2 py-0.5 rounded-full text-xs">
          {pendingCount} pending {pendingCount === 1 ? 'action' : 'actions'}
        </span>
      )}
    </div>
  );
};

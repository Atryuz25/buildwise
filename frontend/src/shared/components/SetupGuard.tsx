import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

interface SetupGuardProps {
  children?: React.ReactNode;
}

export const SetupGuard: React.FC<SetupGuardProps> = ({ children }) => {
  const [hasRates, setHasRates] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Assuming the user has a selected projectId stored in localStorage or a store.
    // For now, let's fetch projects and take the first one, or use a default one.
    const checkSetup = async () => {
      try {
        const projects = await apiClient.get('/api/projects');
        if (projects.data && projects.data.length > 0) {
          const projectId = projects.data[0].id;
          const { data } = await apiClient.get(`/api/projects/${projectId}/setup-status`);
          setHasRates(data.hasRates);
        } else {
          setHasRates(false);
        }
      } catch (err) {
        console.error('Setup check failed', err);
        setHasRates(false);
      }
    };
    checkSetup();
  }, []);

  if (hasRates === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!hasRates) {
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

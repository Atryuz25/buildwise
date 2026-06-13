import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from '../shared/components/Layout';
import { LoginPage } from '../features/auth/LoginPage';
import { ProjectManagerDashboard } from '../features/dashboard/ProjectManagerDashboard';
import { SiteEngineerDashboard } from '../features/dashboard/SiteEngineerDashboard';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { MaterialAuditPage } from '../features/audit/MaterialAuditPage';
import { ConcreteEstimatorPage } from '../features/material-estimator/ConcreteEstimatorPage';
import { SteelOptimizerPage } from '../features/steel-optimizer/SteelOptimizerPage';
import { WeatherRiskPage } from '../features/weather-risk/WeatherRiskPage';
import { DailySiteReportPage } from '../features/daily-report/DailySiteReportPage';
import { AttendanceTrackerPage } from '../features/attendance/AttendanceTrackerPage';
import { CrewProductivityPage } from '../features/productivity/CrewProductivityPage';
import { OutputTrackingPage } from '../features/productivity/OutputTrackingPage';
import { LabourCostAnalysisPage } from '../features/cost/LabourCostAnalysisPage';
import { DelayAttributionLogPage } from '../features/delays/DelayAttributionLogPage';
import { ContractorsManagementPage } from '../features/contractors/ContractorsManagementPage';
import { PaymentMilestoneTracker } from '../features/payments/PaymentMilestoneTracker';
import { PileMeasurementPage } from '../features/camera-ai/PileMeasurementPage';
import { AICalibrationPage } from '../features/camera-ai/AICalibrationPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const role = localStorage.getItem('userRole');
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) {
    // Redirect them to their actual dashboard if they try to access the wrong one
    if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (role === 'project_manager') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/dashboard/engineer" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/login" replace />
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute allowedRoles={['project_manager', 'admin']}><ProjectManagerDashboard /></ProtectedRoute>,
      },
      {
        path: 'dashboard/engineer',
        element: <ProtectedRoute allowedRoles={['site_engineer', 'admin']}><SiteEngineerDashboard /></ProtectedRoute>,
      },
      {
        path: 'dashboard/admin',
        element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'audit',
        element: <MaterialAuditPage />,
      },
      {
        path: 'estimator',
        element: <ConcreteEstimatorPage />,
      },
      {
        path: 'optimizer',
        element: <SteelOptimizerPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'weather',
        element: <WeatherRiskPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'daily-report',
        element: <DailySiteReportPage />,
      },
      {
        path: 'attendance',
        element: <AttendanceTrackerPage />,
      },
      {
        path: 'productivity',
        element: <CrewProductivityPage />,
      },
      {
        path: 'output-tracking',
        element: <OutputTrackingPage />,
      },
      {
        path: 'contractors',
        element: <ContractorsManagementPage />,
      },
      {
        path: 'labour-cost',
        element: <LabourCostAnalysisPage />,
      },
      {
        path: 'delays',
        element: <DelayAttributionLogPage />,
      },
      {
        path: 'payments',
        element: <PaymentMilestoneTracker />,
      },
      {
        path: 'camera-ai/pile-measurement',
        element: <PileMeasurementPage />,
      },
      {
        path: 'camera-ai/calibration',
        element: <AICalibrationPage />,
      },
    ]
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;

import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { OfflineBanner } from './OfflineBanner';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const userRole = localStorage.getItem('userRole') || 'project_manager';

  // Fetch projects for context switcher
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/projects');
      return res.data;
    }
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Set default project when loaded
  React.useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/api/notifications');
      return res.data;
    },
    refetchInterval: 30000 // Poll every 30s
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiClient.put('/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const navSections = [
    {
      title: '',
      items: [
        { name: 'Dashboard — Site Engineer', path: '/dashboard/engineer', icon: 'engineering', roles: ['site_engineer'] },
        { name: 'Dashboard — Project Manager', path: '/dashboard', icon: 'dashboard', roles: ['project_manager'] },
        { name: 'Dashboard — Admin', path: '/dashboard/admin', icon: 'admin_panel_settings', roles: ['admin'] },
        { name: 'Projects', path: '/projects', icon: 'architecture', roles: ['project_manager', 'admin'] },
      ]
    },
    {
      title: 'Materials',
      items: [
        { name: 'Concrete Estimator', path: '/estimator', icon: 'calculate', roles: ['site_engineer', 'project_manager'] },
        { name: 'Steel Optimizer', path: '/optimizer', icon: 'precision_manufacturing', roles: ['site_engineer', 'project_manager'] },
        { name: 'Material Audit', path: '/audit', icon: 'inventory_2', roles: ['site_engineer', 'project_manager'] },
        { name: 'Inventory', path: '/inventory', icon: 'warehouse', roles: ['site_engineer', 'project_manager'] },
      ]
    },
    {
      title: 'Labour & Ops',
      items: [
        { name: 'Daily Site Report', path: '/daily-report', icon: 'assignment', roles: ['site_engineer', 'project_manager'] },
        { name: 'Attendance', path: '/attendance', icon: 'co_present', roles: ['site_engineer', 'project_manager', 'admin'] },
        { name: 'Crew Productivity', path: '/productivity', icon: 'group_work', roles: ['project_manager', 'admin'] },
        { name: 'Output Tracking', path: '/output-tracking', icon: 'trending_up', roles: ['site_engineer', 'project_manager', 'admin'] },
        { name: 'Contractors', path: '/contractors', icon: 'handyman', roles: ['project_manager', 'admin'] },
        { name: 'Labour Cost', path: '/labour-cost', icon: 'payments', roles: ['project_manager', 'admin'] },
        { name: 'Delay Log', path: '/delays', icon: 'pending_actions', roles: ['project_manager', 'admin'] },
        { name: 'Payment Milestones', path: '/payments', icon: 'account_balance', roles: ['project_manager', 'admin'] },
      ]
    },
    {
      title: 'Overview',
      items: [
        { name: 'Weather Risk', path: '/weather', icon: 'cloud_sync', roles: ['site_engineer', 'project_manager'] },
        { name: 'Reports', path: '/reports', icon: 'analytics', roles: ['project_manager', 'admin'] },
      ]
    },
    {
      title: 'Camera AI',
      items: [
        { name: 'Pile Measurement', path: '/camera-ai/pile-measurement', icon: 'straighten', roles: ['site_engineer', 'project_manager', 'admin'] },
        { name: 'AI Calibration', path: '/camera-ai/calibration', icon: 'tune', roles: ['site_engineer', 'project_manager', 'admin'] },
      ]
    }
  ];

  return (
    <div className="w-full flex h-screen bg-background text-on-background font-body text-body overflow-hidden">
      {/* SideNavBar */}
      <nav className="print:hidden bg-primary dark:bg-primary-container w-sidebar-width flex-shrink-0 border-r border-outline-variant flex flex-col h-full py-4 z-50">
        <div className="px-6 mb-8 flex flex-col gap-1">
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 bg-on-primary rounded flex items-center justify-center text-primary font-bold">BW</div>
            <div className="flex flex-col w-full pr-2">
              <div className="font-page-title text-sm font-bold text-on-primary leading-tight pb-1">
                {projects?.[0]?.name || 'Skyline Towers'}
              </div>
              <div className="text-on-primary-fixed-variant text-[11px] mt-1">Construction Site</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scroll">
          {navSections.map((section, sectionIdx) => {
            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={sectionIdx} className="mb-2 flex flex-col gap-1">
                {section.title && (
                  <div className="px-6 py-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-on-primary/60">
                    {section.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = location.pathname.includes(item.path);
                  return (
                    <Link 
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-6 py-2.5 transition-colors group ${
                        isActive 
                          ? 'border-l-4 border-secondary bg-secondary-container/10 text-on-primary font-bold' 
                          : 'text-primary-fixed-dim hover:text-on-primary hover:bg-primary-container/50'
                      }`}
                    >
                      <span 
                        className={`material-symbols-outlined text-[20px] group-active:scale-[0.98] transition-all ${isActive ? 'fill-current' : ''}`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.icon}
                      </span>
                      <span className="font-card-label group-active:scale-[0.98] transition-all">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-primary-fixed-variant pt-4 pb-4">
          <div className="px-6 text-xs text-on-primary/50 font-bold">
            BuildWise v1.0.0
          </div>
        </div>
      </nav>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopNavBar */}
        <header className="print:hidden bg-surface-lowest dark:bg-surface-container-low text-primary dark:text-primary-fixed h-topbar-height border-b border-outline-variant flex justify-between items-center px-page-padding shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-page-title text-page-title font-bold text-primary">BuildWise</h1>
            <span className="text-on-surface-variant text-body">
              / {navSections.flatMap(s => s.items).find(item => location.pathname.includes(item.path))?.name || 'Overview'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-surface-variant relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifData?.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-surface-lowest border border-outline-variant shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b border-outline-variant flex justify-between items-center bg-surface-variant/20">
                  <span className="font-bold text-sm text-primary">Recent Alerts</span>
                  {notifData?.unreadCount > 0 && (
                    <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline cursor-pointer font-bold">Mark all read</button>
                  )}
                </div>
                <div className="flex flex-col max-h-[350px] overflow-y-auto">
                  {notifData?.notifications?.length > 0 ? notifData.notifications.map((n: any) => (
                    <div key={n.id} className={`p-3 border-b border-outline-variant/50 hover:bg-surface-variant/30 cursor-pointer flex gap-3 ${n.isRead ? 'opacity-60' : 'bg-primary/5'}`}>
                      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold">{n.type}</span>
                        <span className="text-xs text-on-surface-variant">{n.message}</span>
                        <span className="text-[10px] text-on-surface-variant/70">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-on-surface-variant text-sm">No recent notifications</div>
                  )}
                </div>
                <div className="p-2 text-center text-xs font-bold text-primary hover:underline cursor-pointer bg-surface-variant/10 rounded-b-lg">
                  View All Activity
                </div>
              </div>
            </div>

            <button onClick={() => { localStorage.removeItem('userRole'); navigate('/login'); }} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-surface-variant" title="Logout">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-industrial-pattern bg-surface-container-low w-full">
          <Outlet />
        </main>
      </div>
      <OfflineBanner />
    </div>
  );
};

import React from 'react';
import {
  LayoutDashboard,
  Video,
  Network,
  Cpu,
  Car,
  Users,
  BarChart3,
  AlertTriangle,
  UserCheck,
  Search,
  Bus,
  FileText,
  ShieldAlert,
  Settings,
  Radio,
  Lock,
} from 'lucide-react';
import { AppModule } from '../../types/aerovis';
import { useAerovis } from '../../context/AerovisContext';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'danger' | 'warning' | 'info' | 'primary';
}

export const Sidebar: React.FC<{ isOpenMobile: boolean; onCloseMobile: () => void }> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const { activeModule, setActiveModule, alerts, personRecords, buses, incidents } = useAerovis();
  const { canAccessModule, currentUser } = useAuth();

  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const pendingPersonsCount = personRecords.filter((p) => p.verificationStatus === 'PENDING_REVIEW' && p.isWatchlistMatch).length;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'live-monitoring',
      label: 'Live Monitoring',
      icon: <Video className="w-4 h-4" />,
    },
    {
      id: 'camera-network',
      label: 'Camera Network',
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'ai-detection',
      label: 'AI Detection',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'vehicle-intelligence',
      label: 'Vehicle Intelligence',
      icon: <Car className="w-4 h-4" />,
    },
    {
      id: 'person-intelligence',
      label: 'Person Intelligence',
      icon: <Users className="w-4 h-4" />,
      badge: pendingPersonsCount > 0 ? pendingPersonsCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'missing-persons',
      label: 'Missing Persons',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'traffic-analytics',
      label: 'Traffic Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'incident-management',
      label: 'Incident Management',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'investigation-centre',
      label: 'Investigation Centre',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'bus-network',
      label: 'Bus Camera Network',
      icon: <Bus className="w-4 h-4" />,
      badge: buses.filter((b) => b.status === 'ACTIVE').length,
      badgeVariant: 'info',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelect = (moduleId: AppModule) => {
    if (!canAccessModule(moduleId)) return;
    setActiveModule(moduleId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1526] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#07101e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">AEROVIS</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded font-mono font-semibold">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                City Visual Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Modules List - Fixed Height & Scrollable internally */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Command Center
          </div>

          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            const hasAccess = canAccessModule(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                disabled={!hasAccess}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
                    : hasAccess
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`${
                      isActive
                        ? 'text-white'
                        : hasAccess
                        ? 'text-slate-400 group-hover:text-blue-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!hasAccess && <Lock className="w-3 h-3 text-slate-600" />}
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                        item.badgeVariant === 'danger'
                          ? 'bg-rose-500 text-white'
                          : item.badgeVariant === 'warning'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : item.badgeVariant === 'info'
                          ? 'bg-indigo-500/40 text-indigo-300'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Operator Status Card */}
        <div className="p-3 border-t border-slate-800/80 bg-[#07101e]/80">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  {currentUser.role.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                {currentUser.badgeNumber}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

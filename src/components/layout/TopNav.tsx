import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Menu,
  ChevronDown,
  User as UserIcon,
  Shield,
  Database,
  ExternalLink,
  Volume2,
  VolumeX,
  X,
  Key,
} from 'lucide-react';
import { useAerovis } from '../../context/AerovisContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/aerovis';
import { Badge } from '../common/Badge';

export const TopNav: React.FC<{ onToggleMobileSidebar: () => void }> = ({
  onToggleMobileSidebar,
}) => {
  const {
    cameras,
    alerts,
    supabaseStatus,
    settings,
    updateSettings,
    setIsGlobalSearchOpen,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    acknowledgeAlert,
    resolveAlert,
    clearAllAlerts,
    setSelectedIncidentId,
    setActiveModule,
    isLoading,
    reloadData,
    dataSource,
  } = useAerovis();

  const { currentUser, switchRole, logout, usersList, setIsAuthModalOpen } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE').length;
  const unackAlerts = alerts.filter((a) => !a.acknowledged);
  const criticalAlertsCount = alerts.filter((a) => a.type === 'CRITICAL' && !a.resolved).length;

  const roles: UserRole[] = [
    'SUPER_ADMIN',
    'ADMINISTRATOR',
    'CONTROL_ROOM_OPERATOR',
    'TRAFFIC_ANALYST',
    'INVESTIGATION_OFFICER',
    'READ_ONLY_VIEWER',
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/90 text-slate-500 rounded-lg border border-slate-200/90 text-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-600 font-medium">
              Global search cameras, license plates, incidents, cases...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Operational Telemetry & Profile */}
      <div className="flex items-center gap-3 md:gap-4 ml-4">
        {/* Active Camera Count */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500">CAMS:</span>
          <span className="font-bold text-slate-800">
            {onlineCameras}/{totalCameras}
          </span>
          <span className="text-emerald-600 font-semibold">
            ({Math.round((onlineCameras / totalCameras) * 100)}%)
          </span>
        </div>

        {/* System Connection Status & Interactive Sync */}
        <button
          onClick={() => reloadData()}
          disabled={isLoading}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer transition-colors"
          title="Click to refresh & sync with Supabase PostgreSQL"
        >
          <Database
            className={`w-3.5 h-3.5 ${
              dataSource === 'supabase' ? 'text-emerald-600' : 'text-blue-600'
            } ${isLoading ? 'animate-spin' : ''}`}
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold leading-none">
              Backend Link {isLoading ? '• Syncing' : ''}
            </span>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">
              {dataSource === 'supabase' ? 'Supabase Live' : 'Local State Engine'}
            </span>
          </div>
        </button>

        {/* Live Date and Time */}
        <div className="hidden xl:flex flex-col text-right font-mono text-xs">
          <span className="text-[10px] text-slate-400 uppercase font-semibold leading-none">
            Universal UTC
          </span>
          <span className="font-semibold text-slate-800 mt-0.5">{currentTime}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => updateSettings({ enableSoundAlerts: !settings.enableSoundAlerts })}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={settings.enableSoundAlerts ? 'Sound Alerts: On' : 'Sound Alerts: Muted'}
        >
          {settings.enableSoundAlerts ? (
            <Volume2 className="w-4 h-4 text-blue-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationDrawerOpen(!isNotificationDrawerOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Notification center"
          >
            <Bell className="w-5 h-5" />
            {unackAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
            )}
          </button>

          {/* Flyout Notifications Drawer */}
          {isNotificationDrawerOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Dispatch Alert Center
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {unackAlerts.length} unacknowledged events
                  </p>
                </div>
                {unackAlerts.length > 0 && (
                  <button
                    onClick={clearAllAlerts}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Acknowledge All
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 px-2 py-1">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active incident alerts
                  </div>
                ) : (
                  alerts.slice(0, 10).map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-lg my-1 transition-colors ${
                        alt.acknowledged ? 'bg-white opacity-70' : 'bg-slate-50 border border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alt.type === 'CRITICAL'
                                ? 'bg-rose-500 animate-pulse'
                                : alt.type === 'WARNING'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900">
                            {alt.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alt.timestamp.split(' ')[1] || alt.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">
                        {alt.description}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100/80">
                        <span className="text-[10px] font-mono font-medium text-slate-500">
                          {alt.category}
                        </span>

                        <div className="flex items-center gap-2">
                          {!alt.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alt.id)}
                              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                            >
                              Ack
                            </button>
                          )}
                          {!alt.resolved ? (
                            <button
                              onClick={() => resolveAlert(alt.id)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-blue-600 font-mono font-semibold leading-tight">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">BADGE: {currentUser.badgeNumber}</span>
                  <Badge variant="primary" size="sm">
                    {currentUser.role}
                  </Badge>
                </div>
              </div>

              {/* Fast Role Switcher (For Evaluation and RBAC Testing) */}
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1.5">
                  Simulate Role Access (RBAC)
                </p>
                <div className="space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        currentUser.role === r
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r.replace(/_/g, ' ')}</span>
                      {currentUser.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-2 pt-1 pb-1 border-b border-slate-100">
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span>Supabase Auth Login / Register</span>
                  <Key className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded font-medium cursor-pointer transition-colors"
                >
                  Log Out / Switch to Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

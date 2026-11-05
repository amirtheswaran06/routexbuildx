import React, { useState } from 'react';
import {
  Video,
  Camera,
  Car,
  AlertTriangle,
  Cpu,
  Bus,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Radio,
  CheckCircle,
  Eye,
  Filter,
  LayoutDashboard,
  Network,
  Users,
  UserCheck,
  BarChart3,
  Search,
  FileText,
  ArrowRight,
  MessageSquarePlus,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { GisMap } from '../../map/GisMap';
import { Badge } from '../../common/Badge';
import { VideoStreamPlayer } from '../../common/VideoStreamPlayer';
import { Modal } from '../../common/Modal';
import { Camera as CameraType, Incident } from '../../../types/aerovis';

const moduleAccent: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', cyan: 'bg-cyan-50 text-cyan-600',
  indigo: 'bg-indigo-50 text-indigo-600', violet: 'bg-violet-50 text-violet-600',
  sky: 'bg-sky-50 text-sky-600', purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600', slate: 'bg-slate-100 text-slate-600', teal: 'bg-teal-50 text-teal-600',
};

export const OverviewModule: React.FC = () => {
  const { canAccessModule } = useAuth();
  const {
    cameras,
    detections,
    vehicleRecords,
    incidents,
    alerts,
    buses,
    setActiveModule,
    setSelectedCameraId,
    setSelectedIncidentId,
    personRecords,
    generateDemoComplaint,
    dataSource,
  } = useAerovis();

  const [inspectingCamera, setInspectingCamera] = useState<CameraType | null>(null);
  const [isGeneratingComplaint, setIsGeneratingComplaint] = useState(false);

  const handleGenerateComplaint = async () => {
    setIsGeneratingComplaint(true);
    try {
      await generateDemoComplaint();
    } finally {
      setIsGeneratingComplaint(false);
    }
  };

  // Key KPI stats derived dynamically from backend records
  const totalCameras = cameras.length;
  const activeCameras = cameras.filter((c) => c.status === 'ONLINE').length;
  const offlineCameras = cameras.filter((c) => c.status === 'OFFLINE').length;
  const activeDetectionsToday = detections.length;
  const vehiclesToday = vehicleRecords.length;
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED'
  ).length;
  const criticalAlerts = alerts.filter((a) => a.type === 'CRITICAL' && !a.resolved).length;
  const busesOnline = buses.filter((b) => b.status === 'ACTIVE').length;
  const modules = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, detail: 'City operations at a glance', count: null, color: 'blue' },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: Video, detail: 'Watch live camera feeds', count: activeCameras, color: 'cyan' },
    { id: 'camera-network', label: 'Camera Network', icon: Network, detail: 'Manage connected cameras', count: totalCameras, color: 'indigo' },
    { id: 'ai-detection', label: 'AI Detection', icon: Cpu, detail: 'Review real-time detections', count: activeDetectionsToday, color: 'violet' },
    { id: 'vehicle-intelligence', label: 'Vehicle Intelligence', icon: Car, detail: 'Search vehicle activity', count: vehiclesToday, color: 'sky' },
    { id: 'person-intelligence', label: 'Person Intelligence', icon: Users, detail: 'Review person of interest matches', count: personRecords.length, color: 'purple' },
    { id: 'missing-persons', label: 'Missing Persons', icon: UserCheck, detail: 'Manage missing person cases', count: personRecords.filter((p) => p.isWatchlistMatch).length, color: 'amber' },
    { id: 'traffic-analytics', label: 'Traffic Analytics', icon: BarChart3, detail: 'Explore traffic patterns', count: null, color: 'emerald' },
    { id: 'incident-management', label: 'Incident Management', icon: AlertTriangle, detail: 'Track open incidents', count: activeIncidents, color: 'rose' },
    { id: 'investigation-centre', label: 'Investigation Centre', icon: Search, detail: 'Build and review investigations', count: null, color: 'slate' },
    { id: 'bus-network', label: 'Bus Camera Network', icon: Bus, detail: 'Monitor connected buses', count: busesOnline, color: 'blue' },
    { id: 'reports', label: 'Reports', icon: FileText, detail: 'View and export reports', count: null, color: 'teal' },
  ] as const;

  const handleCameraSelect = (cam: CameraType) => {
    setInspectingCamera(cam);
  };

  const handleIncidentSelect = (inc: Incident) => {
    setSelectedIncidentId(inc.id);
    setActiveModule('incident-management');
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1">
      <section className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">AEROVIS · OPERATIONS</p>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Command Center</h2>
            <p className="mt-0.5 text-xs text-slate-500">Choose a workspace to open its live operational view.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{modules.length} workspaces</span>
            {canAccessModule('incident-management') && (
              <button
                type="button"
                onClick={handleGenerateComplaint}
                disabled={isGeneratingComplaint || dataSource === 'supabase'}
                title={dataSource === 'supabase' ? 'Demo generation is paused while live data is connected' : 'Create a demo public complaint with a linked alert and AI detection'}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {isGeneratingComplaint ? 'Generating…' : 'Generate complaint'}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ id, label, icon: Icon, detail, count, color }) => {
            const allowed = canAccessModule(id);
            const selected = id === 'overview';
            return (
              <button
                key={id}
                type="button"
                disabled={!allowed || selected}
                onClick={() => setActiveModule(id)}
                className={`group flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? 'border-blue-200 bg-blue-50/80 ring-1 ring-blue-100' : allowed ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md' : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-blue-600 text-white' : moduleAccent[color]}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-slate-800">{label}</span>
                    {count !== null && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${id === 'incident-management' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-slate-500">{detail}</span>
                </span>
                {!selected && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />}
              </button>
            );
          })}
        </div>
      </section>
      {/* Top Metric Cards Bar */}
      <div className="order-2 grid grid-cols-2 gap-2 shrink-0 sm:grid-cols-4 xl:grid-cols-8">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Connected</span>
            <Video className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {totalCameras}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">100% Monitored</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Active Cams</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {activeCameras}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {Math.round((activeCameras / totalCameras) * 100)}% Online
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Offline Cams</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {offlineCameras}
          </div>
          <span className="text-[10px] text-rose-500 font-mono">Requires Ping</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">AI Detections</span>
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {activeDetectionsToday}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">Edge Vision</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Vehicles Logged</span>
            <Car className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {vehiclesToday}
          </div>
          <span className="text-[10px] text-blue-600 font-mono">ANPR Active</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Incidents</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {activeIncidents}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">In Progress</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Active Alerts</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 tracking-tight">
            {criticalAlerts}
          </div>
          <span className="text-[10px] text-rose-500 font-mono">Priority 1</span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Bus Fleet</span>
            <Bus className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {busesOnline}
          </div>
          <span className="text-[10px] text-indigo-600 font-mono">GPS Linked</span>
        </div>
      </div>

      {/* Main Command Split: Left GIS Map (65%) | Right Live Feeds & Alert Center (35%) */}
      <div className="order-1 grid shrink-0 grid-cols-1 gap-3 min-h-[620px] lg:grid-cols-12">
        {/* Left: City GIS Map */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                City-Wide Geospatial Intelligence Surface
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                Showing {cameras.length} Nodes & {buses.length} Mobile Bus Units
              </span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[300px]">
            <GisMap
              cameras={cameras}
              buses={buses}
              incidents={incidents}
              onSelectCamera={handleCameraSelect}
              onSelectIncident={handleIncidentSelect}
            />
          </div>
        </div>

        {/* Right: Operational Panels */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Real-Time Alerts Panel */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                  Priority Alerts ({alerts.filter((a) => !a.resolved).length})
                </h3>
              </div>
              <button
                onClick={() => setActiveModule('incident-management')}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Incidents</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    alert.type === 'CRITICAL'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-bold leading-tight">{alert.title}</span>
                    <Badge variant={alert.type === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alert.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">{alert.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{alert.cameraCode || 'SYSTEM GATEWAY'}</span>
                    <span>{alert.timestamp.split(' ')[1] || alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Detection Stream Feed */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                  Live AI Computer Vision Feed
                </h3>
              </div>
              <button
                onClick={() => setActiveModule('ai-detection')}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
              {detections.slice(0, 5).map((det) => (
                <div key={det.id} className="py-2 px-2 hover:bg-slate-50 rounded flex items-center gap-3">
                  <div className="w-12 h-10 rounded bg-slate-900 shrink-0 overflow-hidden">
                    <img
                      src={det.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80'}
                      alt={det.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {det.label}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold shrink-0">
                        {(det.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>{det.cameraCode}</span>
                      <span>{det.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Live Stream Inspector Modal */}
      {inspectingCamera && (
        <Modal
          isOpen={!!inspectingCamera}
          onClose={() => setInspectingCamera(null)}
          title={`Live Optical Stream: ${inspectingCamera.code} - ${inspectingCamera.name}`}
          subtitle={`${inspectingCamera.locationName} • Zone: ${inspectingCamera.zone} • IP: ${inspectingCamera.ipAddress}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <VideoStreamPlayer
              camera={inspectingCamera}
              detections={detections.filter((d) => d.cameraId === inspectingCamera.id)}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">COORDINATES</span>
                <span className="text-slate-800 font-bold">
                  {inspectingCamera.latitude.toFixed(4)}, {inspectingCamera.longitude.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">RESOLUTION / FPS</span>
                <span className="text-slate-800 font-bold">
                  {inspectingCamera.resolution} @ {inspectingCamera.fps} FPS
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">COVERAGE ANGLE</span>
                <span className="text-slate-800 font-bold">
                  {inspectingCamera.coverageAngle}° {inspectingCamera.direction}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PROTOCOL</span>
                <span className="text-blue-600 font-bold">WebRTC Low Latency</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


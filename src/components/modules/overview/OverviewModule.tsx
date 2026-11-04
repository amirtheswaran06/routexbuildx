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
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { GisMap } from '../../map/GisMap';
import { Badge } from '../../common/Badge';
import { VideoStreamPlayer } from '../../common/VideoStreamPlayer';
import { Modal } from '../../common/Modal';
import { Camera as CameraType, Incident } from '../../../types/aerovis';

export const OverviewModule: React.FC = () => {
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
  } = useAerovis();

  const [inspectingCamera, setInspectingCamera] = useState<CameraType | null>(null);

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

  const handleCameraSelect = (cam: CameraType) => {
    setInspectingCamera(cam);
  };

  const handleIncidentSelect = (inc: Incident) => {
    setSelectedIncidentId(inc.id);
    setActiveModule('incident-management');
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
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

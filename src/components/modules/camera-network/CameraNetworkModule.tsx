import React, { useState } from 'react';
import {
  Network,
  Plus,
  Search,
  RefreshCw,
  Video,
  Edit2,
  Trash2,
  Activity,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { CameraModal } from './CameraModal';
import { Camera } from '../../../types/aerovis';

export const CameraNetworkModule: React.FC = () => {
  const { cameras, addCamera, updateCamera, deleteCamera, pingCamera, setSelectedCameraId, setActiveModule } =
    useAerovis();
  const { canPerformAction } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [pingingId, setPingingId] = useState<string | null>(null);

  const zones = Array.from(new Set(cameras.map((c) => c.zone)));

  const filtered = cameras.filter((cam) => {
    const matchesSearch =
      cam.code.toLowerCase().includes(search.toLowerCase()) ||
      cam.name.toLowerCase().includes(search.toLowerCase()) ||
      cam.locationName.toLowerCase().includes(search.toLowerCase()) ||
      cam.ipAddress.includes(search);
    const matchesZone = selectedZone === 'ALL' || cam.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const handlePing = async (id: string) => {
    setPingingId(id);
    await pingCamera(id);
    setPingingId(null);
  };

  const handleSaveCamera = (data: any) => {
    if (editingCamera) {
      updateCamera(editingCamera.id, data);
    } else {
      addCamera(data);
    }
  };

  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const degradedCount = cameras.filter((c) => c.status === 'DEGRADED').length;
  const offlineCount = cameras.filter((c) => c.status === 'OFFLINE').length;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            <span>Camera Network Topology & Node Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time IP camera registry, RTSP gateway links, GIS geocodes and zone distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canPerformAction('CREATE') && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingCamera(null);
                setIsModalOpen(true);
              }}
            >
              Register Camera
            </Button>
          )}
        </div>
      </div>

      {/* Network Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Nodes</span>
            <div className="text-lg font-bold text-slate-900">{cameras.length} Units</div>
          </div>
          <Video className="w-5 h-5 text-blue-600 opacity-80" />
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-600">Online & Streaming</span>
            <div className="text-lg font-bold text-emerald-700">{onlineCount} Active</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600 opacity-80" />
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-amber-600">Degraded / Jitter</span>
            <div className="text-lg font-bold text-amber-700">{degradedCount} Degraded</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-600 opacity-80" />
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-rose-600">Offline Transceivers</span>
            <div className="text-lg font-bold text-rose-700">{offlineCount} Down</div>
          </div>
          <Activity className="w-5 h-5 text-rose-600 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cameras by code, IP address, street intersection..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All City Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Panel - Independent Scroll */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 text-slate-500 font-mono text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-3">Camera Code</th>
                <th className="py-2.5 px-3">Name & Location</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">GIS Coordinates</th>
                <th className="py-2.5 px-3">Stream Spec</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((cam) => {
                const isPinging = pingingId === cam.id;
                return (
                  <tr key={cam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {cam.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{cam.name}</div>
                      <div className="text-[11px] text-slate-400">{cam.locationName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          cam.type === 'ANPR'
                            ? 'primary'
                            : cam.type === 'BUS'
                            ? 'info'
                            : cam.type === 'TRAFFIC'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {cam.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{cam.zone}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{cam.ipAddress}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {cam.resolution} @ {cam.fps}fps
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          cam.status === 'ONLINE'
                            ? 'success'
                            : cam.status === 'DEGRADED'
                            ? 'warning'
                            : 'danger'
                        }
                        pulse={cam.status === 'ONLINE'}
                      >
                        {cam.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {cam.lastPing}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePing(cam.id)}
                          disabled={isPinging}
                          className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Ping Hardware Transceiver"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-blue-600' : ''}`}
                          />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCameraId(cam.id);
                            setActiveModule('live-monitoring');
                          }}
                          className="p-1 hover:bg-slate-200/60 rounded text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          title="Inspect Live Stream"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>

                        {canPerformAction('EDIT') && (
                          <button
                            onClick={() => {
                              setEditingCamera(cam);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit Camera"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canPerformAction('DELETE') && (
                          <button
                            onClick={() => {
                              if (confirm(`Decommission camera ${cam.code}?`)) {
                                deleteCamera(cam.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Decommission Camera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera Registration & Edit Modal */}
      <CameraModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCamera(null);
        }}
        onSave={handleSaveCamera}
        initialCamera={editingCamera}
      />
    </div>
  );
};

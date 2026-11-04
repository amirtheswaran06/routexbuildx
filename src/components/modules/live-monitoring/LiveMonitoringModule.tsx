import React, { useState } from 'react';
import {
  Grid,
  Square,
  LayoutGrid,
  Filter,
  Search,
  Video,
  Radio,
  Sliders,
  Maximize2,
  RefreshCw,
  Camera as CameraIcon,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { VideoStreamPlayer } from '../../common/VideoStreamPlayer';
import { Badge } from '../../common/Badge';
import { Camera, CameraType } from '../../../types/aerovis';

export const LiveMonitoringModule: React.FC = () => {
  const { cameras, detections, selectedCameraId, setSelectedCameraId } = useAerovis();

  const [layoutMode, setLayoutMode] = useState<'single' | '2x2' | '3x3'>('2x2');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [capturedSnaps, setCapturedSnaps] = useState<{ id: string; url: string; time: string }[]>([]);

  // Unique zones from cameras
  const zones = Array.from(new Set(cameras.map((c) => c.zone)));

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || cam.type === selectedType;
    const matchesZone = selectedZone === 'ALL' || cam.zone === selectedZone;
    return matchesSearch && matchesType && matchesZone;
  });

  const activeSingleCamera =
    cameras.find((c) => c.id === selectedCameraId) || filteredCameras[0] || cameras[0];

  const handleCapture = (dataUrl: string) => {
    setCapturedSnaps((prev) => [
      { id: `snap-${Date.now()}`, url: dataUrl, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 5),
    ]);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Filter & Layout Control Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cameras by code, name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Types ({cameras.length})</option>
            <option value="CCTV">CCTV Surveillance</option>
            <option value="ANPR">ANPR Plate Scanners</option>
            <option value="TRAFFIC">Traffic Junctions</option>
            <option value="BUS">Bus On-board Units</option>
          </select>

          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All City Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Mode Selector (1x1, 2x2, 3x3) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setLayoutMode('single')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              layoutMode === 'single'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single (1x1)</span>
          </button>
          <button
            onClick={() => setLayoutMode('2x2')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              layoutMode === '2x2'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Quad (2x2)</span>
          </button>
          <button
            onClick={() => setLayoutMode('3x3')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              layoutMode === '3x3'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid (3x3)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Active Video Feed Grid (9 Cols in Quad/Single or 12 Cols) */}
        <div className="lg:col-span-9 h-full flex flex-col min-h-0">
          {layoutMode === 'single' ? (
            <div className="h-full flex flex-col">
              <VideoStreamPlayer
                camera={activeSingleCamera}
                detections={detections.filter((d) => d.cameraId === activeSingleCamera.id)}
                onCaptureSnapshot={handleCapture}
              />
            </div>
          ) : layoutMode === '2x2' ? (
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-1">
              {filteredCameras.slice(0, 4).map((cam) => (
                <VideoStreamPlayer
                  key={cam.id}
                  camera={cam}
                  detections={detections.filter((d) => d.cameraId === cam.id)}
                  compact
                  onSelectCamera={() => {
                    setSelectedCameraId(cam.id);
                    setLayoutMode('single');
                  }}
                  onCaptureSnapshot={handleCapture}
                />
              ))}
            </div>
          ) : (
            <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-2 overflow-y-auto pr-1">
              {filteredCameras.slice(0, 9).map((cam) => (
                <VideoStreamPlayer
                  key={cam.id}
                  camera={cam}
                  detections={detections.filter((d) => d.cameraId === cam.id)}
                  compact
                  onSelectCamera={() => {
                    setSelectedCameraId(cam.id);
                    setLayoutMode('single');
                  }}
                  onCaptureSnapshot={handleCapture}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Camera Directory & Captured Forensics (3 Cols) */}
        <div className="lg:col-span-3 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Active Directory List */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
            <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase text-slate-800">
                Camera Stream Index ({filteredCameras.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">LIVE RTSP</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
              {filteredCameras.map((cam) => {
                const isSelected = cam.id === (activeSingleCamera?.id || selectedCameraId);
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setSelectedCameraId(cam.id);
                      if (layoutMode === 'single') {
                        // Already in single view
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {cam.code}
                        </span>
                        <Badge
                          variant={
                            cam.type === 'ANPR'
                              ? 'primary'
                              : cam.type === 'BUS'
                              ? 'info'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {cam.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{cam.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{cam.zone}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          cam.status === 'ONLINE'
                            ? 'bg-emerald-500'
                            : cam.status === 'DEGRADED'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forensic Snapshots Captured */}
          <div className="h-44 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs shrink-0">
            <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase text-slate-800">
                Forensic Captures ({capturedSnaps.length})
              </span>
              <CameraIcon className="w-3.5 h-3.5 text-blue-600" />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {capturedSnaps.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center p-4">
                  Click 'Capture Frame' in any camera toolbar to save instant forensic snapshots.
                </div>
              ) : (
                capturedSnaps.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-[11px] text-slate-700">Frame @ {snap.time}</span>
                    <a
                      href={snap.url}
                      download={`aerovis_snapshot_${snap.time}.jpg`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-[11px]"
                    >
                      Export
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

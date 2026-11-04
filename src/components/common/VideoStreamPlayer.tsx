import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera as CameraIcon,
  Shield,
  Activity,
  Layers,
  Sliders,
  Radio,
  Eye,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';
import { Badge } from './Badge';
import { Camera as CameraType, Detection } from '../../types/aerovis';

interface VideoStreamPlayerProps {
  camera: CameraType;
  detections?: Detection[];
  onCaptureSnapshot?: (dataUrl: string) => void;
  compact?: boolean;
  onSelectCamera?: () => void;
}

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = ({
  camera,
  detections = [],
  onCaptureSnapshot,
  compact = false,
  onSelectCamera,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [isDemoStream, setIsDemoStream] = useState<boolean>(camera.isDemo || false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [fpsCounter, setFpsCounter] = useState<number>(camera.fps);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('en-US', { hour12: false })}.${Math.floor(
          now.getMilliseconds() / 100
        )}`
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 100);
    return () => clearInterval(interval);
  }, []);

  // Slight jitter for realistic FPS indicator
  useEffect(() => {
    if (camera.status !== 'ONLINE') {
      setFpsCounter(0);
      return;
    }
    const fpsTimer = setInterval(() => {
      const variance = (Math.random() - 0.5) * 1.5;
      setFpsCounter(Math.max(1, Math.round(camera.fps + variance)));
    }, 2000);
    return () => clearInterval(fpsTimer);
  }, [camera.status, camera.fps]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, z - 0.25));
  const handleResetPTZ = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const takeSnapshot = () => {
    if (!onCaptureSnapshot) return;
    // Capture canvas representation with watermark
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text info
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`AEROVIS FORENSIC SNAPSHOT // ${camera.code}`, 30, 50);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '16px monospace';
    ctx.fillText(`CAMERA: ${camera.name} (${camera.type})`, 30, 80);
    ctx.fillText(`ZONE: ${camera.zone} | IP: ${camera.ipAddress}`, 30, 105);
    ctx.fillText(`TIMESTAMP: ${currentTime} UTC`, 30, 130);
    ctx.fillText(`GPS: [${camera.latitude.toFixed(6)}, ${camera.longitude.toFixed(6)}]`, 30, 155);

    const dataUrl = canvas.toDataURL('image/jpeg');
    onCaptureSnapshot(dataUrl);
  };

  const isOnline = camera.status === 'ONLINE';

  return (
    <div
      ref={containerRef}
      className={`relative group bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col select-none transition-all ${
        compact ? 'h-48' : 'h-full min-h-[360px]'
      }`}
    >
      {/* Stream Video Window */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* Actual Video or High-Fidelity Streaming Feed */}
        {isOnline ? (
          <div
            className="w-full h-full relative overflow-hidden transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            }}
          >
            <img
              src={camera.streamUrl}
              alt={camera.name}
              className="w-full h-full object-cover scanline-feed opacity-90"
              loading="lazy"
            />

            {/* AI Bounding Box Overlays */}
            {showOverlays &&
              detections.map((det) => {
                if (!det.bbox) return null;
                const [x, y, w, h] = det.bbox;
                const isViolation =
                  det.category === 'TRAFFIC_VIOLATION' ||
                  det.category === 'ACCIDENT' ||
                  det.category === 'ROAD_HAZARD';
                const isWatchlist = det.label.includes('WATCHLIST');

                return (
                  <div
                    key={det.id}
                    className={`absolute border-2 transition-all duration-300 pointer-events-none ${
                      isWatchlist
                        ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-400/50'
                        : isViolation
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-emerald-400 bg-emerald-400/10'
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                    }}
                  >
                    <div
                      className={`absolute -top-6 left-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 ${
                        isWatchlist
                          ? 'bg-rose-600 text-white'
                          : isViolation
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span>{det.label}</span>
                      <span className="opacity-80">{(det.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* Offline / Disconnected State */
          <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-300">
              Camera Feed Disconnected
            </p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {camera.status === 'MAINTENANCE'
                ? 'Scheduled hardware calibration in progress.'
                : 'Network ping timed out. RTSP/WebRTC link unreachable.'}
            </p>
            <span className="mt-3 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-400">
              {camera.ipAddress}
            </span>
          </div>
        )}

        {/* Top Floating HUD Information */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider ${
                isOnline
                  ? 'bg-red-600/90 text-white shadow-sm shadow-red-500/30'
                  : 'bg-slate-800/90 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </span>

            <span className="bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 text-slate-200 text-xs px-2 py-0.5 rounded font-mono font-semibold">
              {camera.code}
            </span>

            {/* Mode: Demo vs Real Feed badge */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                isDemoStream
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
              }`}
            >
              {isDemoStream ? 'Demo Mode' : 'Direct RTSP/WebRTC'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700/60">
              {fpsCounter} FPS • {camera.resolution}
            </span>
          </div>
        </div>

        {/* Bottom Floating Telemetry Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="bg-slate-950/85 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center gap-3">
            <span>{currentTime}</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">{camera.name}</span>
            <span className="text-slate-600">|</span>
            <span>AZ: {camera.direction}</span>
          </div>

          {zoomLevel > 1 && (
            <div className="bg-blue-600/90 text-white text-[11px] font-mono px-2 py-0.5 rounded shadow">
              {zoomLevel.toFixed(1)}x ZOOM
            </div>
          )}
        </div>
      </div>

      {/* Control Toolbar (Visible on hover or standard in non-compact mode) */}
      {!compact && (
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="h-4 w-px bg-slate-800" />

            {/* PTZ Digital Controls */}
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Digital Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Digital Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetPTZ}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-800" />

            {/* AI Overlays Toggle */}
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono text-[11px] cursor-pointer transition-colors ${
                showOverlays
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Toggle AI Object Detection Overlays"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>AI HUD</span>
            </button>

            {/* Demo vs Real Stream Toggle */}
            <button
              onClick={() => setIsDemoStream(!isDemoStream)}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono text-[11px] cursor-pointer transition-colors ${
                isDemoStream
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Toggle Demonstration Benchmark vs Live Gateway Feed"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isDemoStream ? 'Demo' : 'Live Gateway'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onCaptureSnapshot && (
              <button
                onClick={takeSnapshot}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CameraIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Capture Frame</span>
              </button>
            )}

            {onSelectCamera && (
              <button
                onClick={onSelectCamera}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Inspect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

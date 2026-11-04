import React, { useState } from 'react';
import {
  Bus as BusIcon,
  Video,
  Navigation,
  Compass,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { VideoStreamPlayer } from '../../common/VideoStreamPlayer';
import { GisMap } from '../../map/GisMap';
import { Bus, Camera } from '../../../types/aerovis';

export const BusNetworkModule: React.FC = () => {
  const { buses, cameras, addIncident, setActiveModule } = useAerovis();

  const [selectedBus, setSelectedBus] = useState<Bus>(buses[0]);

  // Find cameras mounted on this bus
  const mountedCameras = cameras.filter(
    (c) => c.busId === selectedBus.id || selectedBus.connectedCameras.includes(c.code)
  );

  const activeMountedCam =
    mountedCameras[0] ||
    cameras.find((c) => c.type === 'BUS') ||
    cameras[0];

  const handleReportBusIncident = () => {
    addIncident({
      title: `Bus Transit Platform Alert: ${selectedBus.busNumber} (${selectedBus.routeCode})`,
      category: 'SECURITY_ALERT',
      priority: 'HIGH',
      status: 'NEW',
      locationName: `Mobile Transit Vector @ Lat ${selectedBus.currentLat.toFixed(4)}, Lng ${selectedBus.currentLng.toFixed(4)}`,
      latitude: selectedBus.currentLat,
      longitude: selectedBus.currentLng,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      cameraId: activeMountedCam?.id,
      cameraCode: activeMountedCam?.code,
      description: `Transit operator requested dispatch attention for moving platform unit ${selectedBus.busNumber} driven by ${selectedBus.driverName}. Speed: ${selectedBus.speed} km/h, Heading: ${selectedBus.heading}°.`,
    });
    alert(`Incident logged for ${selectedBus.busNumber}. Dispatched to Control Room.`);
    setActiveModule('incident-management');
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Fleet Status Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BusIcon className="w-4 h-4 text-indigo-600" />
            <span>Public Transit Mobile Edge Camera Fleet Network</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buses serving as dynamic moving surveillance platforms with live telemetry, GPS vectors and edge recognition.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle className="w-4 h-4" />}
            onClick={handleReportBusIncident}
          >
            Trigger Platform Incident
          </Button>
        </div>
      </div>

      {/* Main Workspace Frame (3-Column Split: Bus Fleet Index 3 Cols | Mobile Feed 5 Cols | GIS Map 4 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Bus Fleet Roster (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800">
              Active Transit Units ({buses.length})
            </span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">GPS SYNC</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {buses.map((bus) => {
              const isSelected = selectedBus.id === bus.id;
              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBus(bus)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      {bus.busNumber}
                    </span>
                    <Badge variant={bus.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {bus.status}
                    </Badge>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 truncate">{bus.routeName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{bus.routeCode} • {bus.driverName}</p>

                  <div className="mt-2 text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded flex items-center justify-between">
                    <span className="text-blue-600 font-bold">{bus.speed} km/h</span>
                    <span>HDG: {bus.heading}°</span>
                    <span>{bus.connectedCameras.length || 2} Cams</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle: On-Board Mobile Camera Stream & Telemetry (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold font-mono uppercase text-slate-800">
                {selectedBus.busNumber} On-Board Optical Stream
              </span>
              <p className="text-[11px] text-slate-500">Forward Roadway & Transit Lane Sensor</p>
            </div>
            <Badge variant="info">Mobile Edge Node</Badge>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-[240px]">
              <VideoStreamPlayer camera={activeMountedCam} />
            </div>

            {/* Platform Telemetry Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block">CURRENT SPEED</span>
                <span className="font-bold text-blue-600">{selectedBus.speed} km/h</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">HEADING VECTOR</span>
                <span className="font-bold text-slate-800">{selectedBus.heading}° North-East</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">LICENSE PLATE</span>
                <span className="font-bold text-slate-800">{selectedBus.licensePlate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">LAST GPS FIX</span>
                <span className="font-bold text-emerald-600">{selectedBus.lastGpsUpdate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time GIS Route Tracking Map (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Transit Route GPS Position</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{selectedBus.routeCode}</span>
          </div>

          <div className="flex-1 relative min-h-[250px]">
            <GisMap
              buses={[selectedBus]}
              center={[selectedBus.currentLat, selectedBus.currentLng]}
              zoom={14}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

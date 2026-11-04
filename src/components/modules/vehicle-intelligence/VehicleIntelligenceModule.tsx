import React, { useState } from 'react';
import {
  Car,
  Search,
  MapPin,
  Clock,
  Compass,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Navigation,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { GisMap } from '../../map/GisMap';
import { VehicleRecord } from '../../../types/aerovis';

export const VehicleIntelligenceModule: React.FC = () => {
  const {
    vehicleRecords,
    cameras,
    selectedVehiclePlate,
    setSelectedVehiclePlate,
    logAudit,
    setActiveModule,
    setSelectedIncidentId,
    addIncident,
  } = useAerovis();

  const { canPerformAction, currentUser } = useAuth();

  const [searchPlate, setSearchPlate] = useState<string>(selectedVehiclePlate || '');
  const [activeVehicle, setActiveVehicle] = useState<VehicleRecord | null>(
    vehicleRecords.find((v) => v.plateNumber === selectedVehiclePlate) || vehicleRecords[0] || null
  );

  const filteredVehicles = searchPlate
    ? vehicleRecords.filter((v) =>
        v.plateNumber.toLowerCase().includes(searchPlate.toLowerCase()) ||
        v.make.toLowerCase().includes(searchPlate.toLowerCase()) ||
        v.model.toLowerCase().includes(searchPlate.toLowerCase())
      )
    : vehicleRecords;

  // Correlation: All sightings of the selected plate across different cameras over time
  const correlatedSightings = activeVehicle
    ? vehicleRecords
        .filter((v) => v.plateNumber === activeVehicle.plateNumber)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const handleSelectVehicle = (veh: VehicleRecord) => {
    setActiveVehicle(veh);
    setSelectedVehiclePlate(veh.plateNumber);
    logAudit(
      'VEHICLE_RECORD_LOOKUP',
      `Plate: ${veh.plateNumber}`,
      `Officer queried cross-camera movement history for ${veh.make} ${veh.model}`
    );
  };

  const handleFlagWatchlist = (veh: VehicleRecord) => {
    if (!canPerformAction('CREATE')) return;
    addIncident({
      title: `Watchlist Flag Added: Plate ${veh.plateNumber}`,
      category: 'MISSING_VEHICLE',
      priority: 'CRITICAL',
      status: 'INVESTIGATING',
      locationName: veh.cameraName,
      latitude: veh.latitude,
      longitude: veh.longitude,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      cameraId: veh.cameraId,
      cameraCode: veh.cameraCode,
      assignedOfficer: currentUser.name,
      assignedOfficerId: currentUser.id,
      description: `Automated law enforcement alert initiated for vehicle ${veh.make} ${veh.model} (${veh.color}) with license plate ${veh.plateNumber}. Cross-camera correlation active.`,
    });
    alert(`Incident opened and priority alert dispatched for vehicle plate ${veh.plateNumber}.`);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-600" />
            <span>ANPR Vehicle Intelligence & Multi-Camera Trajectory Correlation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated license plate recognition (ALPR), cross-junction tracking, hotlist matching and transit vectors.
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            placeholder="Search license plate (e.g. 8ABC789, 7XYZ901)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Workspace Frame (3-Column Layout: Left Registry, Middle Correlation & Dossier, Right Map) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Plate Registry List (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800">
              ANPR Detections ({filteredVehicles.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Sorted by Time</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredVehicles.map((veh) => {
              const isSelected = activeVehicle?.id === veh.id;
              return (
                <div
                  key={veh.id}
                  onClick={() => handleSelectVehicle(veh)}
                  className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {veh.plateNumber}
                    </span>
                    {veh.isWatchlist ? (
                      <Badge variant="danger" pulse>
                        STOLEN / HOTLIST
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Verified</Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 font-semibold truncate">
                    {veh.make} {veh.model} ({veh.color})
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-1">
                    <span>{veh.cameraCode}</span>
                    <span>{veh.timestamp.split(' ')[1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle: Vehicle Investigation Dossier & Correlation Timeline (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          {activeVehicle ? (
            <>
              {/* Dossier Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                      Target License Plate
                    </span>
                    <h3 className="text-lg font-black font-mono text-slate-900 tracking-wider">
                      {activeVehicle.plateNumber}
                    </h3>
                  </div>

                  {canPerformAction('CREATE') && (
                    <Button
                      variant={activeVehicle.isWatchlist ? 'danger' : 'outline'}
                      size="xs"
                      onClick={() => handleFlagWatchlist(activeVehicle)}
                    >
                      {activeVehicle.isWatchlist ? 'Flagged on Watchlist' : 'Add to Watchlist'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Dossier Details & Specs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">MAKE / MODEL</span>
                    <span className="font-bold text-slate-800">
                      {activeVehicle.make} {activeVehicle.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">BODY / COLOR</span>
                    <span className="font-bold text-slate-800">
                      {activeVehicle.category} • {activeVehicle.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">RECORDED SPEED</span>
                    <span className="font-bold text-blue-600">{activeVehicle.speedKmH} km/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">VECTOR DIRECTION</span>
                    <span className="font-bold text-slate-800">{activeVehicle.direction}</span>
                  </div>
                </div>

                {activeVehicle.isWatchlist && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Authorized Law Enforcement Watchlist Hit</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      {activeVehicle.watchlistReason}
                    </p>
                  </div>
                )}

                {/* Cross-Camera Correlation Timeline */}
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cross-Camera Movement Correlation ({correlatedSightings.length})</span>
                  </h4>

                  <div className="space-y-2 border-l-2 border-blue-200 ml-2 pl-3">
                    {correlatedSightings.map((sighting, idx) => (
                      <div key={sighting.id} className="relative text-xs">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        <div className="font-bold text-slate-800 font-mono">
                          {sighting.timestamp.split(' ')[1]} — {sighting.cameraCode}
                        </div>
                        <div className="text-[11px] text-slate-600">{sighting.cameraName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Speed: {sighting.speedKmH} km/h • Direction: {sighting.direction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs p-6 text-center">
              Select a vehicle record from the registry to review cross-camera correlation.
            </div>
          )}
        </div>

        {/* Right: GIS Trajectory Route Map (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>GIS Trajectory Vector Map</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {correlatedSightings.length} Junction Fixes
            </span>
          </div>

          <div className="flex-1 relative min-h-[300px]">
            <GisMap
              cameras={cameras}
              activeVehicleTrack={correlatedSightings}
              center={
                activeVehicle
                  ? [activeVehicle.latitude, activeVehicle.longitude]
                  : [37.7858, -122.4065]
              }
              zoom={13}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

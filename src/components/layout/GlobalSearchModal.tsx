import React, { useState, useEffect } from 'react';
import {
  Search,
  Video,
  Car,
  AlertTriangle,
  UserCheck,
  Bus,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAerovis } from '../../context/AerovisContext';
import { Badge } from '../common/Badge';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    cameras,
    vehicleRecords,
    incidents,
    missingPersons,
    buses,
    setActiveModule,
    setSelectedCameraId,
    setSelectedIncidentId,
    setSelectedVehiclePlate,
  } = useAerovis();

  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredCameras = q
    ? cameras.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.zone.toLowerCase().includes(q)
      )
    : [];

  const filteredVehicles = q
    ? vehicleRecords.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      )
    : [];

  const filteredIncidents = q
    ? incidents.filter(
        (i) =>
          i.incidentNumber.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      )
    : [];

  const filteredPersons = q
    ? missingPersons.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.caseNumber.toLowerCase().includes(q)
      )
    : [];

  const filteredBuses = q
    ? buses.filter(
        (b) =>
          b.busNumber.toLowerCase().includes(q) ||
          b.routeCode.toLowerCase().includes(q) ||
          b.routeName.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    filteredCameras.length +
    filteredVehicles.length +
    filteredIncidents.length +
    filteredPersons.length +
    filteredBuses.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => setIsGlobalSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cameras (CAM-101), plate numbers (8ABC789), cases, incidents..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">
                City-Wide Intelligence Query System
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Type a camera code, vehicle license plate, incident ID, or subject name to inspect live feeds and telemetry.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No municipal records found matching "{query}"
            </div>
          ) : (
            <>
              {/* Cameras */}
              {filteredCameras.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold font-mono uppercase text-slate-400 mb-2">
                    Cameras ({filteredCameras.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredCameras.map((cam) => (
                      <div
                        key={cam.id}
                        onClick={() => {
                          setSelectedCameraId(cam.id);
                          setActiveModule('live-monitoring');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {cam.code}
                            </span>
                            <span className="text-xs text-slate-600 ml-2">{cam.name}</span>
                            <p className="text-[11px] text-slate-400">{cam.zone} • {cam.locationName}</p>
                          </div>
                        </div>
                        <Badge variant={cam.status === 'ONLINE' ? 'success' : 'danger'}>
                          {cam.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {filteredVehicles.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold font-mono uppercase text-slate-400 mb-2">
                    Vehicle ANPR Records ({filteredVehicles.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredVehicles.map((veh) => (
                      <div
                        key={veh.id}
                        onClick={() => {
                          setSelectedVehiclePlate(veh.plateNumber);
                          setActiveModule('vehicle-intelligence');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Car className="w-4 h-4 text-slate-700" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {veh.plateNumber}
                            </span>
                            <span className="text-xs text-slate-600 ml-2">
                              {veh.make} {veh.model} ({veh.color})
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Logged at {veh.cameraName} • {veh.speedKmH} km/h
                            </p>
                          </div>
                        </div>
                        {veh.isWatchlist ? (
                          <Badge variant="danger" pulse>
                            WATCHLIST HIT
                          </Badge>
                        ) : (
                          <Badge variant="neutral">Verified</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incidents */}
              {filteredIncidents.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold font-mono uppercase text-slate-400 mb-2">
                    Incidents ({filteredIncidents.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setSelectedIncidentId(inc.id);
                          setActiveModule('incident-management');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {inc.incidentNumber}
                            </span>
                            <span className="text-xs text-slate-700 ml-2">{inc.title}</span>
                            <p className="text-[11px] text-slate-400">{inc.locationName}</p>
                          </div>
                        </div>
                        <Badge
                          variant={inc.priority === 'CRITICAL' ? 'danger' : 'warning'}
                        >
                          {inc.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Persons */}
              {filteredPersons.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold font-mono uppercase text-slate-400 mb-2">
                    Missing Persons Registry ({filteredPersons.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredPersons.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveModule('missing-persons');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4 text-amber-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {p.fullName} (Age {p.age})
                            </span>
                            <span className="text-xs text-slate-500 ml-2 font-mono">
                              {p.caseNumber}
                            </span>
                            <p className="text-[11px] text-slate-400">{p.lastKnownLocation}</p>
                          </div>
                        </div>
                        <Badge variant={p.status === 'ACTIVE' ? 'warning' : 'success'}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buses */}
              {filteredBuses.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold font-mono uppercase text-slate-400 mb-2">
                    Bus Camera Fleet ({filteredBuses.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredBuses.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setActiveModule('bus-network');
                          setIsGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bus className="w-4 h-4 text-indigo-600" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {b.busNumber}
                            </span>
                            <span className="text-xs text-slate-700 ml-2">
                              {b.routeName} ({b.routeCode})
                            </span>
                            <p className="text-[11px] text-slate-400">{b.driverName}</p>
                          </div>
                        </div>
                        <Badge variant="info">{b.speed} km/h</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

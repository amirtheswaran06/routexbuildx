import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Camera,
  Bus,
  Incident,
  VehicleRecord,
  CameraType,
  IncidentPriority,
} from '../../types/aerovis';
import { Badge } from '../common/Badge';
import {
  Video,
  AlertTriangle,
  Bus as BusIcon,
  LocateFixed,
} from 'lucide-react';

interface GisMapProps {
  cameras?: Camera[];
  buses?: Bus[];
  incidents?: Incident[];
  activeVehicleTrack?: VehicleRecord[];
  onSelectCamera?: (camera: Camera) => void;
  onSelectIncident?: (incident: Incident) => void;
  selectedCameraId?: string | null;
  selectedIncidentId?: string | null;
  height?: string;
  zoom?: number;
  center?: [number, number];
}

// Custom DivIcons for crisp vector rendering
const createCameraIcon = (type: CameraType, status: string, isSelected: boolean) => {
  const isOnline = status === 'ONLINE';
  const typeLetter = type === 'ANPR' ? 'A' : type === 'TRAFFIC' ? 'T' : type === 'BUS' ? 'B' : 'C';

  return L.divIcon({
    className: 'aerovis-marker-icon',
    html: `
      <div class="aerovis-marker aerovis-camera-marker ${isOnline ? 'is-online' : status === 'DEGRADED' ? 'is-degraded' : 'is-offline'} ${isSelected ? 'is-selected' : ''}">
        <span>${typeLetter}</span>${isOnline ? '<i></i>' : ''}
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 21],
  });
};

const createBusIcon = (heading: number) => {
  return L.divIcon({
    className: 'aerovis-bus-icon',
    html: `
      <div class="aerovis-marker aerovis-bus-marker" style="--bus-heading:${heading}deg">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5z"/><path d="M6 9h12M8 15h.01M16 15h.01M7 19v2m10-2v2"/></svg>
        <i></i>
      </div>
    `,
    iconSize: [38, 42],
    iconAnchor: [19, 21],
  });
};

const createIncidentIcon = (priority: IncidentPriority, isSelected: boolean) => {
  const isCritical = priority === 'CRITICAL';
  const isHigh = priority === 'HIGH';
  const color = isCritical ? 'is-critical' : isHigh ? 'is-high' : 'is-normal';

  return L.divIcon({
    className: 'aerovis-marker-icon',
    html: `
      <div class="aerovis-marker aerovis-incident-marker ${color} ${
        isSelected ? 'is-selected' : ''
      } ${isCritical ? 'radar-ping' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
    iconSize: [38, 42],
    iconAnchor: [19, 21],
  });
};

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) && Number.isFinite(longitude) &&
  latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

const MapViewport: React.FC<{ points: [number, number][]; center: [number, number]; zoom: number }> = ({ points, center, zoom }) => {
  const map = useMap();
  const pointsKey = points.map(([lat, lng]) => `${lat},${lng}`).join(';');

  React.useEffect(() => {
    const fitMap = () => {
      map.invalidateSize({ pan: false });
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 15 });
      } else {
        map.setView(center, zoom);
      }
    };

    const frame = window.requestAnimationFrame(fitMap);
    const observer = typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => map.invalidateSize({ pan: false }));
    if (observer) observer.observe(map.getContainer());

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [map, pointsKey, center[0], center[1], zoom]);
  return null;
};

const UserLocationMarker: React.FC<{ location: [number, number] | null }> = ({ location }) => {
  const map = useMap();

  React.useEffect(() => {
    if (location) map.flyTo(location, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [location, map]);

  if (!location) return null;
  return (
    <CircleMarker
      center={location}
      radius={9}
      pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
    >
      <Popup>You are here</Popup>
    </CircleMarker>
  );
};

export const GisMap: React.FC<GisMapProps> = ({
  cameras = [],
  buses = [],
  incidents = [],
  activeVehicleTrack = [],
  onSelectCamera,
  onSelectIncident,
  selectedCameraId,
  selectedIncidentId,
  height = '100%',
  zoom = 13,
  center = [13.0827, 80.2707],
}) => {
  // Layer toggles
  const [layers, setLayers] = useState({
    cameras: true,
    buses: true,
    incidents: true,
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const validCameras = cameras.filter((camera) => isValidCoordinate(camera.latitude, camera.longitude));
  const validBuses = buses.filter((bus) => isValidCoordinate(bus.currentLat, bus.currentLng));
  const validIncidents = incidents.filter((incident) => isValidCoordinate(incident.latitude, incident.longitude));
  const validTrack = activeVehicleTrack.filter((vehicle) => isValidCoordinate(vehicle.latitude, vehicle.longitude));
  const mapPoints: [number, number][] = [
    ...validCameras.map((camera) => [camera.latitude, camera.longitude] as [number, number]),
    ...validIncidents.map((incident) => [incident.latitude, incident.longitude] as [number, number]),
  ];
  const mapCenter = center;

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Allow location access in your browser to center the map.'
          : 'Could not get your location. Try again.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: '100%', height }}
        zoomControl={false}
        scrollWheelZoom
      >
        <MapViewport points={mapPoints} center={mapCenter} zoom={zoom} />
        <UserLocationMarker location={userLocation} />
        <ZoomControl position="bottomright" />

        {/* OpenStreetMap tiles render without a provider API key. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Vehicle Movement Track (If active search/correlation) */}
        {validTrack.length > 1 && (
          <Polyline
            positions={validTrack.map((v) => [v.latitude, v.longitude] as [number, number])}
            pathOptions={{
              color: '#dc2626',
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}

        {/* Camera Markers */}
        {layers.cameras &&
          validCameras.map((cam) => {
            const isSelected = cam.id === selectedCameraId;
            return (
              <Marker
                key={cam.id}
                position={[cam.latitude, cam.longitude]}
                icon={createCameraIcon(cam.type, cam.status, isSelected)}
                eventHandlers={{
                  click: () => {
                    if (onSelectCamera) onSelectCamera(cam);
                  },
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {cam.code}
                      </span>
                      <Badge
                        variant={
                          cam.status === 'ONLINE'
                            ? 'success'
                            : cam.status === 'DEGRADED'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {cam.status}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 leading-tight mb-1">
                      {cam.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      {cam.locationName} • {cam.zone}
                    </p>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded mb-2 font-mono">
                      <div>TYPE: {cam.type}</div>
                      <div>FPS: {cam.fps}</div>
                      <div>RES: {cam.resolution}</div>
                      <div>AZ: {cam.direction}</div>
                    </div>

                    <button
                      onClick={() => onSelectCamera && onSelectCamera(cam)}
                      className="w-full py-1 text-center bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer transition-colors"
                    >
                      Open Live Stream
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Bus Markers */}
        {layers.buses &&
          validBuses.map((bus) => (
            <Marker
              key={bus.id}
              position={[bus.currentLat, bus.currentLng]}
              icon={createBusIcon(bus.heading)}
            >
              <Popup>
                <div className="p-3 min-w-[210px]">
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-indigo-700">
                      {bus.busNumber}
                    </span>
                    <Badge variant={bus.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {bus.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">
                    {bus.routeName} ({bus.routeCode})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{bus.driverName}</p>

                  <div className="mt-2 text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded flex justify-between">
                    <span>SPEED: {bus.speed} km/h</span>
                    <span>HDG: {bus.heading}°</span>
                    <span>CAMS: {bus.cameraCount}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Incident Markers */}
        {layers.incidents &&
          validIncidents.map((inc) => {
            const isSelected = inc.id === selectedIncidentId;
            return (
              <Marker
                key={inc.id}
                position={[inc.latitude, inc.longitude]}
                icon={createIncidentIcon(inc.priority, isSelected)}
                eventHandlers={{
                  click: () => onSelectIncident && onSelectIncident(inc),
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[230px]">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-rose-700">
                        {inc.incidentNumber}
                      </span>
                      <Badge
                        variant={inc.priority === 'CRITICAL' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {inc.priority}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 mb-1 leading-snug">
                      {inc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">{inc.locationName}</p>

                    <div className="text-[11px] text-slate-600 mb-2 bg-slate-50 p-1.5 rounded font-mono">
                      STATUS: {inc.status} | OFFICER: {inc.assignedOfficer || 'Pending'}
                    </div>

                    <button
                      onClick={() => onSelectIncident && onSelectIncident(inc)}
                      className="w-full py-1 text-center bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer transition-colors"
                    >
                      View Incident Case
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div className="absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1">
        <button
          type="button"
          onClick={locateMe}
          disabled={isLocating}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
          aria-label="Center map on my location"
        >
          <LocateFixed className={`h-4 w-4 text-blue-600 ${isLocating ? 'animate-pulse' : ''}`} />
          {isLocating ? 'Locating…' : userLocation ? 'Update my location' : 'My location'}
        </button>
        {locationError && (
          <p role="status" className="max-w-64 rounded-md border border-amber-200 bg-white/95 px-2.5 py-1.5 text-[11px] text-amber-800 shadow">
            {locationError}
          </p>
        )}
      </div>

      {/* Floating GIS Map Controls Bar */}
      <div className="absolute top-3 right-3 z-400 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 p-2 flex items-center gap-1.5 text-xs text-slate-700 select-none">
        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-1">Layers:</span>

        <button
          onClick={() => setLayers((l) => ({ ...l, cameras: !l.cameras }))}
          className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors flex items-center gap-1 ${
            layers.cameras
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Cameras ({validCameras.length})</span>
        </button>

        <button
          onClick={() => setLayers((l) => ({ ...l, buses: !l.buses }))}
          className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors flex items-center gap-1 ${
            layers.buses
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <BusIcon className="w-3.5 h-3.5" />
          <span>Buses ({validBuses.length})</span>
        </button>

        <button
          onClick={() => setLayers((l) => ({ ...l, incidents: !l.incidents }))}
          className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors flex items-center gap-1 ${
            layers.incidents
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Incidents ({validIncidents.filter((i) => i.status !== 'CLOSED').length})</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-400 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 px-3 py-2 text-[11px] text-slate-600 flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>ANPR</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-blue-400"></span>
          <span>CCTV</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>Bus Fleet</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span>Incident</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-slate-400">
          <span>GIS: WGS-84</span>
        </div>
      </div>
    </div>
  );
};


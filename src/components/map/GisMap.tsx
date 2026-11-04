import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
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
  Navigation,
  Car,
  Layers,
  Eye,
  Maximize2,
  Compass,
  Radio,
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
  const isDegraded = status === 'DEGRADED';
  const bgColor = isOnline
    ? isSelected
      ? 'bg-blue-600 ring-4 ring-blue-300'
      : 'bg-slate-900 border-2 border-blue-400'
    : isDegraded
    ? 'bg-amber-600 border-2 border-amber-300'
    : 'bg-rose-600 border-2 border-rose-300';

  const typeLetter = type === 'ANPR' ? 'A' : type === 'TRAFFIC' ? 'T' : type === 'BUS' ? 'B' : 'C';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${bgColor} text-white shadow-md cursor-pointer transition-transform hover:scale-125">
        <span class="text-[10px] font-mono font-bold">${typeLetter}</span>
        ${isOnline ? '<span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white"></span>' : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createBusIcon = (heading: number) => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg cursor-pointer border-2 border-white transition-transform hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C18.2 6.7 17.1 6 16 6H4c-1.1 0-2.2.7-2.4 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="15" cy="18" r="2"/>
        </svg>
        <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-900 rounded-full flex items-center justify-center border border-white" style="transform: rotate(${heading}deg);">
          <div class="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-white"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createIncidentIcon = (priority: IncidentPriority, isSelected: boolean) => {
  const isCritical = priority === 'CRITICAL';
  const isHigh = priority === 'HIGH';
  const color = isCritical ? 'bg-rose-600' : isHigh ? 'bg-amber-600' : 'bg-blue-600';

  return L.divIcon({
    className: 'custom-incident-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${color} text-white shadow-lg cursor-pointer border-2 border-white ${
        isSelected ? 'ring-4 ring-rose-300 scale-125' : ''
      } ${isCritical ? 'radar-ping' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to dynamically fit bounds or re-center
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
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
  center = [37.782, -122.408],
}) => {
  // Layer toggles
  const [layers, setLayers] = useState({
    cameras: true,
    buses: true,
    incidents: true,
    trafficDensity: true,
    coverageCones: false,
  });

  // Selected camera preview modal inside map
  const [activePopupCamera, setActivePopupCamera] = useState<Camera | null>(null);

  // Metro Bus routes coordinates for polylines
  const busRouteCoords: [number, number][] = [
    [37.7895, -122.4024],
    [37.7858, -122.4065],
    [37.7842, -122.4078],
    [37.7785, -122.4172],
    [37.7684, -122.3912],
    [37.7512, -122.4045],
  ];

  // Highway corridor track
  const highwayCoords: [number, number][] = [
    [37.8087, -122.4098],
    [37.7876, -122.3921],
    [37.7621, -122.3887],
    [37.7512, -122.4045],
    [37.7380, -122.4010],
  ];

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height }}
        zoomControl={false}
      >
        <MapViewController center={center} zoom={zoom} />

        {/* Crisp Positron / OpenStreetMap Clean Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> Positron'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Traffic Density Overlays (Heatmap / Corridors) */}
        {layers.trafficDensity && (
          <>
            {/* Downtown Density Core */}
            <Circle
              center={[37.7858, -122.4065]}
              radius={700}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
            {/* Tech Corridor Moderate Zone */}
            <Circle
              center={[37.7684, -122.3912]}
              radius={550}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />
            {/* Highway Corridor Line */}
            <Polyline
              positions={highwayCoords}
              pathOptions={{
                color: '#f59e0b',
                weight: 4,
                opacity: 0.65,
                lineCap: 'round',
              }}
            />
          </>
        )}

        {/* Bus Routes Polyline */}
        {layers.buses && (
          <Polyline
            positions={busRouteCoords}
            pathOptions={{
              color: '#6366f1',
              weight: 3,
              opacity: 0.7,
              dashArray: '6, 8',
            }}
          />
        )}

        {/* Vehicle Movement Track (If active search/correlation) */}
        {activeVehicleTrack && activeVehicleTrack.length > 1 && (
          <Polyline
            positions={activeVehicleTrack.map((v) => [v.latitude, v.longitude] as [number, number])}
            pathOptions={{
              color: '#dc2626',
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}

        {/* Camera Markers */}
        {layers.cameras &&
          cameras.map((cam) => {
            const isSelected = cam.id === selectedCameraId;
            return (
              <Marker
                key={cam.id}
                position={[cam.latitude, cam.longitude]}
                icon={createCameraIcon(cam.type, cam.status, isSelected)}
                eventHandlers={{
                  click: () => {
                    setActivePopupCamera(cam);
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
          buses.map((bus) => (
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
          incidents.map((inc) => {
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
          <span>Cameras ({cameras.length})</span>
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
          <span>Buses ({buses.length})</span>
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
          <span>Incidents ({incidents.filter((i) => i.status !== 'CLOSED').length})</span>
        </button>

        <button
          onClick={() => setLayers((l) => ({ ...l, trafficDensity: !l.trafficDensity }))}
          className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors flex items-center gap-1 ${
            layers.trafficDensity
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Traffic Heatmap</span>
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

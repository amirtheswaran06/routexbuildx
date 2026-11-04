export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMINISTRATOR'
  | 'CONTROL_ROOM_OPERATOR'
  | 'TRAFFIC_ANALYST'
  | 'INVESTIGATION_OFFICER'
  | 'READ_ONLY_VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  avatarUrl?: string;
}

export type CameraType = 'CCTV' | 'ANPR' | 'TRAFFIC' | 'BUS';
export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE';

export interface Camera {
  id: string;
  code: string;
  name: string;
  type: CameraType;
  locationName: string;
  zone: string;
  latitude: number;
  longitude: number;
  ipAddress: string;
  streamUrl: string;
  status: CameraStatus;
  resolution: string;
  fps: number;
  coverageAngle: number;
  direction: string;
  lastPing: string;
  isDemo: boolean;
  busId?: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  routeCode: string;
  routeName: string;
  driverName: string;
  licensePlate: string;
  speed: number;
  status: 'ACTIVE' | 'DEPOT' | 'MAINTENANCE';
  currentLat: number;
  currentLng: number;
  heading: number;
  cameraCount: number;
  connectedCameras: string[];
  lastGpsUpdate: string;
}

export type DetectionCategory =
  | 'VEHICLE'
  | 'NUMBER_PLATE'
  | 'PERSON'
  | 'TRAFFIC_VIOLATION'
  | 'ROAD_HAZARD'
  | 'ACCIDENT'
  | 'SUSPICIOUS_INCIDENT';

export interface Detection {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  category: DetectionCategory;
  confidence: number;
  label: string;
  bbox?: [number, number, number, number]; // [x, y, width, height] in %
  imageUrl?: string;
  metadata?: Record<string, any>;
  isDemo: boolean;
}

export interface VehicleRecord {
  id: string;
  detectionId: string;
  plateNumber: string;
  category: 'Sedan' | 'SUV' | 'Truck' | 'Bus' | 'Motorcycle' | 'Van';
  make: string;
  model: string;
  color: string;
  direction: string;
  speedKmH: number;
  timestamp: string;
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  latitude: number;
  longitude: number;
  isWatchlist: boolean;
  watchlistReason?: string;
}

export interface PersonRecord {
  id: string;
  detectionId: string;
  timestamp: string;
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  latitude: number;
  longitude: number;
  genderEstimate?: string;
  clothingTop?: string;
  clothingBottom?: string;
  isWatchlistMatch: boolean;
  watchlistType?: 'MISSING_PERSON' | 'PERSON_OF_INTEREST';
  matchConfidence?: number;
  verificationStatus: 'PENDING_REVIEW' | 'VERIFIED_MATCH' | 'FALSE_POSITIVE';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  imageUrl?: string;
}

export interface MissingPerson {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  caseNumber: string;
  reportedDate: string;
  missingSince: string;
  lastKnownLocation: string;
  description: string;
  photoUrl: string;
  status: 'ACTIVE' | 'FOUND' | 'CLOSED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  assignedInvestigator: string;
  matchedSightingsCount: number;
}

export type IncidentCategory =
  | 'ROAD_ACCIDENT'
  | 'HIT_AND_RUN'
  | 'TRAFFIC_VIOLATION'
  | 'ROAD_HAZARD'
  | 'MISSING_VEHICLE'
  | 'SECURITY_ALERT';

export type IncidentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'CLOSED';

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  cameraId?: string;
  cameraCode?: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  description: string;
  evidenceCount: number;
  notesCount: number;
  notes?: { id: string; author: string; timestamp: string; content: string }[];
}

export interface IncidentEvidence {
  id: string;
  incidentId: string;
  type: 'SNAPSHOT' | 'VIDEO_CLIP' | 'ANPR_LOG' | 'GPS_TRACK' | 'DOCUMENT';
  title: string;
  url: string;
  timestamp: string;
  fileSize?: string;
  metadata?: Record<string, any>;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  incidentId?: string;
  leadInvestigator: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'CLOSED';
  summary: string;
  createdDate: string;
  updatedDate: string;
  correlatedCameras: string[];
  correlatedPlates: string[];
  evidenceItems: IncidentEvidence[];
  notes: { id: string; author: string; timestamp: string; content: string }[];
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  category: string;
  cameraId?: string;
  cameraCode?: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface TrafficAnalyticsData {
  zone: string;
  currentDensity: number; // 0-100%
  vehicleCount: number;
  avgSpeedKmH: number;
  congestionLevel: 'OPTIMAL' | 'MODERATE' | 'HEAVY' | 'CRITICAL';
  hourlyVolume: { hour: string; count: number; avgSpeed: number }[];
  vehicleBreakdown: { type: string; count: number; percentage: number }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}

export interface SystemSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiGatewayUrl: string;
  refreshIntervalSec: number;
  enableSoundAlerts: boolean;
  mapStyle: 'voyager' | 'positron' | 'osm';
  retentionDays: number;
  demoSimulationActive: boolean;
}

export type AppModule =
  | 'overview'
  | 'live-monitoring'
  | 'camera-network'
  | 'ai-detection'
  | 'vehicle-intelligence'
  | 'person-intelligence'
  | 'traffic-analytics'
  | 'incident-management'
  | 'missing-persons'
  | 'investigation-centre'
  | 'bus-network'
  | 'reports'
  | 'administration'
  | 'settings';

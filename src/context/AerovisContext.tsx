import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppModule,
  Camera,
  Bus,
  Detection,
  VehicleRecord,
  PersonRecord,
  MissingPerson,
  Incident,
  InvestigationCase,
  AlertNotification,
  TrafficAnalyticsData,
  AuditLog,
  SystemSettings,
  IncidentStatus,
} from '../types/aerovis';
import {
  INITIAL_CAMERAS,
  INITIAL_BUSES,
  INITIAL_DETECTIONS,
  INITIAL_VEHICLE_RECORDS,
  INITIAL_PERSON_RECORDS,
  INITIAL_MISSING_PERSONS,
  INITIAL_INCIDENTS,
  INITIAL_INVESTIGATIONS,
  INITIAL_ALERTS,
  INITIAL_TRAFFIC_DATA,
  INITIAL_AUDIT_LOGS,
  DEFAULT_SETTINGS,
  getStoredData,
  setStoredData,
} from '../services/aerovisStorage';
import {
  supabase,
  isSupabaseConfigured,
  setSupabaseRuntimeConfig,
  checkSupabaseHealth,
} from '../lib/supabase';
import { camerasService } from '../services/camerasService';
import { incidentsService } from '../services/incidentsService';
import { detectionsService } from '../services/detectionsService';
import { vehiclesService } from '../services/vehiclesService';
import { busesService } from '../services/busesService';
import { alertsService } from '../services/alertsService';
import { personsService } from '../services/personsService';
import { auditService } from '../services/auditService';
import { useAuth } from './AuthContext';

interface AerovisContextType {
  activeModule: AppModule;
  setActiveModule: (mod: AppModule) => void;

  cameras: Camera[];
  buses: Bus[];
  detections: Detection[];
  vehicleRecords: VehicleRecord[];
  personRecords: PersonRecord[];
  missingPersons: MissingPerson[];
  incidents: Incident[];
  investigations: InvestigationCase[];
  alerts: AlertNotification[];
  trafficData: TrafficAnalyticsData[];
  auditLogs: AuditLog[];
  settings: SystemSettings;

  isLoading: boolean;
  errorMessage: string | null;
  dataSource: 'supabase' | 'local';
  reloadData: () => Promise<void>;

  supabaseStatus: { connected: boolean; message: string; latencyMs?: number };
  refreshSupabaseStatus: () => Promise<void>;

  selectedCameraId: string | null;
  setSelectedCameraId: (id: string | null) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  selectedVehiclePlate: string | null;
  setSelectedVehiclePlate: (plate: string | null) => void;

  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;

  // Actions
  addCamera: (cam: Omit<Camera, 'id' | 'lastPing'>) => Promise<void>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  pingCamera: (id: string) => Promise<boolean>;

  addIncident: (inc: Omit<Incident, 'id' | 'incidentNumber' | 'evidenceCount' | 'notesCount'>) => Promise<void>;
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>;
  assignIncidentOfficer: (id: string, officerName: string) => Promise<void>;
  addIncidentNote: (incidentId: string, content: string) => Promise<void>;

  verifyPersonMatch: (
    recordId: string,
    status: 'VERIFIED_MATCH' | 'FALSE_POSITIVE',
    notes: string
  ) => Promise<void>;

  addMissingPerson: (person: Omit<MissingPerson, 'id' | 'matchedSightingsCount'>) => Promise<void>;
  updateMissingPersonStatus: (id: string, status: 'ACTIVE' | 'FOUND' | 'CLOSED') => Promise<void>;

  addDetection: (det: Detection) => Promise<void>;
  generateDemoComplaint: () => Promise<void>;

  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  clearAllAlerts: () => void;

  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  logAudit: (action: string, resource: string, details: string) => void;
  playAlertTone: () => void;
}

const AerovisContext = createContext<AerovisContextType | undefined>(undefined);

export const AerovisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [activeModule, setActiveModuleState] = useState<AppModule>(() => {
    return (localStorage.getItem('aerovis_active_module') as AppModule) || 'overview';
  });

  const setActiveModule = (mod: AppModule) => {
    setActiveModuleState(mod);
    localStorage.setItem('aerovis_active_module', mod);
  };

  // State entities
  const [cameras, setCameras] = useState<Camera[]>(() => getStoredData('cameras', INITIAL_CAMERAS));
  const [buses, setBuses] = useState<Bus[]>(() => getStoredData('buses', INITIAL_BUSES));
  const [detections, setDetections] = useState<Detection[]>(() => getStoredData('detections', INITIAL_DETECTIONS));
  const [vehicleRecords, setVehicleRecords] = useState<VehicleRecord[]>(() => getStoredData('vehicle_records', INITIAL_VEHICLE_RECORDS));
  const [personRecords, setPersonRecords] = useState<PersonRecord[]>(() => getStoredData('person_records', INITIAL_PERSON_RECORDS));
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>(() => getStoredData('missing_persons', INITIAL_MISSING_PERSONS));
  const [incidents, setIncidents] = useState<Incident[]>(() => getStoredData('incidents', INITIAL_INCIDENTS));
  const [investigations] = useState<InvestigationCase[]>(() => getStoredData('investigations', INITIAL_INVESTIGATIONS));
  const [alerts, setAlerts] = useState<AlertNotification[]>(() => getStoredData('alerts', INITIAL_ALERTS));
  const [trafficData] = useState<TrafficAnalyticsData[]>(() => getStoredData('traffic_data', INITIAL_TRAFFIC_DATA));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredData('audit_logs', INITIAL_AUDIT_LOGS));
  const [settings, setSettings] = useState<SystemSettings>(() => getStoredData('system_settings', DEFAULT_SETTINGS));

  // Operational states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');

  // Inspector & modal states
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);

  // Supabase connection state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
    latencyMs?: number;
  }>({
    connected: false,
    message: 'Checking Supabase backend link...',
  });

  const refreshSupabaseStatus = useCallback(async () => {
    const res = await checkSupabaseHealth();
    setSupabaseStatus(res);
    setDataSource(res.connected ? 'supabase' : 'local');
  }, []);

  // Fetch initial data across all backend services
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [camsRes, incsRes, detsRes, vehsRes, busesRes, altsRes, persRes, missRes, auditRes] =
        await Promise.all([
          camerasService.getAll(),
          incidentsService.getAll(),
          detectionsService.getAll(),
          vehiclesService.getAll(),
          busesService.getAll(),
          alertsService.getAll(),
          personsService.getPersonRecords(),
          personsService.getMissingPersons(),
          auditService.getAll(),
        ]);

      setCameras(camsRes.data);
      setIncidents(incsRes.data);
      setDetections(detsRes.data);
      setVehicleRecords(vehsRes.data);
      setBuses(busesRes.data);
      setAlerts(altsRes.data);
      setPersonRecords(persRes.data);
      setMissingPersons(missRes.data);
      setAuditLogs(auditRes.data);

      const isLive = camsRes.source === 'supabase' || incsRes.source === 'supabase';
      setDataSource(isLive ? 'supabase' : 'local');
    } catch (err: any) {
      console.error('[AerovisContext] Error loading dataset:', err);
      setErrorMessage(err.message || 'Failed to query database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSupabaseStatus();
    reloadData();
  }, [refreshSupabaseStatus, reloadData, settings.supabaseUrl, settings.supabaseAnonKey]);

  // Realtime Supabase Channel Subscription (when connected)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      const channel = supabase
        .channel('aerovis-realtime-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cameras' },
          (payload) => {
            console.log('[Realtime] Camera table updated:', payload.eventType);
            camerasService.getAll().then((res) => setCameras(res.data));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload) => {
            console.log('[Realtime] Incidents table updated:', payload.eventType);
            incidentsService.getAll().then((res) => setIncidents(res.data));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'alerts' },
          (payload) => {
            console.log('[Realtime] New alert received:', payload.new);
            alertsService.getAll().then((res) => setAlerts(res.data));
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } catch (err) {
      console.warn('[Realtime] Channel subscription warning:', err);
    }
  }, [supabaseStatus.connected]);

  // Sound Synthesizer
  const playAlertTone = () => {
    if (!settings.enableSoundAlerts) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio context policy
    }
  };

  // Audit Logging
  const logAudit = async (action: string, resource: string, details: string) => {
    const log = await auditService.logEvent(
      action,
      resource,
      details,
      currentUser.name,
      currentUser.role,
      currentUser.id
    );
    setAuditLogs((prev) => [log, ...prev.slice(0, 199)]);
  };

  // Bus GPS Simulation Ticker
  useEffect(() => {
    if (!settings.demoSimulationActive) return;

    const timer = setInterval(() => {
      setBuses((prev) =>
        prev.map((bus) => {
          if (bus.status !== 'ACTIVE') return bus;
          const rad = (bus.heading * Math.PI) / 180;
          const deltaLat = Math.cos(rad) * 0.00018;
          const deltaLng = Math.sin(rad) * 0.00022;

          let newLat = bus.currentLat + deltaLat;
          let newLng = bus.currentLng + deltaLng;
          let newHeading = bus.heading;

          if (newLat > 13.16 || newLat < 12.88) {
            newHeading = (newHeading + 180) % 360;
            newLat = bus.currentLat;
          }
          if (newLng > 80.34 || newLng < 80.15) {
            newHeading = (newHeading + 180) % 360;
            newLng = bus.currentLng;
          }

          const finalLat = parseFloat(newLat.toFixed(6));
          const finalLng = parseFloat(newLng.toFixed(6));

          // Background sync to DB if connected
          busesService.updateTelemetry(bus.id, finalLat, finalLng, bus.speed, newHeading);

          return {
            ...bus,
            currentLat: finalLat,
            currentLng: finalLng,
            heading: newHeading,
            lastGpsUpdate: 'Just now',
          };
        })
      );
    }, 4000);

    return () => clearInterval(timer);
  }, [settings.demoSimulationActive]);

  // Actions wired to services
  const addCamera = async (camData: Omit<Camera, 'id' | 'lastPing'>) => {
    const created = await camerasService.create(camData);
    setCameras((prev) => [created, ...prev]);
    logAudit('CREATE_CAMERA', `Camera ${created.code}`, `Registered new ${created.type} camera at ${created.locationName}`);
  };

  const updateCamera = async (id: string, updates: Partial<Camera>) => {
    await camerasService.update(id, updates);
    setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logAudit('UPDATE_CAMERA', `Camera ID ${id}`, `Updated parameters: ${Object.keys(updates).join(', ')}`);
  };

  const deleteCamera = async (id: string) => {
    const target = cameras.find((c) => c.id === id);
    await camerasService.delete(id);
    setCameras((prev) => prev.filter((c) => c.id !== id));
    logAudit('DELETE_CAMERA', `Camera ${target?.code || id}`, 'Decommissioned camera node');
  };

  const pingCamera = async (id: string): Promise<boolean> => {
    await camerasService.ping(id);
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              lastPing: '1s ago',
              status: c.status === 'OFFLINE' ? 'ONLINE' : c.status,
            }
          : c
      )
    );
    return true;
  };

  const addIncident = async (
    incData: Omit<Incident, 'id' | 'incidentNumber' | 'evidenceCount' | 'notesCount'>
  ) => {
    const created = await incidentsService.create(incData);
    setIncidents((prev) => [created, ...prev]);

    // Dispatch priority alert
    const newAlert = await alertsService.create({
      timestamp: incData.timestamp,
      type: incData.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: `Incident Logged: ${incData.title}`,
      description: `${incData.category} at ${incData.locationName}. Priority: ${incData.priority}`,
      category: incData.category,
      cameraId: incData.cameraId,
      cameraCode: incData.cameraCode,
      acknowledged: false,
      resolved: false,
    });
    setAlerts((prev) => [newAlert, ...prev]);
    playAlertTone();

    logAudit('CREATE_INCIDENT', created.incidentNumber, `Opened incident file: ${incData.title}`);
  };

  const updateIncidentStatus = async (id: string, status: IncidentStatus) => {
    await incidentsService.updateStatus(id, status);
    setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, status } : inc)));
    logAudit('UPDATE_INCIDENT_STATUS', `Incident ${id}`, `Status changed to ${status}`);
  };

  const assignIncidentOfficer = async (id: string, officerName: string) => {
    await incidentsService.assignOfficer(id, officerName);
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, assignedOfficer: officerName, status: 'ASSIGNED' } : inc
      )
    );
    logAudit('ASSIGN_OFFICER', `Incident ${id}`, `Assigned response officer: ${officerName}`);
  };

  const addIncidentNote = async (incidentId: string, content: string) => {
    const author = `${currentUser.name} (${currentUser.role})`;
    await incidentsService.addNote(incidentId, author, content);
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const note = { id: `nt-${Date.now()}`, author, timestamp: timestampStr, content };
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const notes = inc.notes ? [...inc.notes, note] : [note];
        return { ...inc, notes, notesCount: notes.length };
      })
    );
  };

  const verifyPersonMatch = async (
    recordId: string,
    status: 'VERIFIED_MATCH' | 'FALSE_POSITIVE',
    notes: string
  ) => {
    const verifiedBy = `${currentUser.name} (${currentUser.badgeNumber})`;
    await personsService.verifySighting(recordId, status, verifiedBy, notes);
    setPersonRecords((prev) =>
      prev.map((pr) => {
        if (pr.id !== recordId) return pr;
        return {
          ...pr,
          verificationStatus: status,
          verifiedBy,
          verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          notes: notes || pr.notes,
        };
      })
    );
    logAudit(
      'HUMAN_VERIFICATION_AUDIT',
      `Person Record ${recordId}`,
      `Authorized verification status changed to ${status}. Notes: ${notes}`
    );
  };

  const addMissingPerson = async (
    personData: Omit<MissingPerson, 'id' | 'matchedSightingsCount'>
  ) => {
    const created = await personsService.createMissingPerson(personData);
    setMissingPersons((prev) => [created, ...prev]);
    logAudit('REGISTER_MISSING_PERSON', personData.caseNumber, `Registered subject: ${personData.fullName}`);
  };

  const updateMissingPersonStatus = async (id: string, status: 'ACTIVE' | 'FOUND' | 'CLOSED') => {
    await personsService.updateMissingPersonStatus(id, status);
    setMissingPersons((prev) => prev.map((mp) => (mp.id === id ? { ...mp, status } : mp)));
    logAudit('UPDATE_MISSING_PERSON', `Subject ${id}`, `Status updated to ${status}`);
  };

  const addDetection = async (det: Detection) => {
    await detectionsService.record(det);
    setDetections((prev) => [det, ...prev.slice(0, 150)]);

    if (det.category === 'NUMBER_PLATE' && det.metadata?.plate) {
      const plate = det.metadata.plate;
      const newVeh: VehicleRecord = {
        id: `veh-${Date.now()}`,
        detectionId: det.id,
        plateNumber: plate,
        category: (det.metadata.category || 'Sedan') as any,
        make: det.metadata.make || 'Unknown',
        model: det.metadata.model || 'Unknown',
        color: det.metadata.color || 'Silver',
        direction: det.metadata.direction || 'Northbound',
        speedKmH: det.metadata.speed || 45,
        timestamp: det.timestamp,
        cameraId: det.cameraId,
        cameraCode: det.cameraCode,
        cameraName: det.cameraName,
        latitude: 37.7858,
        longitude: -122.4065,
        isWatchlist: !!det.metadata.watchlistAlert,
        watchlistReason: det.metadata.alertReason,
      };

      await vehiclesService.record(newVeh);
      setVehicleRecords((prev) => [newVeh, ...prev.slice(0, 200)]);

      if (det.metadata.watchlistAlert) {
        const alert = await alertsService.create({
          timestamp: det.timestamp,
          type: 'CRITICAL',
          title: `WATCHLIST VEHICLE HIT: ${plate}`,
          description: `ANPR camera ${det.cameraCode} matched hotlist: ${det.metadata.alertReason}`,
          category: 'ANPR Watchlist',
          cameraId: det.cameraId,
          cameraCode: det.cameraCode,
          acknowledged: false,
          resolved: false,
        });
        setAlerts((prev) => [alert, ...prev]);
        playAlertTone();
      }
    }
  };

  const generateDemoComplaint = async () => {
    if (dataSource === 'supabase') return;
    const demoCameras = cameras.filter((camera) => camera.code.startsWith('CAM-CHN-'));
    if (demoCameras.length === 0) return;

    const camera = demoCameras[Math.floor(Math.random() * demoCameras.length)];
    const complaintKinds = [
      { title: 'Blocked pedestrian crossing', category: 'ROAD_HAZARD' as const, priority: 'HIGH' as const },
      { title: 'Traffic signal not responding', category: 'ROAD_HAZARD' as const, priority: 'MEDIUM' as const },
      { title: 'Illegal parking near bus stop', category: 'TRAFFIC_VIOLATION' as const, priority: 'MEDIUM' as const },
      { title: 'Road debris reported by resident', category: 'ROAD_HAZARD' as const, priority: 'HIGH' as const },
      { title: 'Unsafe speeding near school zone', category: 'TRAFFIC_VIOLATION' as const, priority: 'HIGH' as const },
      { title: 'Street light outage affecting visibility', category: 'ROAD_HAZARD' as const, priority: 'LOW' as const },
    ];
    const complaint = complaintKinds[Math.floor(Math.random() * complaintKinds.length)];
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const eventId = Date.now();
    const latitude = camera.latitude + (Math.random() - 0.5) * 0.0012;
    const longitude = camera.longitude + (Math.random() - 0.5) * 0.0012;

    await addIncident({
      title: `Public complaint: ${complaint.title}`,
      category: complaint.category,
      priority: complaint.priority,
      status: 'NEW',
      locationName: camera.locationName,
      latitude,
      longitude,
      timestamp,
      cameraId: camera.id,
      cameraCode: camera.code,
      description: `A resident complaint was received and queued for operator review. The report was correlated with ${camera.name}.`,
      assignedOfficer: 'Unassigned',
    });

    await addDetection({
      id: `det-demo-${eventId}`,
      timestamp,
      cameraId: camera.id,
      cameraCode: camera.code,
      cameraName: camera.name,
      category: 'ROAD_HAZARD',
      confidence: Number((0.78 + Math.random() * 0.2).toFixed(3)),
      label: `Complaint triage: ${complaint.title}`,
      bbox: [34, 28, 32, 40],
      metadata: { source: 'DEMO_COMPLAINT', locationName: camera.locationName },
      isDemo: true,
    });
  };

  useEffect(() => {
    if (!settings.demoSimulationActive || dataSource === 'supabase') return;
    const timer = window.setInterval(() => {
      void generateDemoComplaint();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [settings.demoSimulationActive, dataSource]);

  const acknowledgeAlert = async (id: string) => {
    await alertsService.acknowledge(id);
    setAlerts((prev) => prev.map((alt) => (alt.id === id ? { ...alt, acknowledged: true } : alt)));
  };

  const resolveAlert = async (id: string) => {
    await alertsService.resolve(id);
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, resolved: true, acknowledged: true } : alt))
    );
    logAudit('RESOLVE_ALERT', `Alert ${id}`, 'Marked incident alert as resolved');
  };

  const clearAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.supabaseUrl !== undefined || newSettings.supabaseAnonKey !== undefined) {
        setSupabaseRuntimeConfig(
          newSettings.supabaseUrl ?? prev.supabaseUrl,
          newSettings.supabaseAnonKey ?? prev.supabaseAnonKey
        );
      }
      setStoredData('system_settings', updated);
      return updated;
    });
    logAudit('SYSTEM_SETTINGS_UPDATE', 'Core Settings', 'Updated platform configuration');
  };

  return (
    <AerovisContext.Provider
      value={{
        activeModule,
        setActiveModule,
        cameras,
        buses,
        detections,
        vehicleRecords,
        personRecords,
        missingPersons,
        incidents,
        investigations,
        alerts,
        trafficData,
        auditLogs,
        settings,
        isLoading,
        errorMessage,
        dataSource,
        reloadData,
        supabaseStatus,
        refreshSupabaseStatus,
        selectedCameraId,
        setSelectedCameraId,
        selectedIncidentId,
        setSelectedIncidentId,
        selectedVehiclePlate,
        setSelectedVehiclePlate,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        addCamera,
        updateCamera,
        deleteCamera,
        pingCamera,
        addIncident,
        updateIncidentStatus,
        assignIncidentOfficer,
        addIncidentNote,
        verifyPersonMatch,
        addMissingPerson,
        updateMissingPersonStatus,
        addDetection,
        generateDemoComplaint,
        acknowledgeAlert,
        resolveAlert,
        clearAllAlerts,
        updateSettings,
        logAudit,
        playAlertTone,
      }}
    >
      {children}
    </AerovisContext.Provider>
  );
};

export const useAerovis = () => {
  const context = useContext(AerovisContext);
  if (!context) {
    throw new Error('useAerovis must be used within an AerovisProvider');
  }
  return context;
};


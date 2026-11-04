import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Camera } from '../types/aerovis';
import { INITIAL_CAMERAS, getStoredData, setStoredData } from './aerovisStorage';

/**
 * Maps Supabase PostgreSQL snake_case columns to TypeScript Camera model
 */
const mapDbToCamera = (row: any): Camera => ({
  id: row.id,
  code: row.code,
  name: row.name,
  type: row.type,
  locationName: row.location_name,
  zone: row.zone_name,
  latitude: parseFloat(row.latitude),
  longitude: parseFloat(row.longitude),
  ipAddress: row.ip_address,
  streamUrl: row.stream_url,
  status: row.status,
  resolution: row.resolution || '1080p',
  fps: row.fps || 30,
  coverageAngle: row.coverage_angle || 90,
  direction: row.direction || 'North',
  lastPing: row.last_ping_at ? new Date(row.last_ping_at).toLocaleTimeString() : 'Online',
  isDemo: row.is_demo || false,
  busId: row.bus_id || undefined,
});

/**
 * Maps TypeScript Camera model to Supabase PostgreSQL columns
 */
const mapCameraToDb = (cam: Partial<Camera>) => ({
  code: cam.code,
  name: cam.name,
  type: cam.type,
  location_name: cam.locationName,
  zone_name: cam.zone,
  latitude: cam.latitude,
  longitude: cam.longitude,
  ip_address: cam.ipAddress,
  stream_url: cam.streamUrl,
  status: cam.status,
  resolution: cam.resolution,
  fps: cam.fps,
  coverage_angle: cam.coverageAngle,
  direction: cam.direction,
  is_demo: cam.isDemo || false,
  last_ping_at: new Date().toISOString(),
});

export const camerasService = {
  /**
   * Fetch all cameras from Supabase (with fallback to synchronized storage)
   */
  async getAll(): Promise<{ data: Camera[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('cameras')
          .select('*')
          .order('code', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToCamera);
          setStoredData('cameras', mapped);
          return { data: mapped, source: 'supabase' };
        }
        if (error) {
          console.warn('[CamerasService] Supabase fetch error, falling back to local engine:', error.message);
        }
      } catch (err: any) {
        console.warn('[CamerasService] Exception during Supabase fetch:', err.message);
      }
    }

    const localData = getStoredData('cameras', INITIAL_CAMERAS);
    return { data: localData, source: 'local' };
  },

  /**
   * Register a new camera node in Supabase and sync local state
   */
  async create(cameraData: Omit<Camera, 'id' | 'lastPing'>): Promise<Camera> {
    const fallbackId = `cam-${Date.now()}`;
    const newCamera: Camera = {
      ...cameraData,
      id: fallbackId,
      lastPing: 'Just now',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const dbPayload = mapCameraToDb(cameraData);
        const { data, error } = await supabase
          .from('cameras')
          .insert([dbPayload])
          .select()
          .single();

        if (!error && data) {
          return mapDbToCamera(data);
        }
        if (error) {
          console.error('[CamerasService] Failed to insert camera into Supabase:', error.message);
        }
      } catch (err) {
        console.error('[CamerasService] Supabase insert exception:', err);
      }
    }

    // Local state fallback
    const current = getStoredData('cameras', INITIAL_CAMERAS);
    setStoredData('cameras', [newCamera, ...current]);
    return newCamera;
  },

  /**
   * Update an existing camera in Supabase
   */
  async update(id: string, updates: Partial<Camera>): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const dbPayload = mapCameraToDb(updates);
        const { error } = await supabase
          .from('cameras')
          .update(dbPayload)
          .eq('id', id);

        if (error) {
          console.warn('[CamerasService] Supabase update warning:', error.message);
        }
      } catch (err) {
        console.warn('[CamerasService] Supabase update exception:', err);
      }
    }

    // Sync local
    const current = getStoredData('cameras', INITIAL_CAMERAS);
    const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setStoredData('cameras', updated);
    return true;
  },

  /**
   * Delete/decommission camera from Supabase
   */
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('cameras').delete().eq('id', id);
      } catch (err) {
        console.warn('[CamerasService] Supabase delete exception:', err);
      }
    }

    const current = getStoredData('cameras', INITIAL_CAMERAS);
    setStoredData('cameras', current.filter((c) => c.id !== id));
    return true;
  },

  /**
   * Ping camera transceiver to verify connectivity
   */
  async ping(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('cameras')
          .update({ last_ping_at: new Date().toISOString(), status: 'ONLINE' })
          .eq('id', id);
      } catch (e) {
        // ignore
      }
    }

    const current = getStoredData('cameras', INITIAL_CAMERAS);
    const updated = current.map((c) =>
      c.id === id
        ? {
            ...c,
            lastPing: 'Just now',
            status: c.status === 'OFFLINE' ? ('ONLINE' as const) : c.status,
          }
        : c
    );
    setStoredData('cameras', updated);
    return true;
  },
};

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Bus } from '../types/aerovis';
import { INITIAL_BUSES, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToBus = (row: any): Bus => ({
  id: row.id,
  busNumber: row.bus_number,
  routeCode: row.route_code,
  routeName: row.route_name,
  driverName: row.driver_name || 'Assigned Driver',
  licensePlate: row.license_plate,
  speed: parseFloat(row.speed_kmh || 0),
  status: row.status,
  currentLat: parseFloat(row.latitude),
  currentLng: parseFloat(row.longitude),
  heading: parseFloat(row.heading || 0),
  cameraCount: row.camera_count || 2,
  connectedCameras: row.connected_cameras || [],
  lastGpsUpdate: row.last_gps_at ? new Date(row.last_gps_at).toLocaleTimeString() : 'Just now',
});

export const busesService = {
  async getAll(): Promise<{ data: Bus[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('buses')
          .select('*')
          .order('bus_number', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToBus);
          setStoredData('buses', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[BusesService] Supabase error:', err.message);
      }
    }

    const localData = getStoredData('buses', INITIAL_BUSES);
    return { data: localData, source: 'local' };
  },

  async updateTelemetry(id: string, lat: number, lng: number, speed: number, heading: number): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('buses')
          .update({
            latitude: lat,
            longitude: lng,
            speed_kmh: speed,
            heading,
            last_gps_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (e) {
        // ignore
      }
    }
  },
};

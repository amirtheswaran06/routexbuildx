import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { VehicleRecord } from '../types/aerovis';
import { INITIAL_VEHICLE_RECORDS, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToVehicle = (row: any): VehicleRecord => ({
  id: row.id,
  detectionId: row.detection_id || '',
  plateNumber: row.plate_number,
  category: row.category || 'Sedan',
  make: row.make || 'Unknown',
  model: row.model || 'Unknown',
  color: row.color || 'Silver',
  direction: row.direction || 'Northbound',
  speedKmH: parseFloat(row.speed_kmh || 0),
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  cameraId: row.camera_id,
  cameraCode: row.camera_code,
  cameraName: row.camera_name,
  latitude: parseFloat(row.latitude),
  longitude: parseFloat(row.longitude),
  isWatchlist: row.is_watchlist || false,
  watchlistReason: row.watchlist_reason || undefined,
});

export const vehiclesService = {
  async getAll(): Promise<{ data: VehicleRecord[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicle_records')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToVehicle);
          setStoredData('vehicle_records', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[VehiclesService] Supabase fetch error:', err.message);
      }
    }

    const localData = getStoredData('vehicle_records', INITIAL_VEHICLE_RECORDS);
    return { data: localData, source: 'local' };
  },

  async record(veh: VehicleRecord): Promise<VehicleRecord> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          camera_id: veh.cameraId.includes('cam-') ? null : veh.cameraId,
          camera_code: veh.cameraCode,
          camera_name: veh.cameraName,
          plate_number: veh.plateNumber,
          category: veh.category,
          make: veh.make,
          model: veh.model,
          color: veh.color,
          speed_kmh: veh.speedKmH,
          direction: veh.direction,
          timestamp: new Date().toISOString(),
          latitude: veh.latitude,
          longitude: veh.longitude,
          is_watchlist: veh.isWatchlist,
          watchlist_reason: veh.watchlistReason,
        };

        const { data, error } = await supabase
          .from('vehicle_records')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return mapDbToVehicle(data);
        }
      } catch (err) {
        console.warn('[VehiclesService] Insert exception:', err);
      }
    }

    const current = getStoredData('vehicle_records', INITIAL_VEHICLE_RECORDS);
    setStoredData('vehicle_records', [veh, ...current.slice(0, 200)]);
    return veh;
  },

  async flagWatchlist(plate: string, reason: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('vehicle_records')
          .update({ is_watchlist: true, watchlist_reason: reason })
          .eq('plate_number', plate);
      } catch (err) {
        console.warn('[VehiclesService] Flag watchlist error:', err);
      }
    }

    const current = getStoredData('vehicle_records', INITIAL_VEHICLE_RECORDS);
    const updated = current.map((v) =>
      v.plateNumber === plate ? { ...v, isWatchlist: true, watchlistReason: reason } : v
    );
    setStoredData('vehicle_records', updated);
    return true;
  },
};

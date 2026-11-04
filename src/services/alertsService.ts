import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AlertNotification } from '../types/aerovis';
import { INITIAL_ALERTS, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToAlert = (row: any): AlertNotification => ({
  id: row.id,
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  type: row.type,
  title: row.title,
  description: row.description,
  category: row.category,
  cameraId: row.camera_id,
  cameraCode: row.camera_code,
  acknowledged: row.acknowledged || false,
  resolved: row.resolved || false,
});

export const alertsService = {
  async getAll(): Promise<{ data: AlertNotification[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToAlert);
          setStoredData('alerts', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[AlertsService] Supabase error:', err.message);
      }
    }

    const localData = getStoredData('alerts', INITIAL_ALERTS);
    return { data: localData, source: 'local' };
  },

  async create(alertData: Omit<AlertNotification, 'id'>): Promise<AlertNotification> {
    const newAlert: AlertNotification = {
      ...alertData,
      id: `alt-${Date.now()}`,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          type: alertData.type,
          title: alertData.title,
          description: alertData.description,
          category: alertData.category,
          camera_id: alertData.cameraId?.includes('cam-') ? null : alertData.cameraId,
          camera_code: alertData.cameraCode,
          acknowledged: alertData.acknowledged || false,
          resolved: alertData.resolved || false,
        };

        const { data, error } = await supabase
          .from('alerts')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return mapDbToAlert(data);
        }
      } catch (e) {
        // fallback
      }
    }

    const current = getStoredData('alerts', INITIAL_ALERTS);
    setStoredData('alerts', [newAlert, ...current]);
    return newAlert;
  },

  async acknowledge(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('alerts').update({ acknowledged: true }).eq('id', id);
      } catch (e) {
        // fallback
      }
    }

    const current = getStoredData('alerts', INITIAL_ALERTS);
    const updated = current.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    setStoredData('alerts', updated);
    return true;
  },

  async resolve(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('alerts').update({ resolved: true, acknowledged: true }).eq('id', id);
      } catch (e) {
        // fallback
      }
    }

    const current = getStoredData('alerts', INITIAL_ALERTS);
    const updated = current.map((a) => (a.id === id ? { ...a, resolved: true, acknowledged: true } : a));
    setStoredData('alerts', updated);
    return true;
  },
};

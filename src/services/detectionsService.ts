import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Detection } from '../types/aerovis';
import { INITIAL_DETECTIONS, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToDetection = (row: any): Detection => ({
  id: row.id,
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  cameraId: row.camera_id,
  cameraCode: row.camera_code,
  cameraName: row.camera_name,
  category: row.category,
  confidence: parseFloat(row.confidence),
  label: row.label,
  bbox: row.bbox || undefined,
  imageUrl: row.image_url,
  metadata: row.metadata || {},
  isDemo: row.is_demo || false,
});

export const detectionsService = {
  async getAll(): Promise<{ data: Detection[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('detections')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToDetection);
          setStoredData('detections', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[DetectionsService] Supabase fetch error:', err.message);
      }
    }

    const localData = getStoredData('detections', INITIAL_DETECTIONS);
    return { data: localData, source: 'local' };
  },

  async record(det: Detection): Promise<Detection> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          camera_id: det.cameraId.includes('cam-') ? null : det.cameraId,
          camera_code: det.cameraCode,
          camera_name: det.cameraName,
          timestamp: new Date().toISOString(),
          category: det.category,
          confidence: det.confidence,
          label: det.label,
          bbox: det.bbox,
          image_url: det.imageUrl,
          metadata: det.metadata || {},
          is_demo: det.isDemo || false,
        };

        const { data, error } = await supabase
          .from('detections')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return mapDbToDetection(data);
        }
      } catch (err) {
        console.warn('[DetectionsService] Insert exception:', err);
      }
    }

    const current = getStoredData('detections', INITIAL_DETECTIONS);
    setStoredData('detections', [det, ...current.slice(0, 150)]);
    return det;
  },
};

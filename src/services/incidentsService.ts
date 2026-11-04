import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Incident, IncidentStatus } from '../types/aerovis';
import { INITIAL_INCIDENTS, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToIncident = (row: any, notes: any[] = []): Incident => ({
  id: row.id,
  incidentNumber: row.incident_number,
  title: row.title,
  category: row.category,
  priority: row.priority,
  status: row.status,
  locationName: row.location_name,
  latitude: parseFloat(row.latitude),
  longitude: parseFloat(row.longitude),
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  cameraId: row.camera_id,
  cameraCode: row.camera_code,
  assignedOfficer: row.assigned_officer,
  assignedOfficerId: row.assigned_officer_id,
  description: row.description,
  evidenceCount: row.evidence_count || 1,
  notesCount: notes.length || row.notes_count || 0,
  notes: notes.map((n) => ({
    id: n.id,
    author: n.author,
    timestamp: n.timestamp || new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    content: n.content,
  })),
});

export const incidentsService = {
  /**
   * Fetch all incidents from Supabase with nested notes
   */
  async getAll(): Promise<{ data: Incident[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: incidentRows, error: incError } = await supabase
          .from('incidents')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!incError && incidentRows && incidentRows.length > 0) {
          // Fetch notes
          const { data: notesRows } = await supabase
            .from('incident_notes')
            .select('*')
            .order('created_at', { ascending: true });

          const allNotes = notesRows || [];

          const mapped = incidentRows.map((row) => {
            const relatedNotes = allNotes.filter((n) => n.incident_id === row.id);
            return mapDbToIncident(row, relatedNotes);
          });

          setStoredData('incidents', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[IncidentsService] Supabase fetch error, using local fallback:', err.message);
      }
    }

    const localData = getStoredData('incidents', INITIAL_INCIDENTS);
    return { data: localData, source: 'local' };
  },

  /**
   * Create an incident record in Supabase
   */
  async create(incidentData: Omit<Incident, 'id' | 'incidentNumber' | 'evidenceCount' | 'notesCount'>): Promise<Incident> {
    const incidentNumber = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc: Incident = {
      ...incidentData,
      id: `inc-${Date.now()}`,
      incidentNumber,
      evidenceCount: 1,
      notesCount: 0,
      notes: [],
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          incident_number: incidentNumber,
          title: incidentData.title,
          category: incidentData.category,
          priority: incidentData.priority,
          status: incidentData.status,
          location_name: incidentData.locationName,
          latitude: incidentData.latitude,
          longitude: incidentData.longitude,
          timestamp: new Date().toISOString(),
          camera_id: incidentData.cameraId || null,
          camera_code: incidentData.cameraCode || null,
          assigned_officer: incidentData.assignedOfficer || null,
          description: incidentData.description,
          evidence_count: 1,
        };

        const { data, error } = await supabase
          .from('incidents')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return mapDbToIncident(data, []);
        }
      } catch (err) {
        console.error('[IncidentsService] Insert exception:', err);
      }
    }

    // Local fallback
    const current = getStoredData('incidents', INITIAL_INCIDENTS);
    setStoredData('incidents', [newInc, ...current]);
    return newInc;
  },

  /**
   * Update incident lifecycle status in Supabase
   */
  async updateStatus(id: string, status: IncidentStatus): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('[IncidentsService] Status update error:', err);
      }
    }

    const current = getStoredData('incidents', INITIAL_INCIDENTS);
    const updated = current.map((i) => (i.id === id ? { ...i, status } : i));
    setStoredData('incidents', updated);
    return true;
  },

  /**
   * Assign officer to incident
   */
  async assignOfficer(id: string, officerName: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('incidents')
          .update({ assigned_officer: officerName, status: 'ASSIGNED', updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('[IncidentsService] Officer assign error:', err);
      }
    }

    const current = getStoredData('incidents', INITIAL_INCIDENTS);
    const updated = current.map((i) =>
      i.id === id ? { ...i, assignedOfficer: officerName, status: 'ASSIGNED' as const } : i
    );
    setStoredData('incidents', updated);
    return true;
  },

  /**
   * Post field notation to incident
   */
  async addNote(incidentId: string, author: string, content: string): Promise<boolean> {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('incident_notes')
          .insert([
            {
              incident_id: incidentId,
              author,
              content,
              timestamp: timestampStr,
            },
          ]);
      } catch (err) {
        console.warn('[IncidentsService] Add note error:', err);
      }
    }

    const current = getStoredData('incidents', INITIAL_INCIDENTS);
    const updated = current.map((i) => {
      if (i.id !== incidentId) return i;
      const note = { id: `nt-${Date.now()}`, author, timestamp: timestampStr, content };
      const notes = i.notes ? [...i.notes, note] : [note];
      return { ...i, notes, notesCount: notes.length };
    });
    setStoredData('incidents', updated);
    return true;
  },
};

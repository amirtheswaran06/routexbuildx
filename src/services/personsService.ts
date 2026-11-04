import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PersonRecord, MissingPerson } from '../types/aerovis';
import {
  INITIAL_PERSON_RECORDS,
  INITIAL_MISSING_PERSONS,
  getStoredData,
  setStoredData,
} from './aerovisStorage';

const mapDbToPersonRecord = (row: any): PersonRecord => ({
  id: row.id,
  detectionId: row.detection_id || '',
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  cameraId: row.camera_id,
  cameraCode: row.camera_code,
  cameraName: row.camera_name,
  latitude: parseFloat(row.latitude),
  longitude: parseFloat(row.longitude),
  genderEstimate: row.gender_estimate,
  clothingTop: row.clothing_top,
  clothingBottom: row.clothing_bottom,
  isWatchlistMatch: row.is_watchlist_match || false,
  watchlistType: row.watchlist_type,
  matchConfidence: row.match_confidence ? parseFloat(row.match_confidence) : undefined,
  verificationStatus: row.verification_status || 'PENDING_REVIEW',
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at,
  notes: row.notes,
  imageUrl: row.image_url,
});

const mapDbToMissingPerson = (row: any): MissingPerson => ({
  id: row.id,
  fullName: row.full_name,
  age: row.age,
  gender: row.gender,
  caseNumber: row.case_number,
  reportedDate: row.reported_date,
  missingSince: row.missing_since,
  lastKnownLocation: row.last_known_location,
  description: row.description,
  photoUrl: row.photo_url,
  status: row.status,
  priority: row.priority,
  assignedInvestigator: row.assigned_investigator,
  matchedSightingsCount: row.matched_sightings_count || 0,
});

export const personsService = {
  async getPersonRecords(): Promise<{ data: PersonRecord[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('person_records')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToPersonRecord);
          setStoredData('person_records', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[PersonsService] Supabase error:', err.message);
      }
    }

    const localData = getStoredData('person_records', INITIAL_PERSON_RECORDS);
    return { data: localData, source: 'local' };
  },

  async verifySighting(
    id: string,
    status: 'VERIFIED_MATCH' | 'FALSE_POSITIVE',
    verifiedBy: string,
    notes: string
  ): Promise<boolean> {
    const verifiedAt = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('person_records')
          .update({
            verification_status: status,
            verified_by: verifiedBy,
            verified_at: verifiedAt,
            notes,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[PersonsService] Verify sighting error:', err);
      }
    }

    const current = getStoredData('person_records', INITIAL_PERSON_RECORDS);
    const updated = current.map((p) =>
      p.id === id ? { ...p, verificationStatus: status, verifiedBy, verifiedAt, notes } : p
    );
    setStoredData('person_records', updated);
    return true;
  },

  async getMissingPersons(): Promise<{ data: MissingPerson[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('missing_persons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToMissingPerson);
          setStoredData('missing_persons', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[PersonsService] Missing persons error:', err.message);
      }
    }

    const localData = getStoredData('missing_persons', INITIAL_MISSING_PERSONS);
    return { data: localData, source: 'local' };
  },

  async createMissingPerson(data: Omit<MissingPerson, 'id' | 'matchedSightingsCount'>): Promise<MissingPerson> {
    const newPerson: MissingPerson = {
      ...data,
      id: `mp-${Date.now()}`,
      matchedSightingsCount: 0,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          full_name: data.fullName,
          age: data.age,
          gender: data.gender,
          case_number: data.caseNumber,
          reported_date: data.reportedDate,
          missing_since: data.missingSince,
          last_known_location: data.lastKnownLocation,
          description: data.description,
          photo_url: data.photoUrl,
          status: data.status,
          priority: data.priority,
          assigned_investigator: data.assignedInvestigator,
        };

        const { data: created, error } = await supabase
          .from('missing_persons')
          .insert([payload])
          .select()
          .single();

        if (!error && created) {
          return mapDbToMissingPerson(created);
        }
      } catch (err) {
        console.warn('[PersonsService] Create missing person error:', err);
      }
    }

    const current = getStoredData('missing_persons', INITIAL_MISSING_PERSONS);
    setStoredData('missing_persons', [newPerson, ...current]);
    return newPerson;
  },

  async updateMissingPersonStatus(id: string, status: 'ACTIVE' | 'FOUND' | 'CLOSED'): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('missing_persons').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('[PersonsService] Update status error:', err);
      }
    }

    const current = getStoredData('missing_persons', INITIAL_MISSING_PERSONS);
    const updated = current.map((p) => (p.id === id ? { ...p, status } : p));
    setStoredData('missing_persons', updated);
    return true;
  },
};

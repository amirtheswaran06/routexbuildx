import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditLog, UserRole } from '../types/aerovis';
import { INITIAL_AUDIT_LOGS, getStoredData, setStoredData } from './aerovisStorage';

const mapDbToAuditLog = (row: any): AuditLog => ({
  id: row.id,
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString().replace('T', ' ').substring(0, 19) : row.timestamp,
  userId: row.user_id || '',
  userName: row.user_name,
  userRole: row.user_role as UserRole,
  action: row.action,
  resource: row.resource,
  details: row.details,
  ipAddress: row.ip_address || '10.240.0.1',
});

export const auditService = {
  async getAll(): Promise<{ data: AuditLog[]; source: 'supabase' | 'local'; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbToAuditLog);
          setStoredData('audit_logs', mapped);
          return { data: mapped, source: 'supabase' };
        }
      } catch (err: any) {
        console.warn('[AuditService] Supabase error:', err.message);
      }
    }

    const localData = getStoredData('audit_logs', INITIAL_AUDIT_LOGS);
    return { data: localData, source: 'local' };
  },

  async logEvent(
    action: string,
    resource: string,
    details: string,
    userName: string,
    userRole: UserRole,
    userId: string = ''
  ): Promise<AuditLog> {
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: timestampStr,
      userId,
      userName,
      userRole,
      action,
      resource,
      details,
      ipAddress: '10.240.0.14',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          user_id: userId.includes('usr-') ? null : userId,
          user_name: userName,
          user_role: userRole,
          action,
          resource,
          details,
          ip_address: '10.240.0.14',
          timestamp: new Date().toISOString(),
        };

        await supabase.from('audit_logs').insert([payload]);
      } catch (err) {
        // local fallback
      }
    }

    const current = getStoredData('audit_logs', INITIAL_AUDIT_LOGS);
    setStoredData('audit_logs', [newLog, ...current.slice(0, 200)]);
    return newLog;
  },
};

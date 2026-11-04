import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve saved settings from localStorage if user updated them via the Settings UI
const getSavedSettings = () => {
  try {
    const raw = localStorage.getItem('aerovis_system_settings');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore parsing errors
  }
  return null;
};

const savedSettings = getSavedSettings();

// Load environment variables with fallback to saved settings
const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let activeUrl = envUrl || savedSettings?.supabaseUrl || '';
let activeKey = envKey || savedSettings?.supabaseAnonKey || '';

export const isValidSupabaseUrl = (url: string): boolean => {
  return typeof url === 'string' && url.length > 0 && (url.startsWith('https://') || url.startsWith('http://'));
};

let clientInstance: SupabaseClient | null = null;

const initializeClient = (url: string, key: string): SupabaseClient | null => {
  if (isValidSupabaseUrl(url) && key && key.length > 20) {
    try {
      return createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('[AEROVIS Supabase] Initialization error:', err);
      return null;
    }
  }
  return null;
};

clientInstance = initializeClient(activeUrl, activeKey);

/**
 * Global Supabase Client Instance
 * Will be null or inactive until valid credentials are provided
 */
export const supabase = clientInstance;

/**
 * Check if active Supabase client is properly configured with URL and Key
 */
export const isSupabaseConfigured = (): boolean => {
  return !!clientInstance && isValidSupabaseUrl(activeUrl) && !!activeKey;
};

/**
 * Get current configured endpoints (sanitizing key for security)
 */
export const getSupabaseConfig = () => {
  return {
    url: activeUrl,
    hasKey: !!activeKey,
    keyPreview: activeKey ? `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}` : '',
  };
};

/**
 * Update Supabase credentials dynamically at runtime (e.g. from Settings panel or env reload)
 */
export const setSupabaseRuntimeConfig = (url: string, key: string): boolean => {
  const cleanUrl = (url || '').trim();
  const cleanKey = (key || '').trim();

  activeUrl = cleanUrl;
  activeKey = cleanKey;

  clientInstance = initializeClient(activeUrl, activeKey);
  return !!clientInstance;
};

/**
 * Test connectivity, ping latency, and check table availability
 */
export const checkSupabaseHealth = async (): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
  tablesStatus?: Record<string, boolean>;
}> => {
  if (!clientInstance || !isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials awaiting configuration. Platform is running in Synchronized Engine mode.',
    };
  }

  const start = performance.now();
  try {
    // Ping cameras table as a baseline connectivity probe
    const { data, error } = await clientInstance
      .from('cameras')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      // Check if error is due to missing schema/table
      if (error.code === '42P01') {
        return {
          connected: true,
          message: `Connected to Supabase PostgreSQL (${latency}ms latency), but tables not yet created. Please run schema.sql in Supabase SQL Editor.`,
          latencyMs: latency,
        };
      }
      return {
        connected: false,
        message: `Supabase database error: ${error.message} (Code: ${error.code})`,
        latencyMs: latency,
      };
    }

    return {
      connected: true,
      message: `Active connection to Supabase PostgreSQL (${latency}ms roundtrip latency). Realtime channel ready.`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Network error connecting to Supabase instance.',
    };
  }
};

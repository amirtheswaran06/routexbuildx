/**
 * Re-exports the centralized client from src/lib/supabase.ts
 */
export {
  supabase as default,
  supabase,
  isSupabaseConfigured,
  getSupabaseConfig,
  setSupabaseRuntimeConfig as updateSupabaseCredentials,
  checkSupabaseHealth as checkSupabaseConnection,
} from '../lib/supabase';

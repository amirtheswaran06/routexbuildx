import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, UserRole } from '../types/aerovis';

export const authService = {
  /**
   * Real Supabase Authentication Sign In
   */
  async signIn(email: string, password: string): Promise<{ user?: any; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase credentials not yet configured. Use local simulated operator switching.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { user: data.user };
    } catch (err: any) {
      return { error: err.message || 'Authentication failed' };
    }
  },

  /**
   * Provision new user in Supabase Auth & public.users table
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    badgeNumber: string,
    role: UserRole
  ): Promise<{ user?: any; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase not connected. Provisioning in local storage.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            badge_number: badgeNumber,
            role,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Record profile in public.users
      if (data.user) {
        await supabase.from('users').insert([
          {
            auth_id: data.user.id,
            email,
            full_name: fullName,
            badge_number: badgeNumber,
            role_id: role,
            department: 'Metro Visual Command Bureau',
            status: 'ACTIVE',
          },
        ]);
      }

      return { user: data.user };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  },

  /**
   * Terminate Supabase Session
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Get Current Supabase User Session
   */
  async getSession() {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
    return null;
  },

  /**
   * Subscribe to Supabase auth state transitions
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange(callback);
      return data.subscription;
    }
    return null;
  },
};

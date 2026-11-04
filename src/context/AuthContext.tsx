import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AppModule } from '../types/aerovis';
import { INITIAL_USERS } from '../services/aerovisStorage';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  loginAsUser: (userId: string) => void;
  canAccessModule: (module: AppModule) => boolean;
  canPerformAction: (action: 'CREATE' | 'EDIT' | 'DELETE' | 'VERIFY' | 'EXPORT') => boolean;
  logout: () => void;
  usersList: User[];
  addUser: (newUser: Omit<User, 'id' | 'lastLogin'>) => void;
  toggleUserStatus: (userId: string) => void;

  // Supabase Auth Integration
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithSupabase: (
    email: string,
    password: string,
    fullName: string,
    badgeNumber: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('aerovis_users');
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('aerovis_current_user_id');
      return stored || 'usr-01'; // Default: Super Admin Raymond Sterling
    } catch {
      return 'usr-01';
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  useEffect(() => {
    localStorage.setItem('aerovis_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('aerovis_current_user_id', currentUserId);
  }, [currentUserId]);

  // Listen to Supabase Auth State changes if Supabase is connected
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const subscription = authService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        // Look up user profile from public.users table or match email in users list
        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          setCurrentUserId(existing.id);
        } else {
          const userMeta = session.user.user_metadata || {};
          const newUser: User = {
            id: session.user.id,
            name: userMeta.full_name || email.split('@')[0],
            email,
            role: (userMeta.role as UserRole) || 'CONTROL_ROOM_OPERATOR',
            badgeNumber: userMeta.badge_number || `OP-${Math.floor(100 + Math.random() * 899)}`,
            department: 'Metro Visual Command Bureau',
            status: 'ACTIVE',
            lastLogin: 'Active now',
          };
          setUsers((prev) => [newUser, ...prev]);
          setCurrentUserId(newUser.id);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [users]);

  const switchRole = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, role } : u))
      );
    }
  };

  const loginAsUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, lastLogin: 'Active now' } : u))
      );
    }
  };

  const logout = async () => {
    await authService.signOut();
    const viewer = users.find((u) => u.role === 'READ_ONLY_VIEWER') || users[users.length - 1];
    setCurrentUserId(viewer.id);
  };

  const addUser = (newUser: Omit<User, 'id' | 'lastLogin'>) => {
    const created: User = {
      ...newUser,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never',
    };
    setUsers((prev) => [...prev, created]);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : u
      )
    );
  };

  const signInWithSupabase = async (email: string, pass: string) => {
    const res = await authService.signIn(email, pass);
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const signUpWithSupabase = async (
    email: string,
    pass: string,
    fullName: string,
    badgeNumber: string,
    role: UserRole
  ) => {
    const res = await authService.signUp(email, pass, fullName, badgeNumber, role);
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const canAccessModule = (module: AppModule): boolean => {
    const role = currentUser.role;
    if (role === 'SUPER_ADMIN') return true;

    switch (module) {
      case 'overview':
      case 'live-monitoring':
      case 'traffic-analytics':
      case 'bus-network':
        return true;

      case 'camera-network':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'CONTROL_ROOM_OPERATOR'].includes(role);

      case 'ai-detection':
      case 'vehicle-intelligence':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'CONTROL_ROOM_OPERATOR', 'TRAFFIC_ANALYST', 'INVESTIGATION_OFFICER'].includes(role);

      case 'person-intelligence':
      case 'missing-persons':
      case 'investigation-centre':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'INVESTIGATION_OFFICER'].includes(role);

      case 'incident-management':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'CONTROL_ROOM_OPERATOR', 'INVESTIGATION_OFFICER'].includes(role);

      case 'reports':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'TRAFFIC_ANALYST', 'INVESTIGATION_OFFICER'].includes(role);

      case 'administration':
      case 'settings':
        return ['SUPER_ADMIN', 'ADMINISTRATOR'].includes(role);

      default:
        return false;
    }
  };

  const canPerformAction = (
    action: 'CREATE' | 'EDIT' | 'DELETE' | 'VERIFY' | 'EXPORT'
  ): boolean => {
    const role = currentUser.role;
    if (role === 'SUPER_ADMIN') return true;
    if (role === 'READ_ONLY_VIEWER') return false;

    switch (action) {
      case 'CREATE':
      case 'EDIT':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'CONTROL_ROOM_OPERATOR', 'INVESTIGATION_OFFICER'].includes(role);
      case 'DELETE':
        return ['SUPER_ADMIN', 'ADMINISTRATOR'].includes(role);
      case 'VERIFY':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'INVESTIGATION_OFFICER'].includes(role);
      case 'EXPORT':
        return ['SUPER_ADMIN', 'ADMINISTRATOR', 'TRAFFIC_ANALYST', 'INVESTIGATION_OFFICER'].includes(role);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        loginAsUser,
        canAccessModule,
        canPerformAction,
        logout,
        usersList: users,
        addUser,
        toggleUserStatus,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithSupabase,
        signUpWithSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

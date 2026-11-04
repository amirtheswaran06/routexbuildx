import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, User, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAerovis } from '../../context/AerovisContext';
import { Modal } from './Modal';
import { Button } from './Button';
import { UserRole } from '../../types/aerovis';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, signInWithSupabase, signUpWithSupabase } = useAuth();
  const { supabaseStatus } = useAerovis();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [role, setRole] = useState<UserRole>('CONTROL_ROOM_OPERATOR');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signin') {
      const res = await signInWithSupabase(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed');
      } else {
        setSuccessMsg('Successfully authenticated with Supabase');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1000);
      }
    } else {
      const res = await signUpWithSupabase(email, password, fullName, badgeNumber, role);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed');
      } else {
        setSuccessMsg('Account registered in Supabase. Check email if verification is required.');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1500);
      }
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      title={mode === 'signin' ? 'Supabase Authentication Sign In' : 'Provision Supabase Account'}
      subtitle={
        supabaseStatus.connected
          ? 'Connected to live Supabase Auth instance'
          : 'Notice: Supabase credentials not yet configured. You can also test roles via the Top Nav dropdown.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'signup' && (
          <>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Officer Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Lt. Carlos Mendoza"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge ID</label>
                <input
                  type="text"
                  required
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="OP-501"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Security Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                  <option value="CONTROL_ROOM_OPERATOR">Operator</option>
                  <option value="TRAFFIC_ANALYST">Traffic Analyst</option>
                  <option value="INVESTIGATION_OFFICER">Investigator</option>
                  <option value="READ_ONLY_VIEWER">Read-Only</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@aerovis.gov"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMsg(null);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
          >
            {mode === 'signin'
              ? "Don't have a Supabase account? Sign up"
              : 'Already have an account? Sign in'}
          </button>

          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading
              ? 'Authenticating...'
              : mode === 'signin'
              ? 'Sign In to Supabase'
              : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

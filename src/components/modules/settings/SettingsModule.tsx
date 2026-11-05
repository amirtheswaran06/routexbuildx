import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  Volume2,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Terminal,
  Activity,
  ExternalLink,
  Table,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings, supabaseStatus, refreshSupabaseStatus, reloadData } = useAerovis();

  const [formState, setFormState] = useState({
    supabaseUrl: settings.supabaseUrl || '',
    aiGatewayUrl: settings.aiGatewayUrl || '',
    refreshIntervalSec: settings.refreshIntervalSec || 5,
    enableSoundAlerts: settings.enableSoundAlerts,
    demoSimulationActive: settings.demoSimulationActive,
    retentionDays: settings.retentionDays || 90,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [tableChecks, setTableChecks] = useState<Record<string, boolean | null>>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSaveSuccess(true);
    await refreshSupabaseStatus();
    await reloadData();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    await refreshSupabaseStatus();

    // Verify individual tables if client is active
    if (isSupabaseConfigured() && supabase) {
      const tablesToCheck = ['cameras', 'incidents', 'detections', 'buses', 'vehicle_records', 'person_records'];
      const results: Record<string, boolean> = {};

      for (const t of tablesToCheck) {
        try {
          const { error } = await supabase.from(t).select('id').limit(1);
          results[t] = !error;
        } catch {
          results[t] = false;
        }
      }
      setTableChecks(results);
    }
    setIsTesting(false);
  };

  const copySqlPath = () => {
    const text = 'src/supabase/schema.sql';
    navigator.clipboard.writeText(text);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-700" />
            <span>Platform Topology, Gateway & Supabase Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure backend PostgreSQL connection, RTSP AI inference endpoints, and audio telemetry.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings synchronized & database reloaded</span>
          </div>
        )}
      </div>

      {/* Main Settings Form - Scrollable */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto p-4 md:p-6 shadow-2xs">
        <form onSubmit={handleSave} className="max-w-4xl space-y-6 text-xs">
          {/* Section 1: Supabase Backend Link */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold font-mono uppercase text-slate-900">
                  Supabase PostgreSQL Backend Connectivity
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={supabaseStatus.connected ? 'success' : 'neutral'}>
                  {supabaseStatus.connected ? 'Connected' : 'Local Engine Sync'}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  icon={
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  }
                >
                  Verify Database & Tables
                </Button>
              </div>
            </div>

            <div className={`p-3 rounded-lg border text-xs ${
              supabaseStatus.connected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-start gap-2">
                {supabaseStatus.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{supabaseStatus.message}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    To connect: Set <span className="font-mono font-bold">VITE_SUPABASE_URL</span> and <span className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</span> in your <span className="font-mono font-bold">.env</span> file.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={formState.supabaseUrl}
                  onChange={(e) => setFormState({ ...formState, supabaseUrl: e.target.value })}
                  placeholder="https://abcdefghijklm.supabase.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* Table Health Checklist (Visible after test) */}
            {Object.keys(tableChecks).length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-mono uppercase font-bold text-slate-500 text-[10px] block">
                  Table Verification Status in Supabase:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(tableChecks).map(([tbl, isOk]) => (
                    <div key={tbl} className="flex items-center gap-1.5 font-mono text-xs">
                      {isOk ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className={isOk ? 'text-slate-800' : 'text-slate-400'}>{tbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-Step Instructions Banner */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    How to Execute Database Schema in Supabase SQL Editor
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={copySqlPath}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  {copiedSchema ? 'Path Copied!' : 'Copy Path (src/supabase/schema.sql)'}
                </Button>
              </div>

              <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1 leading-relaxed">
                <li>
                  Open your <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Supabase Dashboard</a> and select your project.
                </li>
                <li>
                  Go to <strong>Project Settings ➔ API</strong>, then configure <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> in your local <code>.env</code> file.
                </li>
                <li>
                  In Supabase, navigate to the <strong>SQL Editor</strong> tab on the left.
                </li>
                <li>
                  Open <code className="bg-white px-1 py-0.5 rounded font-mono text-blue-700 border border-blue-200">src/supabase/schema.sql</code> from this project, paste the SQL contents into the editor, and click <strong>Run</strong>.
                </li>
                <li>
                  Click <strong>Verify Database & Tables</strong> above to verify live connection!
                </li>
              </ol>
            </div>
          </div>

          {/* Section 2: AI Computer Vision Inference Gateway */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold font-mono uppercase text-slate-900">
                AI Vision Model Gateway
              </h3>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                AI Inference HTTP Endpoint (REST / gRPC Bridge)
              </label>
              <input
                type="text"
                value={formState.aiGatewayUrl}
                onChange={(e) => setFormState({ ...formState, aiGatewayUrl: e.target.value })}
                placeholder="https://ai-gateway.aerovis.internal/v1/infer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                When endpoint is local or internal, AEROVIS executes calibrated edge vision recognition with zero external latency.
              </p>
            </div>
          </div>

          {/* Section 3: Operational Telemetry & Simulation Controls */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold font-mono uppercase text-slate-900">
                Live Simulation & Audio Alerts
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.demoSimulationActive}
                  onChange={(e) =>
                    setFormState({ ...formState, demoSimulationActive: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">
                    Demo Activity Generator
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Moves demo buses and generates a sample Chennai complaint, linked alert, and AI detection every minute. Automatic event generation pauses when live Supabase data is active.
                  </p>
                </div>
              </label>

              <label className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.enableSoundAlerts}
                  onChange={(e) =>
                    setFormState({ ...formState, enableSoundAlerts: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">
                    Critical Audio Warning Tone (Web Audio API)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Plays an acoustic dispatch notification tone when a Critical Priority incident or Stolen Plate Hit is detected.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Data Retention & Compliance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold font-mono uppercase text-slate-900">
                Retention & Compliance Policy
              </h3>
            </div>

            <div className="max-w-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Data Retention Window (Days)
              </label>
              <select
                value={formState.retentionDays}
                onChange={(e) =>
                  setFormState({ ...formState, retentionDays: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value={30}>30 Days (Standard Traffic)</option>
                <option value={90}>90 Days (Municipal Standard)</option>
                <option value={180}>180 Days (Law Enforcement Archive)</option>
                <option value={365}>365 Days (Full Judicial Record)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="submit" variant="primary" size="md">
              Save Platform Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


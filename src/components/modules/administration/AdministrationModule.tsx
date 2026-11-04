import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  UserPlus,
  Shield,
  Lock,
  Activity,
  Database,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Search,
  Key,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { User, UserRole } from '../../../types/aerovis';

export const AdministrationModule: React.FC = () => {
  const { auditLogs, supabaseStatus, logAudit } = useAerovis();
  const { currentUser, usersList, addUser, toggleUserStatus, switchRole } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'audit' | 'policies'>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  // Form for new user creation
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CONTROL_ROOM_OPERATOR' as UserRole,
    badgeNumber: '',
    department: 'Metro Visual Command Bureau',
    status: 'ACTIVE' as const,
  });

  const roles: UserRole[] = [
    'SUPER_ADMIN',
    'ADMINISTRATOR',
    'CONTROL_ROOM_OPERATOR',
    'TRAFFIC_ANALYST',
    'INVESTIGATION_OFFICER',
    'READ_ONLY_VIEWER',
  ];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      ...formData,
      badgeNumber: formData.badgeNumber || `OP-${Math.floor(100 + Math.random() * 899)}`,
    });
    logAudit(
      'CREATE_USER_ACCOUNT',
      `User ${formData.email}`,
      `Super Admin created operational account with role ${formData.role}`
    );
    setIsAddUserModalOpen(false);
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.details.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Admin Tabs Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Administration, Security Policy & Immutable Audit Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), operator account provisioning, and compliance logging.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'users'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operators & Roles ({usersList.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('audit')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'audit'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('policies')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'policies'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>RBAC Matrix</span>
          </button>
        </div>
      </div>

      {activeAdminTab === 'users' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800">
                Authorized Personnel Roster ({usersList.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Current authenticated user: {currentUser.name} ({currentUser.role})
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsAddUserModalOpen(true)}
            >
              Provision Account
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Officer / Administrator</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role & Permissions</th>
                  <th className="py-2.5 px-3">Badge Number</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span>{user.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{user.email}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="primary" size="sm">
                        {user.role.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {user.badgeNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{user.department}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'audit' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800">
                Cryptographically Sequenced Audit Trail ({filteredLogs.length})
              </h3>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Filter logs by action, officer..."
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2 px-3">Timestamp (UTC)</th>
                  <th className="py-2 px-3">Operator Name</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Action Identifier</th>
                  <th className="py-2 px-3">Target Resource</th>
                  <th className="py-2 px-3">Operation Details</th>
                  <th className="py-2 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{log.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-2 px-3">
                      <span className="text-blue-600 font-bold">{log.userRole}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-800 font-bold">{log.action}</td>
                    <td className="py-2 px-3 text-indigo-700">{log.resource}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans text-xs">{log.details}</td>
                    <td className="py-2 px-3 text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'policies' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs overflow-y-auto">
          <div className="max-w-4xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Role-Based Access Control (RBAC) Governance Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Defined roles and strictly enforced operational capabilities in accordance with municipal data security directives.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Role Tier</th>
                    <th className="p-3">Live Video Feeds</th>
                    <th className="p-3">PTZ & Incident Filing</th>
                    <th className="p-3">Person Verification</th>
                    <th className="p-3">Export Reports</th>
                    <th className="p-3">Audit Logs & Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">SUPER_ADMIN</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">Authorized Sign-off</td>
                    <td className="p-3 text-emerald-600 font-bold">Allowed</td>
                    <td className="p-3 text-emerald-600 font-bold">Unrestricted</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">ADMINISTRATOR</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">Authorized Sign-off</td>
                    <td className="p-3 text-emerald-600 font-bold">Allowed</td>
                    <td className="p-3 text-emerald-600 font-bold">View Only</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">CONTROL_ROOM_OPERATOR</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">PTZ + Triage</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">TRAFFIC_ANALYST</td>
                    <td className="p-3 text-slate-700">Traffic Cams Only</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-emerald-600 font-bold">Allowed</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">INVESTIGATION_OFFICER</td>
                    <td className="p-3 text-emerald-600 font-bold">Full Access</td>
                    <td className="p-3 text-emerald-600 font-bold">Case Journal</td>
                    <td className="p-3 text-emerald-600 font-bold">Authorized Sign-off</td>
                    <td className="p-3 text-emerald-600 font-bold">Allowed</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900 font-mono">READ_ONLY_VIEWER</td>
                    <td className="p-3 text-slate-600">Public Feeds</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                    <td className="p-3 text-slate-400">Restricted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Provision Account Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Provision Municipal Operator Account"
        subtitle="Create an authorized credential profile with specific role assignments."
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Officer Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="e.g. Lt. Carlos Mendoza"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="c.mendoza@aerovis.gov"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Tier *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Badge ID</label>
              <input
                type="text"
                value={formData.badgeNumber}
                onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                placeholder="OP-502"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department / Bureau</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

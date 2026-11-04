import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Shield,
  FileText,
  MapPin,
  Send,
  Video,
  ExternalLink,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { IncidentModal } from './IncidentModal';
import { Incident, IncidentStatus } from '../../../types/aerovis';

export const IncidentManagementModule: React.FC = () => {
  const {
    incidents,
    updateIncidentStatus,
    assignIncidentOfficer,
    addIncidentNote,
    selectedIncidentId,
    setSelectedIncidentId,
    setSelectedCameraId,
    setActiveModule,
  } = useAerovis();

  const { canPerformAction, currentUser, usersList } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>('');

  const activeIncident =
    incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;

  const statuses: { label: string; value: string }[] = [
    { label: 'All Incidents', value: 'ALL' },
    { label: 'New', value: 'NEW' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'Investigating', value: 'INVESTIGATING' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  const filtered = incidents.filter((inc) => {
    const matchesStatus = activeTab === 'ALL' || inc.status === activeTab;
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.incidentNumber.toLowerCase().includes(search.toLowerCase()) ||
      inc.locationName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeIncident) return;
    addIncidentNote(activeIncident.id, newNoteContent.trim());
    setNewNoteContent('');
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & New Incident Button */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Incident Command & Investigation Lifecycle Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time triage, traffic accident documentation, forensic evidence linkage and officer dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canPerformAction('CREATE') && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Log Incident File
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto py-0.5">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveTab(s.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeTab === s.value
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident #, title..."
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Workspace Frame (3-Column Split: Incidents List 5 Cols | Detail Case View 7 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Incident Feed List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800">
              Active Cases Queue ({filtered.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">Status Sorted</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filtered.map((inc) => {
              const isSelected = activeIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-rose-50/70 border border-rose-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {inc.incidentNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          inc.priority === 'CRITICAL'
                            ? 'danger'
                            : inc.priority === 'HIGH'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {inc.priority}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {inc.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">
                    {inc.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{inc.locationName}</p>

                  <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span>OFCR: {inc.assignedOfficer || 'Unassigned'}</span>
                    <span>{inc.timestamp.split(' ')[1] || inc.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Case Workspace & Notes (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          {activeIncident ? (
            <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-extrabold text-blue-600">
                      {activeIncident.incidentNumber}
                    </span>
                    <Badge variant={activeIncident.priority === 'CRITICAL' ? 'danger' : 'warning'}>
                      {activeIncident.priority}
                    </Badge>
                    <Badge variant="neutral">{activeIncident.category.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {activeIncident.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeIncident.locationName}</p>
                </div>

                {/* Status Progression Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">STATE:</span>
                  <select
                    value={activeIncident.status}
                    onChange={(e) =>
                      updateIncidentStatus(activeIncident.id, e.target.value as IncidentStatus)
                    }
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {activeIncident.description}
              </div>

              {/* Case Metadata Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">TIMESTAMP</span>
                  <span className="font-bold text-slate-800">{activeIncident.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CAMERA LINK</span>
                  <span className="font-bold text-blue-600">
                    {activeIncident.cameraCode || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">LEAD OFFICER</span>
                  <span className="font-bold text-slate-800">
                    {activeIncident.assignedOfficer || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">EVIDENCE COUNT</span>
                  <span className="font-bold text-slate-800">
                    {activeIncident.evidenceCount} Files
                  </span>
                </div>
              </div>

              {/* Linked Camera Action */}
              {activeIncident.cameraId && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700 font-medium">
                      Incident linked to node {activeIncident.cameraCode}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCameraId(activeIncident.cameraId!);
                      setActiveModule('live-monitoring');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                  >
                    Watch Live Feed →
                  </button>
                </div>
              )}

              {/* Officer Assignment Dropdown */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-700">Assign Field Officer:</span>
                <select
                  value={activeIncident.assignedOfficer || ''}
                  onChange={(e) => assignIncidentOfficer(activeIncident.id, e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                >
                  <option value="">Select Officer...</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.badgeNumber}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Case Journal & Notes */}
              <div className="flex-1 flex flex-col space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Investigation Journal & Field Log ({activeIncident.notes?.length || 0})</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!activeIncident.notes || activeIncident.notes.length === 0) ? (
                    <div className="p-3 text-slate-400 text-xs text-center bg-slate-50 rounded">
                      No investigation notes logged yet.
                    </div>
                  ) : (
                    activeIncident.notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                          <span className="font-bold text-slate-700">{n.author}</span>
                          <span>{n.timestamp}</span>
                        </div>
                        <p className="text-slate-800 leading-snug">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter dispatch update, witness statement, or evidence notation..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Post
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select an incident from the queue to view full case details.
            </div>
          )}
        </div>
      </div>

      {/* New Incident Modal */}
      <IncidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

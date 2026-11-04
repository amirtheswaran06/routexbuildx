import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  FileText,
  Shield,
  Eye,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { MissingPerson } from '../../../types/aerovis';

export const MissingPersonsModule: React.FC = () => {
  const {
    missingPersons,
    addMissingPerson,
    updateMissingPersonStatus,
    personRecords,
    setActiveModule,
  } = useAerovis();

  const { canPerformAction, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(
    missingPersons[0] || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New person form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: 20,
    gender: 'Female',
    caseNumber: '',
    reportedDate: new Date().toISOString().slice(0, 10),
    missingSince: new Date().toISOString().slice(0, 10),
    lastKnownLocation: '',
    description: '',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE' as const,
    priority: 'HIGH' as const,
    assignedInvestigator: `${currentUser.name} (${currentUser.badgeNumber})`,
  });

  const filtered = missingPersons.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.lastKnownLocation.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addMissingPerson({
      ...formData,
      caseNumber: formData.caseNumber || `MP-2026-${Math.floor(100 + Math.random() * 899)}`,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Missing Persons Intelligence Registry & Sightings Correlator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active municipal bulletin, bus-platform optical search, and cross-district case tracking.
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
              File Missing Person Bulletin
            </Button>
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Active Registry List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject by name, case #..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filtered.map((person) => {
              const isSelected = selectedPerson?.id === person.id;
              return (
                <div
                  key={person.id}
                  onClick={() => setSelectedPerson(person)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer flex items-center gap-3 ${
                    isSelected ? 'bg-amber-50/70 border border-amber-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={person.photoUrl}
                    alt={person.fullName}
                    className="w-12 h-14 object-cover rounded bg-slate-800 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {person.fullName}
                      </span>
                      <Badge
                        variant={person.status === 'ACTIVE' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {person.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono">
                      {person.caseNumber} • Age {person.age}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {person.lastKnownLocation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Case Dossier (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          {selectedPerson ? (
            <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Case Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPerson.photoUrl}
                    alt={selectedPerson.fullName}
                    className="w-20 h-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {selectedPerson.fullName}
                      </h3>
                      <Badge
                        variant={selectedPerson.priority === 'CRITICAL' ? 'danger' : 'warning'}
                      >
                        {selectedPerson.priority} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-slate-500">
                      CASE FILE: {selectedPerson.caseNumber}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Age: {selectedPerson.age} • Gender: {selectedPerson.gender} • Reported:{' '}
                      {selectedPerson.reportedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canPerformAction('EDIT') && (
                    <select
                      value={selectedPerson.status}
                      onChange={(e) =>
                        updateMissingPersonStatus(selectedPerson.id, e.target.value as any)
                      }
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="ACTIVE">ACTIVE BULLETIN</option>
                      <option value="FOUND">DECLARED FOUND</option>
                      <option value="CLOSED">CASE CLOSED</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Case Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase text-slate-500">
                  Subject Physical Description & Circumstances
                </h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedPerson.description}
                </p>
              </div>

              {/* Assigned Investigator & Location Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">LAST KNOWN LOCATION</span>
                  <span className="font-bold text-slate-800">{selectedPerson.lastKnownLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ASSIGNED INVESTIGATOR</span>
                  <span className="font-bold text-slate-800">{selectedPerson.assignedInvestigator}</span>
                </div>
              </div>

              {/* Correlated Optical Sightings from City Cameras */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Optical AI Sightings Correlated to Case</span>
                  </h4>
                  <button
                    onClick={() => setActiveModule('person-intelligence')}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Open Person Intelligence
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {personRecords
                    .filter((p) => p.isWatchlistMatch)
                    .map((sighting) => (
                      <div key={sighting.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800 font-mono">
                            {sighting.cameraCode} — {sighting.cameraName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Timestamp: {sighting.timestamp} • Match Confidence:{' '}
                            {(sighting.matchConfidence! * 100).toFixed(1)}%
                          </div>
                        </div>
                        <Badge
                          variant={
                            sighting.verificationStatus === 'VERIFIED_MATCH'
                              ? 'success'
                              : sighting.verificationStatus === 'FALSE_POSITIVE'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {sighting.verificationStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select a missing person case from the registry to view dossier.
            </div>
          )}
        </div>
      </div>

      {/* New Bulletin Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Municipal Missing Person Bulletin"
        subtitle="Broadcast case file to city-wide CCTV and bus optical monitoring network."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="e.g. Jordan Mitchell"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Last Known Location *</label>
            <input
              type="text"
              required
              value={formData.lastKnownLocation}
              onChange={(e) => setFormData({ ...formData, lastKnownLocation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="e.g. Market St Station Concourse"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Clothing, physical traits, height, medical condition..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Broadcast Bulletin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

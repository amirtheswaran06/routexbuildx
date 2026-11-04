import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  MapPin,
  Lock,
  FileCheck,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { PersonRecord } from '../../../types/aerovis';

export const PersonIntelligenceModule: React.FC = () => {
  const { personRecords, verifyPersonMatch, setSelectedCameraId, setActiveModule } = useAerovis();
  const { canPerformAction, currentUser } = useAuth();

  const [selectedRecord, setSelectedRecord] = useState<PersonRecord | null>(personRecords[0] || null);
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = personRecords.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.verificationStatus === filterStatus;
  });

  const handleVerify = (status: 'VERIFIED_MATCH' | 'FALSE_POSITIVE') => {
    if (!selectedRecord || !canPerformAction('VERIFY')) return;
    verifyPersonMatch(selectedRecord.id, status, verificationNotes);
    setVerificationNotes('');
    // Update local selected state
    setSelectedRecord({
      ...selectedRecord,
      verificationStatus: status,
      verifiedBy: `${currentUser.name} (${currentUser.badgeNumber})`,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes: verificationNotes || selectedRecord.notes,
    });
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header with Strict Human Verification & Privacy Notice */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Person Intelligence & Authorized Sighting Verification</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict human-in-the-loop verification protocol. AI similarity percentages serve as investigative leads only.
          </p>
        </div>

        {/* Ethical Law Enforcement Notice Pill */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg text-amber-900 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Human Officer Sign-Off Required for Identification</span>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Sightings Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase text-slate-800">
              Sightings Stream ({filtered.length})
            </span>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="VERIFIED_MATCH">Verified Matches</option>
              <option value="FALSE_POSITIVE">False Positives</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filtered.map((pr) => {
              const isSelected = selectedRecord?.id === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => setSelectedRecord(pr)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer flex items-center gap-3 ${
                    isSelected ? 'bg-purple-50/80 border border-purple-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={pr.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}
                    alt="Sighting"
                    className="w-12 h-14 object-cover rounded bg-slate-900 shrink-0 border border-slate-200"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {pr.cameraCode}
                      </span>
                      <Badge
                        variant={
                          pr.verificationStatus === 'VERIFIED_MATCH'
                            ? 'success'
                            : pr.verificationStatus === 'FALSE_POSITIVE'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {pr.verificationStatus.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 font-medium truncate">
                      {pr.isWatchlistMatch
                        ? `Watchlist Match: ${(pr.matchConfidence! * 100).toFixed(1)}%`
                        : 'Routine Pedestrian'}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex justify-between">
                      <span>{pr.genderEstimate || 'Subject'}</span>
                      <span>{pr.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Human Verification Dossier & Action Terminal (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          {selectedRecord ? (
            <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Top Banner: Verification Status */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  selectedRecord.verificationStatus === 'VERIFIED_MATCH'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : selectedRecord.verificationStatus === 'FALSE_POSITIVE'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedRecord.verificationStatus === 'VERIFIED_MATCH' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : selectedRecord.verificationStatus === 'FALSE_POSITIVE' ? (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      Status: {selectedRecord.verificationStatus.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      {selectedRecord.verifiedBy
                        ? `Reviewed by ${selectedRecord.verifiedBy} at ${selectedRecord.verifiedAt}`
                        : 'Awaiting certified law enforcement officer verification.'}
                    </p>
                  </div>
                </div>

                {selectedRecord.matchConfidence && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono block opacity-75">
                      AI Similarity
                    </span>
                    <span className="text-lg font-bold font-mono">
                      {(selectedRecord.matchConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Subject Image & Optical Characteristics Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold font-mono uppercase text-slate-500">
                    Camera Snapshot Frame
                  </span>
                  <div className="h-56 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
                    <img
                      src={selectedRecord.imageUrl}
                      alt="Captured subject"
                      className="w-full h-full object-cover scanline-feed opacity-90"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                      {selectedRecord.cameraCode} // {selectedRecord.timestamp}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold font-mono uppercase text-slate-500">
                    Sighting Metadata
                  </span>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">CAMERA LOCATION:</span>
                      <span className="font-bold text-slate-800">{selectedRecord.cameraName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ESTIMATED GENDER:</span>
                      <span className="font-bold text-slate-800">{selectedRecord.genderEstimate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">UPPER CLOTHING:</span>
                      <span className="font-bold text-slate-800">{selectedRecord.clothingTop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LOWER CLOTHING:</span>
                      <span className="font-bold text-slate-800">{selectedRecord.clothingBottom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WATCHLIST CLASSIFICATION:</span>
                      <span className="font-bold text-purple-700">{selectedRecord.watchlistType || 'None'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Investigator Case Notes:
                    </span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                      {selectedRecord.notes || 'No investigator notes added.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Human Officer Sign-off Form */}
              {canPerformAction('VERIFY') && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    <span>Officer Human Verification Sign-Off</span>
                  </h4>

                  <textarea
                    rows={2}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter observation rationale (e.g. Verified subject facial profile against case registry; tattoos match...)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Action logged to immutable Super Admin audit ledger.
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircle className="w-4 h-4" />}
                        onClick={() => handleVerify('FALSE_POSITIVE')}
                      >
                        Declare False Positive
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => handleVerify('VERIFIED_MATCH')}
                      >
                        Confirm Verified Match
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs p-6 text-center">
              Select a person sighting from the stream to begin verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

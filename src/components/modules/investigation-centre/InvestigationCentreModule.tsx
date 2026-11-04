import React, { useState } from 'react';
import {
  Search,
  FileText,
  Clock,
  Layers,
  Camera,
  Car,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Plus,
  Send,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { ExportService } from '../../../services/exportService';
import { InvestigationCase } from '../../../types/aerovis';

export const InvestigationCentreModule: React.FC = () => {
  const {
    investigations,
    cameras,
    vehicleRecords,
    incidents,
    logAudit,
    setSelectedCameraId,
    setActiveModule,
  } = useAerovis();

  const { canPerformAction, currentUser } = useAuth();

  const [activeCase, setActiveCase] = useState<InvestigationCase | null>(
    investigations[0] || null
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');

  const filteredCases = investigations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leadInvestigator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCase = (c: InvestigationCase) => {
    setActiveCase(c);
    logAudit(
      'CASE_FILE_INSPECTION',
      `Case ${c.caseNumber}`,
      `Authorized investigator accessed case evidence files and camera correlation timeline.`
    );
  };

  const handleExportPdf = () => {
    if (!activeCase) return;
    const headers = ['Evidence Item ID', 'Type', 'Description / Title', 'Timestamp'];
    const rows = activeCase.evidenceItems.map((e) => [
      e.id,
      e.type,
      e.title,
      e.timestamp,
    ]);

    ExportService.exportToPdf(
      `Case_Brief_${activeCase.caseNumber}`,
      {
        title: `INVESTIGATION CASE BRIEF: ${activeCase.caseNumber}`,
        subtitle: activeCase.title,
        generatedBy: currentUser.name,
        badgeNumber: currentUser.badgeNumber,
      },
      headers,
      rows,
      [
        { label: 'STATUS', value: activeCase.status },
        { label: 'LEAD DETECTIVE', value: activeCase.leadInvestigator },
        { label: 'EVIDENCE COUNT', value: activeCase.evidenceItems.length },
      ]
    );

    logAudit(
      'CASE_REPORT_EXPORT_PDF',
      `Case ${activeCase.caseNumber}`,
      'Exported official municipal investigation PDF dossier'
    );
  };

  const handleAddCaseNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !activeCase) return;
    const noteObj = {
      id: `cn-${Date.now()}`,
      author: `${currentUser.name} (${currentUser.badgeNumber})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: newNote.trim(),
    };
    activeCase.notes.push(noteObj);
    setNewNote('');
    logAudit(
      'ADD_INVESTIGATION_NOTE',
      `Case ${activeCase.caseNumber}`,
      `Appended formal detective notation: ${noteObj.content}`
    );
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Export Options */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Investigation Centre & Cross-Source Forensic Correlation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized optical timeline analysis, multi-camera correlation and forensic evidence aggregation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCase && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportPdf}
            >
              Export Case Dossier (PDF)
            </Button>
          )}
        </div>
      </div>

      {/* Main Workspace Frame (3-Column Split: Case Files 4 Cols | Evidence & Journal 8 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Case Files List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases by #, title, investigator..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredCases.map((c) => {
              const isSelected = activeCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">{c.caseNumber}</span>
                    <Badge variant={c.status === 'IN_PROGRESS' ? 'primary' : 'neutral'} size="sm">
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">{c.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.leadInvestigator}</p>

                  <div className="text-[10px] text-slate-400 font-mono mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span>{c.evidenceItems.length} Evidence Items</span>
                    <span>{c.updatedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Forensic Evidence Board & Investigation Workspace (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          {activeCase ? (
            <div className="h-full flex flex-col overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Case Header */}
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-blue-600">{activeCase.caseNumber}</span>
                  <Badge variant="primary">{activeCase.status}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{activeCase.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {activeCase.summary}
                </p>
              </div>

              {/* Correlated Entities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    CORRELATED CAMERAS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCase.correlatedCameras.map((camId) => {
                      const cam = cameras.find((c) => c.id === camId);
                      return (
                        <button
                          key={camId}
                          onClick={() => {
                            setSelectedCameraId(camId);
                            setActiveModule('live-monitoring');
                          }}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                          {cam?.code || camId}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    CORRELATED LICENSE PLATES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCase.correlatedPlates.map((plate) => (
                      <span
                        key={plate}
                        className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold"
                      >
                        {plate}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evidence Board Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Evidence Files & Forensics ({activeCase.evidenceItems.length})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeCase.evidenceItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between"
                    >
                      {item.url ? (
                        <div className="h-28 rounded bg-slate-900 mb-2 overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-28 rounded bg-slate-200 mb-2 flex items-center justify-center text-slate-400 font-mono text-[10px]">
                          DATA LOG / GPS FIX
                        </div>
                      )}
                      <div>
                        <Badge variant="neutral" size="sm">
                          {item.type}
                        </Badge>
                        <h5 className="text-xs font-bold text-slate-800 mt-1 leading-snug truncate">
                          {item.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigator Case Notes Journal */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold font-mono uppercase text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detective Notes & Hypothesis Journal</span>
                </h4>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {activeCase.notes.map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span className="font-bold text-slate-700">{n.author}</span>
                        <span>{n.timestamp}</span>
                      </div>
                      <p className="text-slate-800 leading-snug">{n.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCaseNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter detective lead, trajectory hypothesis, warrant record..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                    Save Note
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select an active investigation case to open the forensic workspace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

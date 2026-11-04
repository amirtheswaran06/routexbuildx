import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Filter,
  Activity,
  Car,
  AlertTriangle,
  Bus,
  Cpu,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { ExportService } from '../../../services/exportService';

type ReportType =
  | 'CAMERA_ACTIVITY'
  | 'TRAFFIC_ANALYTICS'
  | 'VEHICLE_DETECTIONS'
  | 'INCIDENTS_SUMMARY'
  | 'NETWORK_HEALTH'
  | 'BUS_FLEET_ACTIVITY'
  | 'AI_DETECTIONS';

export const ReportsModule: React.FC = () => {
  const { cameras, trafficData, vehicleRecords, incidents, detections, buses, logAudit } =
    useAerovis();
  const { currentUser, canPerformAction } = useAuth();

  const [selectedReport, setSelectedReport] = useState<ReportType>('CAMERA_ACTIVITY');
  const [dateRange, setDateRange] = useState<'24H' | '7D' | '30D'>('24H');

  const reportCards = [
    {
      id: 'CAMERA_ACTIVITY' as ReportType,
      title: 'Daily Camera Network Activity',
      desc: 'Operational uptime, packet loss, resolution and frame health across all municipal transceivers.',
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      recordsCount: cameras.length,
    },
    {
      id: 'TRAFFIC_ANALYTICS' as ReportType,
      title: 'Traffic Density & Congestion Index',
      desc: 'Zone-by-zone velocity distribution, peak bottleneck analyses and modal split.',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      recordsCount: trafficData.length,
    },
    {
      id: 'VEHICLE_DETECTIONS' as ReportType,
      title: 'ANPR Vehicle Intelligence Log',
      desc: 'Registered license plates, hotlist vehicle hits, velocities and movement vectors.',
      icon: <Car className="w-5 h-5 text-indigo-600" />,
      recordsCount: vehicleRecords.length,
    },
    {
      id: 'INCIDENTS_SUMMARY' as ReportType,
      title: 'Incidents & Accident Summary',
      desc: 'Chronological accident logs, hit-and-run files, priority levels and officer closures.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      recordsCount: incidents.length,
    },
    {
      id: 'AI_DETECTIONS' as ReportType,
      title: 'AI Computer Vision Classifications',
      desc: 'Neural model inference results, confidence scores, violations and optical detections.',
      icon: <Cpu className="w-5 h-5 text-purple-600" />,
      recordsCount: detections.length,
    },
    {
      id: 'BUS_FLEET_ACTIVITY' as ReportType,
      title: 'Transit Bus Moving Platform Fleet',
      desc: 'Public transit bus platform telemetry, GPS coordinates, route coverage and mobile stream links.',
      icon: <Bus className="w-5 h-5 text-amber-600" />,
      recordsCount: buses.length,
    },
  ];

  const handleExportCsv = () => {
    if (!canPerformAction('EXPORT')) {
      alert('Your user role lacks permission to export municipal intelligence logs.');
      return;
    }

    if (selectedReport === 'CAMERA_ACTIVITY') {
      const headers = ['Code', 'Name', 'Type', 'Zone', 'IP Address', 'Status', 'FPS', 'Resolution'];
      const rows = cameras.map((c) => [c.code, c.name, c.type, c.zone, c.ipAddress, c.status, c.fps, c.resolution]);
      ExportService.exportToCsv('AEROVIS_Camera_Network_Activity', headers, rows);
    } else if (selectedReport === 'VEHICLE_DETECTIONS') {
      const headers = ['Plate Number', 'Make', 'Model', 'Color', 'Speed', 'Camera Code', 'Watchlist Hit', 'Timestamp'];
      const rows = vehicleRecords.map((v) => [v.plateNumber, v.make, v.model, v.color, `${v.speedKmH} km/h`, v.cameraCode, v.isWatchlist ? 'YES' : 'NO', v.timestamp]);
      ExportService.exportToCsv('AEROVIS_Vehicle_ANPR_Summary', headers, rows);
    } else if (selectedReport === 'INCIDENTS_SUMMARY') {
      const headers = ['Incident Number', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Assigned Officer', 'Timestamp'];
      const rows = incidents.map((i) => [i.incidentNumber, i.title, i.category, i.priority, i.status, i.locationName, i.assignedOfficer || 'Unassigned', i.timestamp]);
      ExportService.exportToCsv('AEROVIS_Incidents_Log', headers, rows);
    } else if (selectedReport === 'AI_DETECTIONS') {
      const headers = ['Detection ID', 'Camera Code', 'Category', 'Label', 'Confidence', 'Timestamp', 'Is Demo'];
      const rows = detections.map((d) => [d.id, d.cameraCode, d.category, d.label, `${(d.confidence * 100).toFixed(1)}%`, d.timestamp, d.isDemo ? 'YES' : 'NO']);
      ExportService.exportToCsv('AEROVIS_AI_Inference_Detections', headers, rows);
    } else {
      const headers = ['Zone', 'Vehicle Count', 'Average Speed (km/h)', 'Density %', 'Congestion Level'];
      const rows = trafficData.map((t) => [t.zone, t.vehicleCount, `${t.avgSpeedKmH} km/h`, `${t.currentDensity}%`, t.congestionLevel]);
      ExportService.exportToCsv('AEROVIS_Traffic_Density_Report', headers, rows);
    }

    logAudit('EXPORT_CSV', selectedReport, 'Exported structured CSV municipal record');
  };

  const handleExportPdf = () => {
    if (!canPerformAction('EXPORT')) {
      alert('Your user role lacks permission to export municipal intelligence logs.');
      return;
    }

    const currentCard = reportCards.find((c) => c.id === selectedReport)!;

    if (selectedReport === 'INCIDENTS_SUMMARY') {
      const headers = ['Case #', 'Title', 'Category', 'Priority', 'Status', 'Officer', 'Time'];
      const rows = incidents.map((i) => [
        i.incidentNumber,
        i.title,
        i.category,
        i.priority,
        i.status,
        i.assignedOfficer || 'Pending',
        i.timestamp.split(' ')[1] || i.timestamp,
      ]);
      ExportService.exportToPdf(
        'AEROVIS_Incident_Summary_Report',
        {
          title: currentCard.title,
          generatedBy: currentUser.name,
          badgeNumber: currentUser.badgeNumber,
        },
        headers,
        rows,
        [
          { label: 'TOTAL INCIDENTS', value: incidents.length },
          { label: 'CRITICAL PRIORITY', value: incidents.filter((i) => i.priority === 'CRITICAL').length },
          { label: 'RESOLVED CASES', value: incidents.filter((i) => i.status === 'RESOLVED').length },
        ]
      );
    } else if (selectedReport === 'VEHICLE_DETECTIONS') {
      const headers = ['Plate', 'Vehicle Make / Model', 'Speed', 'Camera Junction', 'Watchlist', 'Timestamp'];
      const rows = vehicleRecords.map((v) => [
        v.plateNumber,
        `${v.make} ${v.model} (${v.color})`,
        `${v.speedKmH} km/h`,
        v.cameraCode,
        v.isWatchlist ? 'HOTLIST HIT' : 'Clear',
        v.timestamp,
      ]);
      ExportService.exportToPdf(
        'AEROVIS_ANPR_Vehicle_Intelligence',
        {
          title: currentCard.title,
          generatedBy: currentUser.name,
          badgeNumber: currentUser.badgeNumber,
        },
        headers,
        rows,
        [
          { label: 'TOTAL READS', value: vehicleRecords.length },
          { label: 'WATCHLIST HITS', value: vehicleRecords.filter((v) => v.isWatchlist).length },
        ]
      );
    } else {
      const headers = ['Code', 'Name', 'Type', 'Zone', 'IP Address', 'Resolution', 'Status'];
      const rows = cameras.map((c) => [c.code, c.name, c.type, c.zone, c.ipAddress, c.resolution, c.status]);
      ExportService.exportToPdf(
        'AEROVIS_Camera_Network_Health',
        {
          title: currentCard.title,
          generatedBy: currentUser.name,
          badgeNumber: currentUser.badgeNumber,
        },
        headers,
        rows,
        [
          { label: 'TOTAL CAMERAS', value: cameras.length },
          { label: 'ONLINE UNITS', value: cameras.filter((c) => c.status === 'ONLINE').length },
        ]
      );
    }

    logAudit('EXPORT_PDF', selectedReport, 'Generated official municipal PDF report');
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Official Reporting, Audit Summaries & Export Centre</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate formal law enforcement documentation, traffic congestion charts and camera health dossiers in PDF and CSV format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="24H">Reporting Window: Last 24 Hours</option>
            <option value="7D">Reporting Window: 7-Day Range</option>
            <option value="30D">Reporting Window: Monthly Aggregate</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportPdf}
          >
            Generate Official PDF
          </Button>
        </div>
      </div>

      {/* Main Workspace: Left Report Selectors (4 Cols) | Right Live Tabular Preview (8 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Report Type Cards (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <span className="text-xs font-bold font-mono uppercase text-slate-800">
              Select Municipal Report Template
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {reportCards.map((rc) => {
              const isSelected = selectedReport === rc.id;
              return (
                <div
                  key={rc.id}
                  onClick={() => setSelectedReport(rc.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500/20'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      {rc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{rc.title}</h4>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {rc.recordsCount} Rows
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                        {rc.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Tabular Preview (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-0">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800">
                Live Data Preview (Ready for PDF/CSV Export)
              </h3>
              <p className="text-[11px] text-slate-500">
                Generated under authorization of {currentUser.name} ({currentUser.badgeNumber})
              </p>
            </div>
            <Badge variant="primary">Confidential Law Enforcement</Badge>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {selectedReport === 'CAMERA_ACTIVITY' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Zone</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">FPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cameras.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.code}</td>
                      <td className="py-2 px-3">{c.name}</td>
                      <td className="py-2 px-3">{c.type}</td>
                      <td className="py-2 px-3">{c.zone}</td>
                      <td className="py-2 px-3">
                        <Badge variant={c.status === 'ONLINE' ? 'success' : 'danger'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-mono">{c.fps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'INCIDENTS_SUMMARY' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Incident #</th>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Assigned Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {i.incidentNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">{i.title}</td>
                      <td className="py-2 px-3">{i.category.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-3">
                        <Badge variant={i.priority === 'CRITICAL' ? 'danger' : 'warning'}>
                          {i.priority}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="primary">{i.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2 px-3">{i.assignedOfficer || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'VEHICLE_DETECTIONS' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Plate</th>
                    <th className="py-2 px-3">Make / Model</th>
                    <th className="py-2 px-3">Speed</th>
                    <th className="py-2 px-3">Camera</th>
                    <th className="py-2 px-3">Watchlist</th>
                    <th className="py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicleRecords.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 bg-slate-50">
                        {v.plateNumber}
                      </td>
                      <td className="py-2 px-3">
                        {v.make} {v.model} ({v.color})
                      </td>
                      <td className="py-2 px-3 font-mono">{v.speedKmH} km/h</td>
                      <td className="py-2 px-3 font-mono">{v.cameraCode}</td>
                      <td className="py-2 px-3">
                        {v.isWatchlist ? (
                          <Badge variant="danger">STOLEN HIT</Badge>
                        ) : (
                          <Badge variant="neutral">Clear</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{v.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'AI_DETECTIONS' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Label</th>
                    <th className="py-2 px-3">Camera</th>
                    <th className="py-2 px-3">Confidence</th>
                    <th className="py-2 px-3">Inference Source</th>
                    <th className="py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detections.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <Badge variant="primary">{d.category.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">{d.label}</td>
                      <td className="py-2 px-3 font-mono">{d.cameraCode}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                        {(d.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={d.isDemo ? 'warning' : 'success'}>
                          {d.isDemo ? 'Demonstration Dataset' : 'Edge CV Model'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{d.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(selectedReport === 'TRAFFIC_ANALYTICS' || selectedReport === 'BUS_FLEET_ACTIVITY') && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Zone / Unit</th>
                    <th className="py-2 px-3">Volume / Speed</th>
                    <th className="py-2 px-3">Congestion / Status</th>
                    <th className="py-2 px-3">Telemetry Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trafficData.map((t) => (
                    <tr key={t.zone} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{t.zone}</td>
                      <td className="py-2 px-3 font-mono">{t.vehicleCount} vehicles / hr ({t.avgSpeedKmH} km/h)</td>
                      <td className="py-2 px-3">
                        <Badge variant="warning">{t.congestionLevel}</Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-emerald-600">Optimal Sensor Ping</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

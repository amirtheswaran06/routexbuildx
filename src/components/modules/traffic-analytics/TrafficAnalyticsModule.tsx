import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Car,
  Clock,
  Layers,
  Filter,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAerovis } from '../../../context/AerovisContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { ExportService } from '../../../services/exportService';
import { useAuth } from '../../../context/AuthContext';

export const TrafficAnalyticsModule: React.FC = () => {
  const { trafficData, vehicleRecords, incidents } = useAerovis();
  const { currentUser } = useAuth();

  const [selectedZoneName, setSelectedZoneName] = useState<string>(trafficData[0]?.zone || 'Downtown Central');
  const [timeRange, setTimeRange] = useState<string>('TODAY');

  const activeZoneData =
    trafficData.find((d) => d.zone === selectedZoneName) || trafficData[0];

  const PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  const handleExportCsv = () => {
    const headers = ['Hour Interval', 'Vehicle Count', 'Average Speed (km/h)'];
    const rows = activeZoneData.hourlyVolume.map((h) => [h.hour, h.count, `${h.avgSpeed} km/h`]);
    ExportService.exportToCsv(`Traffic_Volume_${selectedZoneName.replace(/\s+/g, '_')}`, headers, rows);
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Traffic Volume, Congestion & Municipal Flow Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Zone density, velocity bottlenecks, modal vehicle classification and road impedance factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zone Selector */}
          <select
            value={selectedZoneName}
            onChange={(e) => setSelectedZoneName(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
          >
            {trafficData.map((d) => (
              <option key={d.zone} value={d.zone}>
                {d.zone}
              </option>
            ))}
          </select>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="TODAY">Last 24 Hours</option>
            <option value="PEAK">Peak Rush Hour</option>
            <option value="WEEK">7-Day Aggregation</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip for Selected Zone */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Current Density</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {activeZoneData.currentDensity}%
            </div>
          </div>
          <Badge
            variant={
              activeZoneData.congestionLevel === 'CRITICAL' || activeZoneData.congestionLevel === 'HEAVY'
                ? 'danger'
                : activeZoneData.congestionLevel === 'MODERATE'
                ? 'warning'
                : 'success'
            }
          >
            {activeZoneData.congestionLevel}
          </Badge>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Throughput</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {activeZoneData.vehicleCount.toLocaleString()} / hr
            </div>
          </div>
          <Car className="w-5 h-5 text-blue-600 opacity-80" />
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Mean Corridor Velocity</span>
            <div className="text-xl font-extrabold text-blue-600 mt-0.5">
              {activeZoneData.avgSpeedKmH} km/h
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-blue-600 opacity-80" />
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Active Incidents</span>
            <div className="text-xl font-extrabold text-amber-600 mt-0.5">
              {incidents.filter((i) => i.status !== 'CLOSED').length} Obstructions
            </div>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-600 opacity-80" />
        </div>
      </div>

      {/* Charts Grid - 2 Column Split (Independent Scroll / Layout) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-y-auto pr-1">
        {/* Left: Hourly Volume & Speed Trends Area Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800">
                Corridor Vehicle Volume vs Speed Variance
              </h3>
              <p className="text-[11px] text-slate-400">Real-time hourly detector sampling</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {selectedZoneName}
            </span>
          </div>

          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeZoneData.hourlyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Vehicle Volume"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#volGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="avgSpeed"
                  name="Mean Velocity (km/h)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spdGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Vehicle Classification Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-slate-800">
                Modal Vehicle Classification
              </h3>
              <p className="text-[11px] text-slate-400">ANPR / Edge Neural Model Breakdown</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeZoneData.vehicleBreakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {activeZoneData.vehicleBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Classification Table */}
            <div className="border-t border-slate-100 pt-2 space-y-1">
              {activeZoneData.vehicleBreakdown.map((item, idx) => (
                <div key={item.type} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium">{item.type}</span>
                  </div>
                  <div className="font-mono text-slate-500">
                    <span className="font-bold text-slate-800 mr-2">{item.count}</span>
                    <span>({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

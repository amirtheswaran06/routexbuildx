import React, { useState } from 'react';
import {
  Cpu,
  Filter,
  Search,
  Camera,
  Play,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Car,
  Layers,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAerovis } from '../../../context/AerovisContext';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { DetectionCategory, Detection } from '../../../types/aerovis';
import { AiInferenceService } from '../../../services/aiInferenceService';

export const AiDetectionModule: React.FC = () => {
  const { detections, cameras, addDetection, setSelectedCameraId, setActiveModule } = useAerovis();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'feed' | 'test-inference'>('feed');

  // Test Inference Workbench states
  const [selectedCameraForTest, setSelectedCameraForTest] = useState<string>(cameras[0]?.id || '');
  const [isInferencing, setIsInferencing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [demoFlagToggle, setDemoFlagToggle] = useState<boolean>(false);

  const categories: { label: string; value: DetectionCategory | 'ALL' }[] = [
    { label: 'All Detections', value: 'ALL' },
    { label: 'Vehicles', value: 'VEHICLE' },
    { label: 'License Plates (ANPR)', value: 'NUMBER_PLATE' },
    { label: 'Pedestrians / Persons', value: 'PERSON' },
    { label: 'Traffic Violations', value: 'TRAFFIC_VIOLATION' },
    { label: 'Road Hazards', value: 'ROAD_HAZARD' },
    { label: 'Accidents', value: 'ACCIDENT' },
    { label: 'Suspicious Incidents', value: 'SUSPICIOUS_INCIDENT' },
  ];

  const filteredDetections = detections.filter((d) => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesCamera = selectedCameraFilter === 'ALL' || d.cameraId === selectedCameraFilter;
    return matchesCategory && matchesCamera;
  });

  const handleRunInference = async () => {
    const cam = cameras.find((c) => c.id === selectedCameraForTest) || cameras[0];
    if (!cam) return;

    setIsInferencing(true);
    setTestResult(null);

    try {
      const res = await AiInferenceService.analyzeFrame(cam.streamUrl, {
        cameraId: cam.id,
        cameraCode: cam.code,
        cameraName: cam.name,
        isDemo: demoFlagToggle,
      });

      setTestResult(res);
      // Automatically commit the verified detection to the municipal ledger
      if (res.detections.length > 0) {
        res.detections.forEach((det) => addDetection(det));
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsInferencing(false);
    }
  };

  const selectedCamObj = cameras.find((c) => c.id === selectedCameraForTest) || cameras[0];

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Top Header & Mode Toggle Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>AI Computer Vision Inference & Analytics Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time neural inference streams, optical plate parsing, anomaly detection and benchmark validation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              activeTab === 'feed'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detection Feed ({filteredDetections.length})
          </button>
          <button
            onClick={() => setActiveTab('test-inference')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'test-inference'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Inference Workbench</span>
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Category Filter Pills & Camera Selector */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono text-[11px]">Source:</span>
              <select
                value={selectedCameraFilter}
                onChange={(e) => setSelectedCameraFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Cameras ({cameras.length})</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detections Grid - Fixed Height with Independent Scroll */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDetections.map((det) => {
                const isViolation =
                  det.category === 'TRAFFIC_VIOLATION' ||
                  det.category === 'ACCIDENT' ||
                  det.category === 'ROAD_HAZARD';
                const isWatchlist = det.label.includes('WATCHLIST');

                return (
                  <div
                    key={det.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-indigo-300 transition-all flex flex-col"
                  >
                    {/* Snapshot / Bounding Box Preview */}
                    <div className="relative h-40 bg-slate-950 overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          det.imageUrl ||
                          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={det.label}
                        className="w-full h-full object-cover opacity-90 scanline-feed"
                      />

                      {/* Bounding Box Indicator */}
                      {det.bbox && (
                        <div
                          className={`absolute border-2 pointer-events-none ${
                            isWatchlist
                              ? 'border-rose-500 bg-rose-500/20'
                              : isViolation
                              ? 'border-amber-400 bg-amber-400/20'
                              : 'border-emerald-400 bg-emerald-400/20'
                          }`}
                          style={{
                            left: `${det.bbox[0]}%`,
                            top: `${det.bbox[1]}%`,
                            width: `${det.bbox[2]}%`,
                            height: `${det.bbox[3]}%`,
                          }}
                        />
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          {det.cameraCode}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm ${
                            det.isDemo
                              ? 'bg-amber-900/90 text-amber-200 border border-amber-700'
                              : 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
                          }`}
                        >
                          {det.isDemo ? 'BENCHMARK DEMO' : 'LIVE EDGE INFERENCE'}
                        </span>
                      </div>

                      {/* Confidence Score Pill */}
                      <div className="absolute bottom-2 right-2 bg-slate-900/85 backdrop-blur-xs text-emerald-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700">
                        {(det.confidence * 100).toFixed(1)}% CONF
                      </div>
                    </div>

                    {/* Metadata Card Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <Badge
                            variant={
                              isWatchlist
                                ? 'danger'
                                : isViolation
                                ? 'warning'
                                : det.category === 'NUMBER_PLATE'
                                ? 'primary'
                                : 'purple'
                            }
                            size="sm"
                          >
                            {det.category.replace(/_/g, ' ')}
                          </Badge>

                          <span className="text-[11px] font-mono text-slate-400">
                            {det.timestamp.split(' ')[1] || det.timestamp}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                          {det.label}
                        </h4>

                        <p className="text-[11px] text-slate-500 mb-2">{det.cameraName}</p>

                        {/* Metadata Details */}
                        {det.metadata && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[10px] font-mono text-slate-600 space-y-0.5">
                            {det.metadata.plate && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">PLATE ID:</span>
                                <span className="font-bold text-slate-900">{det.metadata.plate}</span>
                              </div>
                            )}
                            {det.metadata.speed !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">SPEED:</span>
                                <span className="font-bold text-blue-600">{det.metadata.speed} km/h</span>
                              </div>
                            )}
                            {det.metadata.hazardType && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">HAZARD:</span>
                                <span className="font-bold text-amber-700">{det.metadata.hazardType}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setSelectedCameraId(det.cameraId);
                            setActiveModule('live-monitoring');
                          }}
                          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          View Live Camera
                        </button>

                        {det.metadata?.plate && (
                          <button
                            onClick={() => {
                              setActiveModule('vehicle-intelligence');
                            }}
                            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Trace Plate History
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Inference Workbench Panel */
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col p-4 shadow-2xs min-h-0">
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col gap-4 overflow-y-auto">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive AI Inference Execution Gateway
                </h3>
                <p className="text-xs text-slate-500">
                  Select a live stream buffer or edge transceiver to dispatch optical recognition frames through the AI gateway.
                </p>
              </div>

              {/* Mode Toggle Demo vs Real */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-mono text-slate-600 font-semibold">Mode:</span>
                <button
                  onClick={() => setDemoFlagToggle(!demoFlagToggle)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                    demoFlagToggle
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {demoFlagToggle ? 'Demonstration Dataset' : 'Edge Inference Model'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Left: Input Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Select Camera Feed to Analyze:
                </label>
                <select
                  value={selectedCameraForTest}
                  onChange={(e) => setSelectedCameraForTest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.type})
                    </option>
                  ))}
                </select>

                {/* Feed Preview */}
                <div className="h-52 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                  <img
                    src={selectedCamObj?.streamUrl}
                    alt="Preview"
                    className="w-full h-full object-cover scanline-feed opacity-90"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                    {selectedCamObj?.name}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={isInferencing}
                  onClick={handleRunInference}
                  icon={
                    isInferencing ? (
                      <Cpu className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )
                  }
                >
                  {isInferencing
                    ? 'Processing Vision Inference (Edge Tensor)...'
                    : 'Dispatch Live Inference Request'}
                </Button>
              </div>

              {/* Right: Inference Output Console */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                    <span className="text-[11px] text-blue-400 font-bold uppercase">
                      Inference Telemetry Console
                    </span>
                    <span className="text-[10px] text-slate-500">
                      GATEWAY: {AiInferenceService.getGatewayUrl()}
                    </span>
                  </div>

                  {testResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-400">MODEL ARCHITECTURE:</span>
                        <span className="text-emerald-400 font-bold">{testResult.model}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-400">LATENCY (ROUNDTRIP):</span>
                        <span className="text-blue-400 font-bold">{testResult.latencyMs} ms</span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-400 block mb-1">CLASSIFIED TARGETS:</span>
                        {testResult.detections.map((d: any, idx: number) => (
                          <div key={idx} className="text-slate-200 text-[11px] py-1 border-t border-slate-800/80">
                            • [{d.category}] {d.label} - Confidence: {(d.confidence * 100).toFixed(1)}%
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Successfully synchronized to municipal detections ledger.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 py-12 text-center text-xs">
                      Ready for frame dispatch. Click 'Dispatch Live Inference Request' to test computer vision model execution.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                  AEROVIS NEURAL RUNTIME // COMPLIANT WITH MUNICIPAL VISION STANDARD IEEE-2026
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

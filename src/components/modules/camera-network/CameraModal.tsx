import React, { useState, useEffect } from 'react';
import { Camera, CameraType, CameraStatus } from '../../../types/aerovis';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cameraData: any) => void;
  initialCamera?: Camera | null;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCamera,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'CCTV' as CameraType,
    locationName: '',
    zone: 'Downtown Central',
    latitude: 37.7858,
    longitude: -122.4065,
    ipAddress: '10.240.12.',
    streamUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    status: 'ONLINE' as CameraStatus,
    resolution: '1080p',
    fps: 30,
    coverageAngle: 90,
    direction: 'North',
    isDemo: false,
  });

  useEffect(() => {
    if (initialCamera) {
      setFormData({
        code: initialCamera.code,
        name: initialCamera.name,
        type: initialCamera.type,
        locationName: initialCamera.locationName,
        zone: initialCamera.zone,
        latitude: initialCamera.latitude,
        longitude: initialCamera.longitude,
        ipAddress: initialCamera.ipAddress,
        streamUrl: initialCamera.streamUrl,
        status: initialCamera.status,
        resolution: initialCamera.resolution,
        fps: initialCamera.fps,
        coverageAngle: initialCamera.coverageAngle,
        direction: initialCamera.direction,
        isDemo: initialCamera.isDemo,
      });
    } else {
      // Auto-generate next camera code
      const randNum = Math.floor(100 + Math.random() * 900);
      setFormData((prev) => ({
        ...prev,
        code: `CAM-DT-${randNum}`,
        name: `City Junction Unit ${randNum}`,
        locationName: 'Downtown Metropolitan Crossing',
        ipAddress: `10.240.15.${Math.floor(10 + Math.random() * 89)}`,
      }));
    }
  }, [initialCamera, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCamera ? `Edit Camera: ${initialCamera.code}` : 'Register New Camera Node'}
      subtitle="Configure hardware parameters, GIS coordinates, streaming endpoint and zone assignment."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Camera Identifier Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. CAM-DT-105"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optical System Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CameraType })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="CCTV">CCTV (Standard Urban Surveillance)</option>
              <option value="ANPR">ANPR (High-Speed Plate Scanner)</option>
              <option value="TRAFFIC">Traffic Flow Junction Sensor</option>
              <option value="BUS">Bus Transit Platform Mobile Camera</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Camera Friendly Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Market St & 5th Ave Crossing"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Municipal Zone Assignment *
            </label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="Downtown Central">Downtown Central</option>
              <option value="Highway 101">Highway 101 Corridor</option>
              <option value="Tech Corridor">Tech Corridor / Mission Bay</option>
              <option value="Harbor Port">Harbor Port & Maritime</option>
              <option value="North District">North District Beach</option>
              <option value="Airport Corridor">Airport Corridor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Location / Street Intersection *
            </label>
            <input
              type="text"
              required
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 4th & Market St"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Edge IP Address *
            </label>
            <input
              type="text"
              required
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              placeholder="10.240.12.11"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Latitude (WGS-84) *
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Longitude (WGS-84) *
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Resolution
            </label>
            <select
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
            >
              <option value="4K (3840x2160)">4K UHD (3840x2160)</option>
              <option value="1080p (1920x1080)">1080p FHD (1920x1080)</option>
              <option value="720p (1280x720)">720p HD (1280x720)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Frame Rate (FPS)
            </label>
            <input
              type="number"
              value={formData.fps}
              onChange={(e) => setFormData({ ...formData, fps: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            RTSP / HLS / WebRTC Stream Endpoint URL *
          </label>
          <input
            type="text"
            required
            value={formData.streamUrl}
            onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
            placeholder="rtsp://gateway.aerovis.internal:8554/cam01 or https://..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {initialCamera ? 'Save Changes' : 'Register Camera'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

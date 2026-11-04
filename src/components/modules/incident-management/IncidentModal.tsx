import React, { useState } from 'react';
import { IncidentCategory, IncidentPriority, IncidentStatus } from '../../../types/aerovis';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAerovis } from '../../../context/AerovisContext';
import { useAuth } from '../../../context/AuthContext';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ isOpen, onClose }) => {
  const { cameras, addIncident } = useAerovis();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: 'ROAD_ACCIDENT' as IncidentCategory,
    priority: 'HIGH' as IncidentPriority,
    status: 'NEW' as IncidentStatus,
    locationName: 'Market St & 4th Ave Crossing',
    latitude: 37.7858,
    longitude: -122.4065,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    cameraId: cameras[0]?.id || '',
    assignedOfficer: currentUser.name,
    assignedOfficerId: currentUser.id,
    description: '',
  });

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    const cam = cameras.find((c) => c.id === camId);
    if (cam) {
      setFormData({
        ...formData,
        cameraId: cam.id,
        locationName: cam.name,
        latitude: cam.latitude,
        longitude: cam.longitude,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cam = cameras.find((c) => c.id === formData.cameraId);
    addIncident({
      ...formData,
      cameraCode: cam?.code,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Law Enforcement / Traffic Incident Case"
      subtitle="Register an operational incident with GIS fix, linked camera and priority tier."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Incident Headline *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Multi-Vehicle Collision on Bay Bridge Overpass"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Incident Classification *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none"
            >
              <option value="ROAD_ACCIDENT">Road Accident</option>
              <option value="HIT_AND_RUN">Hit and Run</option>
              <option value="TRAFFIC_VIOLATION">Traffic Violation</option>
              <option value="ROAD_HAZARD">Road Hazard</option>
              <option value="MISSING_VEHICLE">Missing / Stolen Vehicle</option>
              <option value="SECURITY_ALERT">Security Alert</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Priority Level *</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as IncidentPriority })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none"
            >
              <option value="CRITICAL">Critical (Immediate Dispatch)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low / Routine</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Correlated Optical Camera Node *</label>
          <select
            value={formData.cameraId}
            onChange={handleCameraChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name} ({c.zone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Location Details *</label>
          <input
            type="text"
            required
            value={formData.locationName}
            onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Case Description & Officer Dispatch Summary *</label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe vehicle plates involved, injuries, lane closures, emergency response status..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Log Incident File
          </Button>
        </div>
      </form>
    </Modal>
  );
};

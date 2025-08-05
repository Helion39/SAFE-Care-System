import React, { useState, useEffect } from 'react';
import { Camera, Play, Pause, AlertTriangle, Maximize2, Volume2, VolumeX } from 'lucide-react';

interface CameraMonitoringProps {
  data: any;
  onTriggerAlert: (residentId: string) => void;
}

export function CameraMonitoring({ data, onTriggerAlert }: CameraMonitoringProps) {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: string]: boolean }>({});
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState<{ [key: string]: boolean }>({});

  const cameras = data.camera_info || [];
  const residents = data.residents || [];

  const getCameraResident = (roomNumber: string) => {
    return residents.find((r: any) => (r.room || r.room_number) === roomNumber);
  };

  const toggleRecording = (cameraId: string) => {
    setIsRecording(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  };

  const toggleMute = (cameraId: string) => {
    setIsMuted(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  };

  const toggleFallDetection = (cameraId: string) => {
    setFallDetectionEnabled(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  };

  const simulateFallDetection = (cameraId: string) => {
    const camera = cameras.find((c: any) => c.id === cameraId);
    const resident = getCameraResident(camera?.room_number);
    if (resident) {
      onTriggerAlert(resident.id || resident._id);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="card-header">
        <Camera />
        Camera Monitoring System
      </div>

      {/* Camera Grid */}
      <div className="grid grid-2">
        {cameras.map((camera: any) => {
          const resident = getCameraResident(camera.room_number);
          const isActive = camera.status === 'active';
          const isSelected = selectedCamera === camera.id.toString();
          
          return (
            <div key={camera.id} className="card">
              {/* Camera Header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600' }}>
                    Room {camera.room_number}
                  </h3>
                  {resident && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                      {resident.name}
                    </p>
                  )}
                </div>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                  {isActive ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Camera Feed */}
              <div 
                className={`relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                style={{ aspectRatio: '16/9' }}
                onClick={() => setSelectedCamera(isSelected ? null : camera.id.toString())}
              >
                {isActive ? (
                  <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                    <div className="text-center">
                      <Camera style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
                      <p>Camera Feed</p>
                      <p style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>
                        Room {camera.room_number}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-300 text-gray-600">
                    <div className="text-center">
                      <AlertTriangle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
                      <p>Camera Offline</p>
                    </div>
                  </div>
                )}

                {/* Camera Controls Overlay */}
                {isActive && (
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRecording(camera.id.toString());
                        }}
                        className={`btn btn-sm ${isRecording[camera.id] ? 'btn-error' : 'btn-secondary'}`}
                        style={{ minWidth: 'auto', padding: '0.25rem' }}
                      >
                        {isRecording[camera.id] ? (
                          <Pause style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <Play style={{ width: '1rem', height: '1rem' }} />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute(camera.id.toString());
                        }}
                        className="btn btn-sm btn-secondary"
                        style={{ minWidth: 'auto', padding: '0.25rem' }}
                      >
                        {isMuted[camera.id] ? (
                          <VolumeX style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <Volume2 style={{ width: '1rem', height: '1rem' }} />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCamera(camera.id.toString());
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ minWidth: 'auto', padding: '0.25rem' }}
                    >
                      <Maximize2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Fall Detection Controls */}
              {isActive && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                      Fall Detection AI
                    </span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={fallDetectionEnabled[camera.id] || false}
                        onChange={() => toggleFallDetection(camera.id.toString())}
                        className="w-4 h-4"
                      />
                      <span style={{ fontSize: 'var(--text-sm)' }}>Enabled</span>
                    </label>
                  </div>
                  
                  {fallDetectionEnabled[camera.id] && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => simulateFallDetection(camera.id)}
                        className="btn btn-sm btn-warning"
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        Test Fall Detection
                      </button>
                      <span className="badge badge-success" style={{ fontSize: 'var(--text-xs)' }}>
                        AI Active
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Info */}
              <div className="mt-2 text-xs text-gray-500">
                Last checked: {new Date(camera.last_checked).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Camera Full View */}
      {selectedCamera && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600' }}>
              Room {cameras.find((c: any) => c.id.toString() === selectedCamera)?.room_number} - Full View
            </h3>
            <button
              onClick={() => setSelectedCamera(null)}
              className="btn btn-sm btn-secondary"
            >
              Close
            </button>
          </div>
          
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden"
            style={{ aspectRatio: '16/9', minHeight: '400px' }}
          >
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Camera style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: 'var(--text-lg)' }}>Full Screen Camera Feed</p>
                <p style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>
                  Room {cameras.find((c: any) => c.id.toString() === selectedCamera)?.room_number}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
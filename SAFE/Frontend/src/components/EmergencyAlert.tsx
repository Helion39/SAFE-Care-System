import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';

export function EmergencyAlert({ incident, currentUser, onClaim }) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const detectionTime = new Date(incident.detection_time);
      const elapsed = Math.floor((now.getTime() - detectionTime.getTime()) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [incident.detection_time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="emergency-alert">
      <div className="emergency-alert-content">
        <div className="flex items-center gap-2">
          <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-error">EMERGENCY ALERT</span>
              <span style={{ fontWeight: '600' }}>
                {incident.resident_name}
              </span>
            </div>
            <div className="flex items-center gap-3" style={{ fontSize: 'var(--text-sm)' }}>
              <div className="flex items-center gap-1">
                <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                Room {incident.room_number}
              </div>
              <div className="flex items-center gap-1">
                <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                {formatTime(timeElapsed)} elapsed
              </div>
            </div>
          </div>
        </div>
        
        {currentUser.role === 'caregiver' && (
          <button 
            onClick={() => {
              console.log('🔍 Claiming incident:', incident.id, 'Full incident:', incident);
              onClaim(incident.id);
            }}
            className="btn btn-error btn-sm"
          >
            CLAIM INCIDENT
          </button>
        )}
      </div>
    </div>
  );
}
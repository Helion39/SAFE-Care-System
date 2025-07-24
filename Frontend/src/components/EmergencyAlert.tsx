import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
    <div style={{ 
      position: 'fixed', 
      top: '1rem', 
      left: '1rem', 
      right: '1rem', 
      zIndex: 50,
      animation: 'pulse 1s infinite'
    }}>
      <div className="healthcare-alert healthcare-alert-danger" style={{ 
        border: '2px solid var(--healthcare-danger)',
        backgroundColor: '#f8d7da'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: '#dc3545' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="healthcare-badge healthcare-badge-danger">EMERGENCY ALERT</span>
                <span style={{ fontWeight: '600', color: '#721c24' }}>
                  {incident.resident_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: '#721c24' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                  Room {incident.room_number}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                  {formatTime(timeElapsed)} elapsed
                </div>
              </div>
            </div>
          </div>
          
          {currentUser.role === 'caregiver' && (
            <button 
              onClick={() => onClaim(incident.id)}
              className="healthcare-btn healthcare-btn-danger"
              style={{ 
                animation: 'bounce 1s infinite',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem'
              }}
            >
              CLAIM INCIDENT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
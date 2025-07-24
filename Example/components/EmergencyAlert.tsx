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
      const elapsed = Math.floor((now - detectionTime) / 1000);
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
    <div className="fixed top-4 left-4 right-4 z-50 animate-pulse">
      <Alert className="border-red-500 bg-red-50 border-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">EMERGENCY ALERT</Badge>
                <span className="font-semibold text-red-800">
                  {incident.resident_name}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-red-700">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Room {incident.room_number}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeElapsed)} elapsed
                </div>
              </div>
            </div>
          </div>
          
          {currentUser.role === 'caregiver' && (
            <Button 
              onClick={() => onClaim(incident.id)}
              className="bg-red-600 hover:bg-red-700 text-white animate-bounce"
              size="sm"
            >
              CLAIM INCIDENT
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
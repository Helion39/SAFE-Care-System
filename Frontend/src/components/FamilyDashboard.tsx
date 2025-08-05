import React, { useState } from 'react';
import { Heart, Phone, Calendar, Activity, AlertCircle, User } from 'lucide-react';

interface FamilyDashboardProps {
  data: any;
  currentUser: any;
  onLogout: () => void;
}

export function FamilyDashboard({ data, currentUser, onLogout }: FamilyDashboardProps) {
  // Find resident by assigned resident ID
  const resident = data.residents.find((r: any) => 
    (r._id || r.id) === currentUser.assignedResidentId
  );

  if (!resident) {
    return (
      <div className="healthcare-container" style={{ paddingTop: '2rem' }}>
        <div className="healthcare-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <User style={{ width: '4rem', height: '4rem', color: 'var(--healthcare-gray-400)', margin: '0 auto 1rem' }} />
          <h2>No Resident Associated</h2>
          <p style={{ color: 'var(--healthcare-gray-600)', marginBottom: '2rem' }}>
            Your account is not currently linked to any resident. Please contact the facility administrator.
          </p>
          <button onClick={onLogout} className="healthcare-btn healthcare-btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const residentId = resident._id || resident.id;
  
  const latestVitals = data.vitals
    .filter((v: any) => (v.residentId || v.resident_id) === residentId)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const recentIncidents = data.incidents
    .filter((i: any) => (i.residentId || i.resident_id) === residentId)
    .sort((a: any, b: any) => new Date(b.detectionTime || b.detection_time).getTime() - new Date(a.detectionTime || a.detection_time).getTime())
    .slice(0, 5);

  return (
    <div className="healthcare-container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div className="healthcare-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {resident.name}'s Care Information
            </h1>
            <p style={{ color: 'var(--healthcare-gray-600)' }}>
              Welcome, {currentUser.name} • Room {resident.room}
            </p>
          </div>
          <button onClick={onLogout} className="healthcare-btn healthcare-btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="healthcare-grid healthcare-grid-2">
        {/* Resident Info */}
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <User />
            Resident Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>Age</label>
              <p style={{ fontWeight: '500' }}>{resident.age} years old</p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>Room</label>
              <p style={{ fontWeight: '500' }}>Room {resident.room}</p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>Medical Conditions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {resident.medicalConditions?.length > 0 ? (
                  resident.medicalConditions.map((condition: string, index: number) => (
                    <span key={index} className="healthcare-badge healthcare-badge-secondary">
                      {condition}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--healthcare-gray-500)' }}>None listed</span>
                )}
              </div>
            </div>
            {resident.assignedCaregiver && (
              <div>
                <label style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>Assigned Caregiver</label>
                <p style={{ fontWeight: '500' }}>{resident.assignedCaregiver.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Vitals */}
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <Activity />
            Latest Vitals
          </div>
          {latestVitals ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Blood Pressure</span>
                <span style={{ fontWeight: '500' }}>
                  {latestVitals.systolicBP}/{latestVitals.diastolicBP} mmHg
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Heart Rate</span>
                <span style={{ fontWeight: '500' }}>{latestVitals.heartRate} bpm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Temperature</span>
                <span style={{ fontWeight: '500' }}>{latestVitals.temperature}°F</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>
                Last checked: {new Date(latestVitals.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--healthcare-gray-500)', textAlign: 'center', padding: '2rem' }}>
              No vitals recorded yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="healthcare-card" style={{ marginTop: '2rem' }}>
        <div className="healthcare-card-header">
          <AlertCircle />
          Recent Incidents
        </div>
        {recentIncidents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentIncidents.map((incident: any) => (
              <div 
                key={incident.id} 
                style={{ 
                  padding: '1rem',
                  border: '1px solid var(--healthcare-gray-200)',
                  borderRadius: '0.5rem',
                  backgroundColor: incident.status === 'resolved' ? 'var(--healthcare-success-light)' : 'var(--healthcare-warning-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {incident.type} - {incident.severity}
                  </span>
                  <span className={`healthcare-badge ${
                    incident.status === 'resolved' ? 'healthcare-badge-success' : 
                    incident.status === 'claimed' ? 'healthcare-badge-warning' : 'healthcare-badge-danger'
                  }`}>
                    {incident.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)', marginBottom: '0.5rem' }}>
                  {incident.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--healthcare-gray-500)' }}>
                  {new Date(incident.detectionTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--healthcare-gray-500)', textAlign: 'center', padding: '2rem' }}>
            No recent incidents
          </p>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="healthcare-card" style={{ marginTop: '2rem' }}>
        <div className="healthcare-card-header">
          <Phone />
          Emergency Contact
        </div>
        <div style={{ 
          padding: '1rem',
          backgroundColor: 'var(--healthcare-primary-light)',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Facility Emergency Line
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--healthcare-primary)' }}>
            (555) 123-4567
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-600)' }}>
            Available 24/7 for emergencies
          </p>
        </div>
      </div>
    </div>
  );
}
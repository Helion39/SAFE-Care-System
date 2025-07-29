import React, { useState } from 'react';
import { VitalsChart } from './VitalsChart';
import { generateHealthSummary } from './mockData';
import apiService from '../services/api';
import { 
  Activity, 
  TrendingUp, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Stethoscope,
  Brain
} from 'lucide-react';

export function CaregiverDashboard({ data, setData, currentUser, onTriggerAlert, onResolveIncident, onDataChange }) {
  const [vitalsForm, setVitalsForm] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: ''
  });
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Find assigned resident by looking through assignments data
  const caregiverId = currentUser._id || currentUser.id;
  const activeAssignment = data.assignments?.find(assignment => {
    const assignmentCaregiverId = assignment.caregiverId?._id || assignment.caregiverId?.id || assignment.caregiverId;
    return assignmentCaregiverId === caregiverId && assignment.isActive;
  });
  
  const assignedResident = activeAssignment 
    ? data.residents.find(r => {
        const residentId = r._id || r.id;
        const assignmentResidentId = activeAssignment.residentId?._id || activeAssignment.residentId?.id || activeAssignment.residentId;
        return residentId === assignmentResidentId;
      })
    : data.residents.find(r => {
        // Fallback: Check if resident has this caregiver assigned directly
        const assignedCaregiverId = r.assignedCaregiver?._id || r.assignedCaregiver || r.assigned_caregiver_id;
        return assignedCaregiverId === caregiverId;
      }) || data.residents.find(r => r.id === currentUser.assigned_resident_id); // Final fallback
  
  const residentVitals = assignedResident 
    ? data.vitals
        .filter(v => {
          const residentId = assignedResident._id || assignedResident.id;
          return v.resident_id === residentId || v.residentId === residentId;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const claimedIncidents = data.incidents.filter(
    i => i.claimed_by === currentUser.id && i.status === 'claimed'
  );

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    if (!assignedResident) return;

    const vitalsData = {
      residentId: assignedResident._id || assignedResident.id,
      systolicBP: parseInt(vitalsForm.systolic_bp),
      diastolicBP: parseInt(vitalsForm.diastolic_bp),
      heartRate: parseInt(vitalsForm.heart_rate)
      // Note: caregiverId is automatically set by backend from req.user.id
    };

    try {
      const response = await apiService.createVitals(vitalsData);
      if (response.success) {
        await onDataChange(); // Refresh data
        setVitalsForm({
          systolic_bp: '',
          diastolic_bp: '',
          heart_rate: ''
        });
      }
    } catch (error) {
      console.error('Failed to record vitals:', error);
      alert('Failed to record vitals: ' + error.message);
    }
  };

  const handleGenerateAISummary = () => {
    if (assignedResident) {
      const summary = generateHealthSummary(residentVitals, assignedResident.name);
      setAiSummary(summary);
      setShowAISummary(true);
    }
  };

  const handleIncidentResolution = (incidentId, isTrueEmergency) => {
    onResolveIncident(incidentId, isTrueEmergency);
  };

  if (!assignedResident) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24rem' }}>
        <div className="healthcare-card" style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <User style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#6c757d' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No Assignment</h3>
          <p style={{ color: '#6c757d' }}>
            You are not currently assigned to a resident. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const latestVitals = residentVitals[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Incident Response Section */}
      {claimedIncidents.length > 0 && (
        <div className="healthcare-card" style={{ backgroundColor: '#f8d7da', borderLeft: '4px solid var(--healthcare-danger)' }}>
          <div className="healthcare-card-header" style={{ color: '#721c24' }}>
            <AlertTriangle />
            Active Incident Response Required
          </div>
          {claimedIncidents.map(incident => (
            <div key={incident.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  Emergency detected for {incident.resident_name} in Room {incident.room_number}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                  Detected: {new Date(incident.detection_time).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Please verify the situation and confirm if this is a true emergency or false alarm.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleIncidentResolution(incident.id, true)}
                  className="healthcare-btn-emergency"
                >
                  <AlertTriangle style={{ width: '1rem', height: '1rem' }} />
                  Confirm Emergency
                </button>
                <button 
                  onClick={() => handleIncidentResolution(incident.id, false)}
                  className="healthcare-btn-false-alarm"
                >
                  <XCircle style={{ width: '1rem', height: '1rem' }} />
                  False Alarm
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resident Overview */}
      <div className="healthcare-card">
        <div className="healthcare-card-header">
          <User />
          {assignedResident.name}
        </div>
        <div className="healthcare-grid healthcare-grid-3">
          <div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Room:</strong> {assignedResident.room_number}
            </div>
            <div>
              <strong>Age:</strong> {assignedResident.age} years
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Medical Conditions:</strong>
            </div>
            <div>
              {assignedResident.medical_conditions.map((condition, index) => (
                <span key={index} style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>
                  {condition}{index < assignedResident.medical_conditions.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Latest Vitals:</strong>
            </div>
            {latestVitals ? (
              <div style={{ fontSize: '0.875rem' }}>
                <div>BP: {latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg</div>
                <div>HR: {latestVitals.heart_rate} bpm</div>
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  {new Date(latestVitals.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>No recent vitals</div>
            )}
          </div>
        </div>
      </div>

      <div className="healthcare-grid healthcare-grid-2">
        {/* Vitals Input */}
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <Stethoscope style={{ width: '1.25rem', height: '1.25rem' }} />
            Log Vital Signs
          </div>
          <form onSubmit={handleVitalsSubmit}>
            <div className="healthcare-grid healthcare-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="healthcare-form-group">
                <label className="healthcare-label" htmlFor="systolic">Systolic BP</label>
                <input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  className="healthcare-input"
                  value={vitalsForm.systolic_bp}
                  onChange={(e) => setVitalsForm(prev => ({
                    ...prev,
                    systolic_bp: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="healthcare-form-group">
                <label className="healthcare-label" htmlFor="diastolic">Diastolic BP</label>
                <input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  className="healthcare-input"
                  value={vitalsForm.diastolic_bp}
                  onChange={(e) => setVitalsForm(prev => ({
                    ...prev,
                    diastolic_bp: e.target.value
                  }))}
                  required
                />
              </div>
            </div>
            <div className="healthcare-form-group">
              <label className="healthcare-label" htmlFor="heartRate">Heart Rate (bpm)</label>
              <input
                id="heartRate"
                type="number"
                placeholder="72"
                className="healthcare-input"
                value={vitalsForm.heart_rate}
                onChange={(e) => setVitalsForm(prev => ({
                  ...prev,
                  heart_rate: e.target.value
                }))}
                required
              />
            </div>
            <button type="submit" className="healthcare-btn healthcare-btn-primary" style={{ width: '100%' }}>
              <CheckCircle style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Record Vitals
            </button>
          </form>
        </div>

        {/* AI Health Summary */}
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <Brain />
            AI Health Analysis
          </div>
          <div>
            <button 
              onClick={handleGenerateAISummary}
              disabled={residentVitals.length === 0}
              className="healthcare-btn healthcare-btn-primary"
              style={{ width: '100%' }}
            >
              <TrendingUp style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Generate Health Summary
            </button>
            
            {showAISummary && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#e3f2fd', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid #bbdefb',
                marginTop: '1rem'
              }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Brain style={{ width: '1rem', height: '1rem' }} />
                  AI Analysis Report
                </h4>
                <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{aiSummary}</div>
              </div>
            )}
            
            {residentVitals.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: '#6c757d', textAlign: 'center', marginTop: '1rem' }}>
                Record some vital signs to generate AI insights
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vitals Chart */}
      {residentVitals.length > 0 && (
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <Activity />
            Vital Signs Trends
          </div>
          <VitalsChart vitals={residentVitals} />
        </div>
      )}

      {/* Recent Vitals History */}
      <div className="healthcare-card">
        <div className="healthcare-card-header">
          <Calendar />
          Recent Vital Signs
        </div>
        {residentVitals.length > 0 ? (
          <table className="healthcare-table">
            <thead>
              <tr>
                <th>Blood Pressure</th>
                <th>Heart Rate</th>
                <th>Date/Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {residentVitals.slice(0, 5).map(vital => (
                <tr key={vital.id}>
                  <td style={{ fontWeight: '500' }}>
                    {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {vital.heart_rate} bpm
                  </td>
                  <td style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {new Date(vital.timestamp).toLocaleString()}
                  </td>
                  <td>
                    {vital.systolic_bp > 140 || vital.diastolic_bp > 90 ? (
                      <span className="healthcare-badge healthcare-badge-danger">High BP</span>
                    ) : vital.systolic_bp < 90 || vital.diastolic_bp < 60 ? (
                      <span className="healthcare-badge healthcare-badge-warning">Low BP</span>
                    ) : (
                      <span className="healthcare-badge healthcare-badge-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Activity style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#6c757d' }} />
            <p style={{ color: '#6c757d' }}>No vital signs recorded yet</p>
          </div>
        )}
      </div>

      {/* Test Emergency Button */}
      <div className="healthcare-card">
        <div className="healthcare-card-header" style={{ fontSize: '0.875rem' }}>
          Emergency Testing
        </div>
        <button 
          onClick={() => onTriggerAlert(assignedResident.id)}
          className="healthcare-btn healthcare-btn-secondary"
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Simulate Emergency for {assignedResident.name}
        </button>
      </div>
    </div>
  );
}
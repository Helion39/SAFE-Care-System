import React, { useState } from 'react';
import { VitalsChart } from './VitalsChart';
import { Chatbot } from './Chatbot';
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
      <div className="flex items-center justify-center" style={{ height: '24rem' }}>
        <div className="card text-center" style={{ maxWidth: '28rem' }}>
          <User style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>No Assignment</h3>
          <p style={{ color: 'var(--gray-500)' }}>
            You are not currently assigned to a resident. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const latestVitals = residentVitals[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Incident Response Section */}
      {claimedIncidents.length > 0 && (
        <div className="alert alert-error">
          <div className="card-header" style={{ color: '#721c24' }}>
            <AlertTriangle />
            Active Incident Response Required
          </div>
          {claimedIncidents.map(incident => (
            <div key={incident.id} className="mb-3">
              <div className="mb-2">
                <p style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                  Emergency detected for {incident.resident_name} in Room {incident.room_number}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-1)' }}>
                  Detected: {new Date(incident.detection_time).toLocaleString()}
                </p>
                <p style={{ fontSize: 'var(--text-sm)' }}>
                  Please verify the situation and confirm if this is a true emergency or false alarm.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleIncidentResolution(incident.id, true)}
                  className="btn btn-error"
                >
                  <AlertTriangle style={{ width: '1rem', height: '1rem' }} />
                  Confirm Emergency
                </button>
                <button 
                  onClick={() => handleIncidentResolution(incident.id, false)}
                  className="btn btn-outline"
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
      <div className="card">
        <div className="card-header">
          <User />
          {assignedResident.name}
        </div>
        <div className="grid grid-3">
          <div>
            <div className="mb-1">
              <strong>Room:</strong> {assignedResident.room_number}
            </div>
            <div>
              <strong>Age:</strong> {assignedResident.age} years
            </div>
          </div>
          <div>
            <div className="mb-1">
              <strong>Medical Conditions:</strong>
            </div>
            <div>
              {assignedResident.medical_conditions.map((condition, index) => (
                <span key={index} style={{ marginRight: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                  {condition}{index < assignedResident.medical_conditions.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1">
              <strong>Latest Vitals:</strong>
            </div>
            {latestVitals ? (
              <div style={{ fontSize: 'var(--text-sm)' }}>
                <div>BP: {latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg</div>
                <div>HR: {latestVitals.heart_rate} bpm</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                  {new Date(latestVitals.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>No recent vitals</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Vitals Input */}
        <div className="card">
          <div className="card-header">
            <Stethoscope style={{ width: '1.25rem', height: '1.25rem' }} />
            Log Vital Signs
          </div>
          <form onSubmit={handleVitalsSubmit}>
            <div className="grid grid-2 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="systolic">Systolic BP</label>
                <input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  className="input"
                  value={vitalsForm.systolic_bp}
                  onChange={(e) => setVitalsForm(prev => ({
                    ...prev,
                    systolic_bp: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="diastolic">Diastolic BP</label>
                <input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  className="input"
                  value={vitalsForm.diastolic_bp}
                  onChange={(e) => setVitalsForm(prev => ({
                    ...prev,
                    diastolic_bp: e.target.value
                  }))}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="heartRate">Heart Rate (bpm)</label>
              <input
                id="heartRate"
                type="number"
                placeholder="72"
                className="input"
                value={vitalsForm.heart_rate}
                onChange={(e) => setVitalsForm(prev => ({
                  ...prev,
                  heart_rate: e.target.value
                }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              <CheckCircle style={{ width: '1rem', height: '1rem' }} />
              Record Vitals
            </button>
          </form>
        </div>

        {/* AI Health Summary */}
        <div className="card">
          <div className="card-header">
            <Brain />
            AI Health Analysis
          </div>
          <div>
            <button 
              onClick={handleGenerateAISummary}
              disabled={residentVitals.length === 0}
              className="btn btn-primary w-full"
            >
              <TrendingUp style={{ width: '1rem', height: '1rem' }} />
              Generate Health Summary
            </button>
            
            {showAISummary && (
              <div style={{ 
                padding: 'var(--space-2)', 
                backgroundColor: 'var(--primary-light)', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--gray-200)',
                marginTop: 'var(--space-2)'
              }}>
                <h4 className="flex items-center gap-1 mb-1" style={{ fontWeight: '600' }}>
                  <Brain style={{ width: '1rem', height: '1rem' }} />
                  AI Analysis Report
                </h4>
                <div style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-line' }}>{aiSummary}</div>
              </div>
            )}
            
            {residentVitals.length === 0 && (
              <p className="text-center mt-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                Record some vital signs to generate AI insights
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vitals Chart */}
      {residentVitals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Activity />
            Vital Signs Trends
          </div>
          <VitalsChart vitals={residentVitals} />
        </div>
      )}

      {/* Recent Vitals History */}
      <div className="card">
        <div className="card-header">
          <Calendar />
          Recent Vital Signs
        </div>
        {residentVitals.length > 0 ? (
          <table className="table">
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
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                    {new Date(vital.timestamp).toLocaleString()}
                  </td>
                  <td>
                    {vital.systolic_bp > 140 || vital.diastolic_bp > 90 ? (
                      <span className="badge badge-error">High BP</span>
                    ) : vital.systolic_bp < 90 || vital.diastolic_bp < 60 ? (
                      <span className="badge badge-warning">Low BP</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-3">
            <Activity style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
            <p style={{ color: 'var(--gray-500)' }}>No vital signs recorded yet</p>
          </div>
        )}
      </div>

      {/* Test Emergency Button */}
      <div className="card">
        <div className="card-header" style={{ fontSize: 'var(--text-sm)' }}>
          Emergency Testing
        </div>
        <button 
          onClick={() => onTriggerAlert(assignedResident.id)}
          className="btn btn-sm btn-secondary"
        >
          Simulate Emergency for {assignedResident.name}
        </button>
      </div>

      {/* Chatbot */}
      <Chatbot currentUser={currentUser} />

    </div>
  );
}
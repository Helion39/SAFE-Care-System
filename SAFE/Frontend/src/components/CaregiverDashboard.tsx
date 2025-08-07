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
  Brain,
  ClipboardList,
  Menu,
  X
} from 'lucide-react';

export function CaregiverDashboard({ data, setData, currentUser, onTriggerAlert, onResolveIncident, onDataChange }) {
  const [vitalsForm, setVitalsForm] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    temperature: ''
  });
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Listen for sidebar toggle from navbar
  React.useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, []);

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

    // Validate form inputs
    const systolic = parseInt(vitalsForm.systolic_bp);
    const diastolic = parseInt(vitalsForm.diastolic_bp);
    const heartRate = parseInt(vitalsForm.heart_rate);

    if (isNaN(systolic) || isNaN(diastolic) || isNaN(heartRate)) {
      alert('Please enter valid numbers for all required fields');
      return;
    }

    const vitalsData: any = {
      residentId: assignedResident._id || assignedResident.id,
      systolicBP: systolic,
      diastolicBP: diastolic,
      heartRate: heartRate
      // Note: caregiverId is automatically set by backend from req.user.id
    };

    // Only add temperature if it has a value
    if (vitalsForm.temperature && vitalsForm.temperature.trim() !== '') {
      const temp = parseFloat(vitalsForm.temperature);
      if (!isNaN(temp)) {
        vitalsData.temperature = temp;
      }
    }

    console.log('🔍 Sending vitals data:', vitalsData);

    try {
      const response = await apiService.createVitals(vitalsData);
      if (response.success) {
        await onDataChange(); // Refresh data
        setVitalsForm({
          systolic_bp: '',
          diastolic_bp: '',
          heart_rate: '',
          temperature: ''
        });
      }
    } catch (error) {
      console.error('Failed to record vitals:', error);
      console.error('Error details:', error);
      
      // Try to get more detailed error information
      if (error.message === 'Validation Error') {
        alert('Validation Error: Please check that all required fields are filled correctly. Systolic BP (50-300), Diastolic BP (30-200), Heart Rate (30-200), Temperature (30-45°C if provided).');
      } else {
        alert('Failed to record vitals: ' + error.message);
      }
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
    <div className="bg-gray-50" style={{ minHeight: '100vh', paddingTop: '64px' }}>
{/* Sidebar */}
<div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 fixed left-0 flex flex-col z-40`} style={{ backgroundColor: '#E3F2FD', height: '100vh', top: '0', paddingTop: '64px' }}>
  {/* Sidebar Header */}
  <div className="p-4 border-b border-blue-200">
    <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? '' : 'justify-center'}`}>
      <Stethoscope className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <span className={`text-blue-600 font-semibold transition-all duration-300 ${
        sidebarOpen ? 'ml-2 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
      }`}>
        Caregiver
      </span>
    </div>
  </div>
  
  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto">
    {sidebarOpen && (
      <div className="px-4 py-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          Caregiver Panel
        </span>
      </div>
    )}
    
    <div className="space-y-1">
      <button 
        className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left transition-colors ${
          activeTab === 'overview' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('overview')}
        title={!sidebarOpen ? 'Care Overview' : ''}
      >
        <Stethoscope className={`w-4 h-4 ${sidebarOpen ? 'mr-3' : ''}`} />
        {sidebarOpen && 'Care Overview'}
      </button>
      
      <button 
        className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left transition-colors ${
          activeTab === 'checklists' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('checklists')}
        title={!sidebarOpen ? 'Daily Tasks' : ''}
      >
        <ClipboardList className={`w-4 h-4 ${sidebarOpen ? 'mr-3' : ''}`} />
        {sidebarOpen && 'Daily Tasks'}
      </button>

      <button 
        className={`w-full flex items-center ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left transition-colors ${
          activeTab === 'vitals' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('vitals')}
        title={!sidebarOpen ? 'Vitals History' : ''}
      >
        <Activity className={`w-4 h-4 ${sidebarOpen ? 'mr-3' : ''}`} />
        {sidebarOpen && 'Vitals History'}
      </button>
    </div>
  </nav>
</div>

      {/* Main Content */}
      <div className="transition-all duration-300" style={{ marginLeft: sidebarOpen ? '256px' : '64px', minHeight: 'calc(100vh - 64px)' }}>
        <div className="p-6">
          <div className="flex flex-col gap-3">
            {/* Incident Response Section - Always visible */}
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

            {/* Resident Overview - Always visible */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: '#E3F2FD', 
                padding: '16px 24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <h3 style={{ 
                    color: '#1565C0', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <User style={{ width: '16px', height: '16px' }} />
                    {assignedResident.name}
                  </h3>
                  <span style={{ 
                    color: '#1565C0', 
                    fontSize: '12px' 
                  }}>
                    Room {assignedResident.room_number}
                  </span>
                </div>
              </div>
              <div style={{ padding: '24px' }}>
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
                        {latestVitals.temperature && (
                          <div>Temp: {latestVitals.temperature}°C</div>
                        )}
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
            </div>

            {/* Section-specific content based on sidebar selection */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-2">
                  {/* Vitals Input */}
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: '#E3F2FD', 
                      padding: '16px 24px'
                    }}>
                      <h3 style={{ 
                        color: '#1565C0', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Stethoscope style={{ width: '16px', height: '16px' }} />
                        Log Vital Signs
                      </h3>
                    </div>
                    <div style={{ padding: '24px' }}>
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
                        <div className="grid grid-2 mb-2">
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
                          <div className="form-group">
                            <label className="label" htmlFor="temperature">Temperature (°C)</label>
                            <input
                              id="temperature"
                              type="number"
                              step="0.1"
                              placeholder="36.5"
                              className="input"
                              value={vitalsForm.temperature}
                              onChange={(e) => setVitalsForm(prev => ({
                                ...prev,
                                temperature: e.target.value
                              }))}
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-full">
                          <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                          Record Vitals
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* AI Health Summary */}
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: '#E3F2FD', 
                      padding: '16px 24px'
                    }}>
                      <h3 style={{ 
                        color: '#1565C0', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Brain style={{ width: '16px', height: '16px' }} />
                        AI Health Analysis
                      </h3>
                    </div>
                    <div style={{ padding: '24px' }}>
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
              </div>
            )}

            {activeTab === 'vitals' && (
              <div className="space-y-4">
                {/* Vitals Chart */}
                {residentVitals.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      backgroundColor: '#E3F2FD', 
                      padding: '16px 24px'
                    }}>
                      <h3 style={{ 
                        color: '#1565C0', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Activity style={{ width: '16px', height: '16px' }} />
                        Vital Signs Trends
                      </h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <VitalsChart vitals={residentVitals} />
                    </div>
                  </div>
                )}

                {/* Recent Vitals History */}
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    backgroundColor: '#E3F2FD', 
                    padding: '16px 24px'
                  }}>
                    <h3 style={{ 
                      color: '#1565C0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar style={{ width: '16px', height: '16px' }} />
                      Recent Vital Signs
                    </h3>
                  </div>
                  <div style={{ padding: '0' }}>
                    {residentVitals.length > 0 ? (
                      <table className="table" style={{ margin: 0, border: 'none' }}>
                        <thead>
                          <tr>
                            <th>Blood Pressure</th>
                            <th>Heart Rate</th>
                            <th>Temperature</th>
                            <th>Date/Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {residentVitals.slice(0, 10).map(vital => (
                            <tr key={vital.id}>
                              <td style={{ fontWeight: '500' }}>
                                {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                              </td>
                              <td style={{ fontWeight: '500' }}>
                                {vital.heart_rate} bpm
                              </td>
                              <td style={{ fontWeight: '500' }}>
                                {vital.temperature ? `${vital.temperature}°C` : '--'}
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
                </div>
              </div>
            )}

            {/* Test Emergency Button */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden'
            }}>
              <div style={{ 
                backgroundColor: '#E3F2FD', 
                padding: '16px 24px'
              }}>
                <h3 style={{ 
                  color: '#1565C0', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  margin: 0 
                }}>
                  Emergency Testing
                </h3>
              </div>
              <div style={{ padding: '24px' }}>
                <button 
                  onClick={() => onTriggerAlert(assignedResident.id)}
                  className="btn btn-sm btn-secondary"
                >
                  Simulate Emergency for {assignedResident.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaregiverDashboard;
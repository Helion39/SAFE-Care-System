import React, { useState } from 'react';
import { VitalsChart } from './VitalsChart';
import { UserManagement } from './UserManagement';
import { ResidentManagement } from './ResidentManagement';
import apiService from '../services/api';
import { 
  Users, 
  AlertTriangle, 
  Camera, 
  Phone,
  Clock,
  TrendingUp,
  Shield,
  UserPlus,
  Home
} from 'lucide-react';

export function AdminDashboard({ data, setData, onTriggerAlert, onResolveIncident, onDataChange }) {
  const [selectedResident, setSelectedResident] = useState(null);
  const [activeTab, setActiveTab] = useState('residents');

  const activeIncidents = data.incidents.filter(i => i.status === 'active' || i.status === 'claimed');
  const resolvedToday = data.incidents.filter(i => 
    i.status === 'resolved' && 
    new Date(i.resolved_time).toDateString() === new Date().toDateString()
  );



  const handleConfirmEmergency = (incidentId) => {
    const adminAction = "Hospital contacted - Emergency services dispatched";
    onResolveIncident(incidentId, true, adminAction);
  };

  const getResidentVitals = (residentId) => {
    return data.vitals
      .filter(v => v.resident_id === residentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Cards */}
      <div className="healthcare-grid healthcare-grid-4">
        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#dc3545' }} />
          </div>
          <div className="healthcare-metric-number" style={{ color: '#dc3545' }}>
            {activeIncidents.length}
          </div>
          <div className="healthcare-metric-label">Active Alerts</div>
        </div>

        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Users style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="healthcare-metric-number">{data.residents.length}</div>
          <div className="healthcare-metric-label">Total Residents</div>
        </div>

        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Shield style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="healthcare-metric-number">
            {data.users.filter(u => u.role === 'caregiver').length}
          </div>
          <div className="healthcare-metric-label">Active Caregivers</div>
        </div>

        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <TrendingUp style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="healthcare-metric-number">{resolvedToday.length}</div>
          <div className="healthcare-metric-label">Resolved Today</div>
        </div>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="healthcare-card">
          <div className="healthcare-card-header" style={{ color: '#dc3545' }}>
            <AlertTriangle />
            Active Emergency Incidents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeIncidents.map(incident => {
              const caregiver = data.users.find(u => u.id === incident.claimed_by);
              return (
                <div key={incident.id} className="healthcare-alert healthcare-alert-danger">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className={`healthcare-badge ${incident.status === 'claimed' ? 'healthcare-badge-warning' : 'healthcare-badge-danger'}`}>
                          {incident.status === 'claimed' ? 'BEING HANDLED' : 'AWAITING RESPONSE'}
                        </span>
                        <span style={{ fontWeight: '600' }}>{incident.resident_name}</span>
                        <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                          Room {incident.room_number}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                        Detected: {new Date(incident.detection_time).toLocaleString()}
                        {caregiver && (
                          <span style={{ marginLeft: '1rem' }}>
                            Claimed by: {caregiver.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {incident.status === 'claimed' && (
                      <button
                        onClick={() => handleConfirmEmergency(incident.id)}
                        className="healthcare-btn-call-hospital"
                      >
                        <Phone style={{ width: '1rem', height: '1rem' }} />
                        Call Hospital
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="healthcare-tabs">
        <div className="healthcare-tabs-list">
          <button 
            className={`healthcare-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UserPlus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Manage Users
          </button>
          <button 
            className={`healthcare-tab ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveTab('residents')}
          >
            <Home style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Manage Residents
          </button>
          <button 
            className={`healthcare-tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            Incident History
          </button>
          <button 
            className={`healthcare-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`healthcare-tab ${activeTab === 'cameras' ? 'active' : ''}`}
            onClick={() => setActiveTab('cameras')}
          >
            Camera Status
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <UserManagement data={data} setData={setData} onDataChange={onDataChange} />
      )}

      {activeTab === 'residents' && (
        <ResidentManagement data={data} setData={setData} onDataChange={onDataChange} />
      )}



      {activeTab === 'incidents' && (
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            Incident History
          </div>
          <table className="healthcare-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Resident</th>
                <th>Status</th>
                <th>Resolution</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody>
              {data.incidents
                .sort((a, b) => new Date(b.detection_time).getTime() - new Date(a.detection_time).getTime())
                .map(incident => {
                  const responseTime = incident.resolved_time ? 
                    Math.round((new Date(incident.resolved_time).getTime() - new Date(incident.detection_time).getTime()) / 1000 / 60) 
                    : null;
                  
                  return (
                    <tr key={incident.id}>
                      <td>{new Date(incident.detection_time).toLocaleString()}</td>
                      <td>
                        <div>
                          <div>{incident.resident_name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                            Room {incident.room_number}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`healthcare-badge ${
                          incident.status === 'resolved' ? 'healthcare-badge-success' : 
                          incident.status === 'claimed' ? 'healthcare-badge-primary' : 'healthcare-badge-danger'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td>
                        {incident.resolution && (
                          <span className={`healthcare-badge ${
                            incident.resolution === 'true_emergency' ? 'healthcare-badge-danger' : 'healthcare-badge-secondary'
                          }`}>
                            {incident.resolution === 'true_emergency' ? 'Emergency' : 'False Alarm'}
                          </span>
                        )}
                      </td>
                      <td>
                        {responseTime && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                            {responseTime}m
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="healthcare-grid healthcare-grid-2">
          {data.residents.map(resident => {
            const vitals = getResidentVitals(resident.id);
            return (
              <div key={resident.id} className="healthcare-card">
                <div className="healthcare-card-header">
                  {resident.name} - Vital Signs
                </div>
                <VitalsChart vitals={vitals} />
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'cameras' && (
        <div className="healthcare-card">
          <div className="healthcare-card-header">
            <Camera />
            Camera System Status
          </div>
          <div className="healthcare-grid healthcare-grid-3">
            {(data.camera_info || []).map(camera => (
              <div key={camera.id} className="healthcare-card" style={{ margin: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: '600' }}>Room {camera.room_number}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                      Last checked: {new Date(camera.last_checked).toLocaleString()}
                    </p>
                  </div>
                  <span className={`healthcare-badge ${camera.status === 'active' ? 'healthcare-badge-success' : 'healthcare-badge-danger'}`}>
                    {camera.status === 'active' ? 'Active' : 'Maintenance Required'}
                  </span>
                </div>
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: 'var(--healthcare-gray-100)', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.875rem' 
                }}>
                  📹 Camera feed available - AI monitoring enabled
                </div>
              </div>
            ))}
          </div>
        </div>
      )}




    </div>
  );
}
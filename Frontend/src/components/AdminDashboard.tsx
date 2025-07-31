import React, { useState, useEffect } from 'react';
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

  // Tambahkan useEffect berikut:
  useEffect(() => {
    if (onDataChange) {
      onDataChange();
    }
    // eslint-disable-next-line
  }, []);

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
    <div className="flex flex-col gap-3">
      {/* Overview Cards */}
      <div className="grid grid-4">
        <div className="metric-card">
          <div className="metric-icon">
            <AlertTriangle style={{ width: '2rem', height: '2rem', color: 'var(--error)' }} />
          </div>
          <div className="metric-number" style={{ color: 'var(--error)' }}>
            {activeIncidents.length}
          </div>
          <div className="metric-label">Active Alerts</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="metric-number">{data.residents.length}</div>
          <div className="metric-label">Total Residents</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Shield style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="metric-number">
            {data.users.filter(u => u.role === 'caregiver').length}
          </div>
          <div className="metric-label">Active Caregivers</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp style={{ width: '2rem', height: '2rem' }} />
          </div>
          <div className="metric-number">{resolvedToday.length}</div>
          <div className="metric-label">Resolved Today</div>
        </div>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ color: 'var(--error)' }}>
            <AlertTriangle />
            Active Emergency Incidents
          </div>
          <div className="flex flex-col gap-2">
            {activeIncidents.map(incident => {
              const caregiver = data.users.find(u => u.id === incident.claimed_by);
              return (
                <div key={incident.id} className="alert alert-error">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${incident.status === 'claimed' ? 'badge-warning' : 'badge-error'}`}>
                          {incident.status === 'claimed' ? 'BEING HANDLED' : 'AWAITING RESPONSE'}
                        </span>
                        <span style={{ fontWeight: '600' }}>{incident.resident_name}</span>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                          Room {incident.room_number}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                        Detected: {new Date(incident.detection_time).toLocaleString()}
                        {caregiver && (
                          <span style={{ marginLeft: 'var(--space-2)' }}>
                            Claimed by: {caregiver.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {incident.status === 'claimed' && (
                      <button
                        onClick={() => handleConfirmEmergency(incident.id)}
                        className="btn btn-outline"
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

      <div className="tabs">
        <div className="tabs-list">
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UserPlus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Manage Users
          </button>
          <button 
            className={`tab ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveTab('residents')}
          >
            <Home style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Manage Residents
          </button>
          <button 
            className={`tab ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            Incident History
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`tab ${activeTab === 'cameras' ? 'active' : ''}`}
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
        <div className="card">
          <div className="card-header">
            Incident History
          </div>
          <table className="table">
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
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                            Room {incident.room_number}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          incident.status === 'resolved' ? 'badge-success' : 
                          incident.status === 'claimed' ? 'badge-primary' : 'badge-error'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td>
                        {incident.resolution && (
                          <span className={`badge ${
                            incident.resolution === 'true_emergency' ? 'badge-error' : 'badge-secondary'
                          }`}>
                            {incident.resolution === 'true_emergency' ? 'Emergency' : 'False Alarm'}
                          </span>
                        )}
                      </td>
                      <td>
                        {responseTime && (
                          <span className="flex items-center gap-1">
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
        <div className="grid grid-2">
          {data.residents.map(resident => {
            const vitals = getResidentVitals(resident.id);
            return (
              <div key={resident.id} className="card">
                <div className="card-header">
                  {resident.name} - Vital Signs
                </div>
                <VitalsChart vitals={vitals} />
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'cameras' && (
        <div className="card">
          <div className="card-header">
            <Camera />
            Camera System Status
          </div>
          <div className="grid grid-3">
            {(data.camera_info || []).map(camera => (
              <div key={camera.id} className="card" style={{ margin: '0' }}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p style={{ fontWeight: '600' }}>Room {camera.room_number}</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                      Last checked: {new Date(camera.last_checked).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge ${camera.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {camera.status === 'active' ? 'Active' : 'Maintenance Required'}
                  </span>
                </div>
                <div style={{ 
                  padding: 'var(--space-1)', 
                  backgroundColor: 'var(--gray-100)', 
                  borderRadius: 'var(--radius)', 
                  fontSize: 'var(--text-sm)' 
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
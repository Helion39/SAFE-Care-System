import React, { useState, useEffect } from 'react';
import { VitalsChart } from './VitalsChart';
import { UserManagement } from './UserManagement';
import { ResidentManagement } from './ResidentManagement';
import { CameraMonitoring } from './CameraMonitoring';
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
  Home,
  ClipboardList,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

export function AdminDashboard({ data, setData, onTriggerAlert, onResolveIncident, onDataChange }) {
  const [selectedResident, setSelectedResident] = useState(null);
  const [activeTab, setActiveTab] = useState('residents');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 fixed left-0 flex flex-col z-40`} style={{ backgroundColor: '#E3F2FD', height: 'calc(100vh - 80px)', top: '80px' }}>
  {/* Sidebar Header */}
  <div className="p-4 border-b border-blue-200">
    <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? '' : 'justify-center'}`}>
      <Home className="w-5 h-5 text-blue-600 flex-shrink-0" />
      <span className={`text-blue-600 font-semibold transition-all duration-300 ${
        sidebarOpen ? 'ml-2 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
      }`}>
        Dashboard
      </span>
    </div>
  </div>
  
  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto">
    {sidebarOpen && (
      <div className="px-4 py-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          Dashboard Admin
        </span>
      </div>
    )}
    
    <div className="space-y-1">
      <button 
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left ${
          activeTab === 'users' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('users')}
        title={!sidebarOpen ? 'Manage Users' : ''}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
        }`}>
          Manage Users
        </span>
      </button>
      
      <button 
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left ${
          activeTab === 'residents' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('residents')}
        title={!sidebarOpen ? 'Residents' : ''}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
        }`}>
          Residents
        </span>
      </button>
      
      <button 
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left ${
          activeTab === 'incidents' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('incidents')}
        title={!sidebarOpen ? 'Incidents' : ''}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
        }`}>
          Incidents
        </span>
      </button>
      
      <button 
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left ${
          activeTab === 'status' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('status')}
        title={!sidebarOpen ? 'Analytics' : ''}
      >
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
        }`}>
          Analytics
        </span>
      </button>
      
      <button 
        className={`w-full flex items-center transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'} py-2 text-sm text-left ${
          activeTab === 'cameras' 
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' 
            : 'text-gray-600 hover:bg-blue-50'
        }`}
        onClick={() => setActiveTab('cameras')}
        title={!sidebarOpen ? 'Cameras' : ''}
      >
        <Camera className="w-4 h-4 flex-shrink-0" />
        <span className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0 overflow-hidden'
        }`}>
          Cameras
        </span>
      </button>
    </div>
  </nav>
</div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col gap-3">


            {/* Secondary Metrics Row - Resident Management */}
            <div className="grid grid-4">
              <div className="metric-card-refined metric-card-info">
                <div className="metric-label-top">Total Residents</div>
                <div className="metric-content">
                  <div className="metric-number-large text-info">
                    {data.residents.length}
                  </div>
                  <Users className="metric-icon-small" />
                </div>
              </div>

              <div className="metric-card-refined metric-card-success">
                <div className="metric-label-top">Assigned</div>
                <div className="metric-content">
                  <div className="metric-number-large text-success">
                    {data.assignments ? data.assignments.filter(a => a.isActive).length : data.residents.length}
                  </div>
                  <CheckCircle className="metric-icon-small" />
                </div>
              </div>

              <div className="metric-card-refined metric-card-warning">
                <div className="metric-label-top">Unassigned</div>
                <div className="metric-content">
                  <div className="metric-number-large text-warning">
                    {data.assignments ? data.residents.length - data.assignments.filter(a => a.isActive).length : 0}
                  </div>
                  <AlertTriangle className="metric-icon-small" />
                </div>
              </div>

              <div className="metric-card-refined metric-card-info">
                <div className="metric-label-top">Avg Age</div>
                <div className="metric-content">
                  <div className="metric-number-large text-info">
                    {data.residents.length > 0 ? Math.round(data.residents.reduce((sum, r) => sum + (r.age || 0), 0) / data.residents.length) : 0}
                  </div>
                  <Home className="metric-icon-small" />
                </div>
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
                          <div className="flex gap-2">
                            {incident.status === 'claimed' && (
                              <button
                                onClick={() => handleConfirmEmergency(incident.id)}
                                className="btn btn-outline"
                              >
                                <Phone style={{ width: '1rem', height: '1rem' }} />
                                Call Hospital
                              </button>
                            )}
                            <span 
                              onClick={async () => {
                                console.log('🔍 Admin closing incident:', incident.id);
                                try {
                                  // Use admin-specific close endpoint
                                  const response = await apiService.adminCloseIncident(incident.id, "Incident closed by admin");
                                  console.log('🔍 Admin close response:', response);
                                  if (response.success) {
                                    console.log('✅ Incident closed by admin, refreshing data...');
                                    onDataChange(); // Refresh the data
                                  } else {
                                    console.error('❌ Failed to close incident:', response);
                                  }
                                } catch (error) {
                                  console.error('❌ Error closing incident:', error);
                                }
                              }}
                              title="Close this incident"
                              style={{ cursor: 'pointer' }}
                            >
                              <X 
                                style={{ 
                                  width: '1.5rem', 
                                  height: '1.5rem', 
                                  color: '#dc2626'
                                }}
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section-specific content based on sidebar selection */}
            {activeTab === 'users' && (
              <>
                {/* Partial line separator */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  margin: '2rem 0' 
                }}>
                  <div style={{ 
                    width: '85%', 
                    height: '1px', 
                    backgroundColor: 'var(--gray-300)',
                    opacity: 0.6
                  }} />
                </div>
                <UserManagement data={data} setData={setData} onDataChange={onDataChange} />
              </>
            )}

            {activeTab === 'residents' && (
              <>
                {/* Partial line separator */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  margin: '2rem 0' 
                }}>
                  <div style={{ 
                    width: '85%', 
                    height: '1px', 
                    backgroundColor: 'var(--gray-300)',
                    opacity: 0.6
                  }} />
                </div>
                <ResidentManagement data={data} setData={setData} onDataChange={onDataChange} />
              </>
            )}

            {activeTab === 'incidents' && (
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
                      margin: 0 
                    }}>
                      Incident History
                    </h3>
                    <span style={{ 
                      color: '#1565C0', 
                      fontSize: '12px' 
                    }}>
                      Last updated: 2 minutes ago
                    </span>
                  </div>
                </div>
                <div style={{ padding: '0' }}>
                  <table className="table" style={{ margin: 0, border: 'none' }}>
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
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-6">
                {/* Vitals Analytics */}
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
                        margin: 0 
                      }}>
                        Resident Vitals Overview
                      </h3>
                      <span style={{ 
                        color: '#1565C0', 
                        fontSize: '12px' 
                      }}>
                        Showing 4 of {data.residents.length} residents
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div className="grid grid-2">
                      {data.residents.slice(0, 4).map(resident => {
                        const vitals = getResidentVitals(resident.id);
                        return (
                          <div key={resident.id} style={{ 
                            backgroundColor: '#f5f9ff', 
                            borderRadius: '8px', 
                            padding: '16px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ 
                              color: '#1565C0', 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              marginBottom: '12px' 
                            }}>
                              {resident.name} - Vital Signs
                            </div>
                            <VitalsChart vitals={vitals} />
                          </div>
                        );
                      })}
                    </div>
                    {data.residents.length > 4 && (
                      <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <p style={{ fontSize: '12px', color: '#9AA0A6' }}>
                          View individual resident pages for complete vitals history.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cameras' && (
              <CameraMonitoring data={data} onTriggerAlert={onTriggerAlert} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
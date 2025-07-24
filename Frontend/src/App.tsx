import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { AdminDashboard } from './components/AdminDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { EmergencyAlert } from './components/EmergencyAlert';
import { mockData, initializeMockData } from './components/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(mockData);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    initializeMockData();
    const storedData = localStorage.getItem('careSystemData');
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('careSystemData', JSON.stringify(data));
  }, [data]);

  const handleLogin = (role: string) => {
    const user = role === 'admin' 
      ? data.users.find(u => u.role === 'admin')
      : data.users.find(u => u.role === 'caregiver');
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const triggerEmergencyAlert = (residentId: any) => {
    const resident = data.residents.find(r => r.id === residentId);
    const newIncident = {
      id: Date.now(),
      resident_id: residentId,
      detection_time: new Date().toISOString(),
      claimed_by: null,
      status: 'active',
      resolution: null,
      admin_action: null,
      resident_name: resident.name,
      room_number: resident.room_number
    };

    setData(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents]
    }));

    setActiveAlerts(prev => [newIncident, ...prev]);
  };

  const claimIncident = (incidentId: any, caregiverId: any) => {
    setData(prev => ({
      ...prev,
      incidents: prev.incidents.map(incident =>
        incident.id === incidentId
          ? { ...incident, claimed_by: caregiverId, status: 'claimed' }
          : incident
      )
    }));

    setActiveAlerts(prev => prev.filter(alert => alert.id !== incidentId));
  };

  const resolveIncident = (incidentId: any, isTrueEmergency: any, adminAction: any = null) => {
    setData(prev => ({
      ...prev,
      incidents: prev.incidents.map(incident =>
        incident.id === incidentId
          ? { 
              ...incident, 
              status: 'resolved',
              resolution: isTrueEmergency ? 'true_emergency' : 'false_alarm',
              admin_action: adminAction,
              resolved_time: new Date().toISOString()
            }
          : incident
      )
    }));
  };

  if (!currentUser) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">SAFE Care System</h1>
          <p className="login-subtitle">Elderly Care Monitoring System</p>
          
          <button 
            onClick={() => handleLogin('admin')} 
            className="login-button login-button-primary"
          >
            Login as Admin
          </button>
          
          <button 
            onClick={() => handleLogin('caregiver')} 
            className="login-button login-button-secondary"
          >
            Login as Caregiver
          </button>
          
          <p className="login-demo-text">Demo System - No real authentication required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="healthcare-page">
      {/* Emergency Alerts */}
      {activeAlerts.map(alert => (
        <EmergencyAlert
          key={alert.id}
          incident={alert}
          currentUser={currentUser}
          onClaim={(incidentId) => claimIncident(incidentId, currentUser.id)}
        />
      ))}

      {/* Header */}
      <nav className="healthcare-nav">
        <div className="healthcare-container">
          <div className="healthcare-nav-content">
            <div className="flex items-center gap-2">
              <span className="healthcare-nav-brand">SAFE Care System</span>
              <span className={`healthcare-badge ${currentUser.role === 'admin' ? 'healthcare-badge-primary' : 'healthcare-badge-secondary'}`}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Caregiver'}
              </span>
            </div>
            <div className="healthcare-nav-user">
              <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                Welcome, {currentUser.name}
              </span>
              <button onClick={handleLogout} className="healthcare-btn healthcare-btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="healthcare-container" style={{ paddingTop: '1.5rem' }}>
        {currentUser.role === 'admin' ? (
          <AdminDashboard 
            data={data} 
            setData={setData}
            onTriggerAlert={triggerEmergencyAlert}
            onResolveIncident={resolveIncident}
          />
        ) : (
          <CaregiverDashboard 
            data={data} 
            setData={setData}
            currentUser={currentUser}
            onTriggerAlert={triggerEmergencyAlert}
            onResolveIncident={resolveIncident}
          />
        )}
      </main>
    </div>
  );
}
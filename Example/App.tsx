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
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState(mockData);
  const [activeAlerts, setActiveAlerts] = useState([]);

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

  const handleLogin = (role) => {
    const user = role === 'admin' 
      ? data.users.find(u => u.role === 'admin')
      : data.users.find(u => u.role === 'caregiver');
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const triggerEmergencyAlert = (residentId) => {
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

  const claimIncident = (incidentId, caregiverId) => {
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

  const resolveIncident = (incidentId, isTrueEmergency, adminAction = null) => {
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
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-primary">SAFE Care System</CardTitle>
            <p className="text-center text-muted-foreground">
              Elderly Care Monitoring System
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={() => handleLogin('admin')} 
                className="w-full"
                variant="default"
              >
                Login as Admin
              </Button>
              <Button 
                onClick={() => handleLogin('caregiver')} 
                className="w-full"
                variant="outline"
              >
                Login as Caregiver
              </Button>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              <p>Demo System - No real authentication required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
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
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl text-primary">SAFE Care System</h1>
            <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
              {currentUser.role === 'admin' ? 'Administrator' : 'Caregiver'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {currentUser.name}
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
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
import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { EmergencyAlert } from './components/EmergencyAlert';
import apiService from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>({
    users: [],
    residents: [],
    vitals: [],
    incidents: [],
    assignments: []
  });
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success) {
          const user = response.data.user;
          setCurrentUser(user);
          
          // Load data with the user context
          await loadDataForUser(user);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataForUser = async (user) => {
    try {
      console.log('🔍 Loading data for user:', user?.role, 'with token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      
      // Load different data based on user role
      const promises = [];
      
      // All users can access residents and incidents
      promises.push(apiService.getResidents());
      promises.push(apiService.getIncidents());
      
      // Load vitals data for all users
      promises.push(apiService.getVitals());
      
      // Only admins can access all users and assignments
      if (user?.role === 'admin') {
        console.log('🔍 Loading all users and assignments for admin');
        promises.push(apiService.getUsers());
        promises.push(apiService.getAssignments());
      } else {
        // Caregivers need assignments to find their assigned residents
        console.log('🔍 Loading caregivers and assignments for caregiver user');
        promises.push(apiService.getCaregivers());
        promises.push(apiService.getAssignments()); // Caregivers need assignments too
      }

      const [residentsRes, incidentsRes, vitalsRes, usersRes, assignmentsRes] = await Promise.all(promises);

      console.log('🔍 API responses:', { usersRes, residentsRes, incidentsRes, vitalsRes, assignmentsRes });

      setData({
        users: usersRes?.data || [],
        residents: residentsRes?.data || [],
        vitals: vitalsRes?.data || [],
        incidents: incidentsRes?.data || [],
        assignments: assignmentsRes?.data || [],
        camera_info: [
          {
            id: 1,
            room_number: "101",
            status: "active",
            last_checked: new Date().toISOString()
          },
          {
            id: 2,
            room_number: "102", 
            status: "active",
            last_checked: new Date().toISOString()
          },
          {
            id: 3,
            room_number: "103",
            status: "maintenance",
            last_checked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadData = async () => {
    await loadDataForUser(currentUser);
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await apiService.login(loginForm);
      console.log('🔍 Login response:', response);
      if (response.success) {
        const user = response.data.user;
        console.log('✅ Setting current user:', user);
        
        // Validate that user role matches selected role
        if (selectedRole === 'admin' && user.role !== 'admin') {
          setLoginError('Invalid credentials for admin login. Please use admin credentials.');
          return;
        }
        if (selectedRole === 'caregiver' && user.role !== 'caregiver') {
          setLoginError('Invalid credentials for caregiver login. Please use caregiver credentials.');
          return;
        }
        
        setCurrentUser(user);
        await loadDataForUser(user);
        setSelectedRole(null);
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setSelectedRole(null);
      setData({
        users: [],
        residents: [],
        vitals: [],
        incidents: [],
        assignments: []
      });
    }
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
  };

  const triggerEmergencyAlert = async (residentId: any) => {
    try {
      const resident = data.residents.find(r => r.id === residentId);
      const incidentData = {
        residentId,
        type: 'fall',
        severity: 'high',
        description: `Simulated fall detection for ${resident?.name}`,
      };

      const response = await apiService.createIncident(incidentData);
      if (response.success) {
        setActiveAlerts(prev => [response.data, ...prev]);
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to create incident:', error);
    }
  };

  const claimIncident = async (incidentId: any, caregiverId: any) => {
    try {
      console.log('🔍 Attempting to claim incident:', incidentId, 'by caregiver:', caregiverId);
      const response = await apiService.claimIncident(incidentId);
      console.log('🔍 Claim response:', response);
      if (response.success) {
        setActiveAlerts(prev => prev.filter(alert => alert.id !== incidentId));
        await loadData(); // Refresh data
        console.log('✅ Incident claimed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to claim incident:', error);
      alert('Failed to claim incident: ' + error.message);
    }
  };

  const resolveIncident = async (incidentId: any, isTrueEmergency: any, adminAction: any = null) => {
    try {
      const resolution = isTrueEmergency ? 'true_emergency' : 'false_alarm';
      const response = await apiService.resolveIncident(incidentId, resolution, '', adminAction);
      if (response.success) {
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">SAFE Care System</h1>
          <p className="login-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Role selection screen
    if (!selectedRole) {
      return (
        <div className="login-page">
          <div className="login-card">
            <h1 className="login-title">SAFE Care System</h1>
            <p className="login-subtitle">Elderly Care Monitoring System</p>
            
            <button 
              onClick={() => handleRoleSelect('admin')} 
              className="login-button login-button-primary"
            >
              Login as Admin
            </button>
            
            <button 
              onClick={() => handleRoleSelect('caregiver')} 
              className="login-button login-button-secondary"
            >
              Login as Caregiver
            </button>
            
            <p className="login-demo-text">Select your role to continue</p>
          </div>
        </div>
      );
    }

    // Login form screen
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">SAFE Care System</h1>
          <p className="login-subtitle">
            {selectedRole === 'admin' ? 'Administrator Login' : 'Caregiver Login'}
          </p>
          
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
            {loginError && (
              <div className="healthcare-alert healthcare-alert-danger" style={{ marginBottom: '1rem' }}>
                {loginError}
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="healthcare-input"
                required
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="healthcare-input"
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                type="button"
                onClick={handleBackToRoleSelection}
                className="healthcare-btn healthcare-btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button 
                type="submit"
                className="healthcare-btn healthcare-btn-primary"
                style={{ flex: 2 }}
              >
                Login
              </button>
            </div>
          </form>
          
          <div className="login-demo-text">
            {selectedRole === 'admin' ? (
              <p>Admin: admin / admin123</p>
            ) : (
              <p>Use credentials created by admin</p>
            )}
          </div>
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
            onDataChange={loadData}
          />
        ) : (
          <CaregiverDashboard 
            data={data} 
            setData={setData}
            currentUser={currentUser}
            onTriggerAlert={triggerEmergencyAlert}
            onResolveIncident={resolveIncident}
            onDataChange={loadData}
          />
        )}
      </main>
    </div>
  );
}
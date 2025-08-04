import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { FamilyLogin } from './components/FamilyLogin';
import { FamilyDashboard } from './components/FamilyDashboard';
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
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        apiService.setToken(token);
        setCurrentUser(user);
        loadDataForUser(user);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('OAuth callback error:', err);
      }
    }
    
    if (error) {
      console.error('OAuth error:', error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
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
      
      // Load vitals data for all users except family
      if (user?.role !== 'family') {
        promises.push(apiService.getVitals());
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      
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
              className="btn btn-primary w-full mb-2"
            >
              Login as Admin
            </button>
            
            <button 
              onClick={() => handleRoleSelect('caregiver')} 
              className="btn btn-secondary w-full mb-2"
            >
              Login as Caregiver
            </button>
            
            <button 
              onClick={() => handleRoleSelect('family')} 
              className="login-button login-button-secondary"
              style={{ backgroundColor: '#28a745', color: 'white', marginBottom: '0.5rem' }}
            >
              Family Portal
            </button>
            
            <p className="login-demo-text">Select your role to continue</p>
          </div>
        </div>
      );
    }

    // Family login screen
    if (selectedRole === 'family') {
      return (
        <FamilyLogin 
          onLogin={(user) => {
            setCurrentUser(user);
            loadDataForUser(user);
            setSelectedRole(null);
          }}
          onBack={handleBackToRoleSelection}
        />
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
          
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            {loginError && (
              <div className="alert alert-error mb-2">
                {loginError}
              </div>
            )}
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="input"
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="input"
                required
              />
            </div>
            
            <div className="flex gap-2 mb-2">
              <button 
                type="button"
                onClick={handleBackToRoleSelection}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
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
    <div className="page">
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
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <div className="flex items-center gap-2">
              <span className="nav-brand">SAFE Care System</span>
              <span className={`badge ${currentUser.role === 'admin' ? 'badge-primary' : currentUser.role === 'family' ? 'badge-success' : 'badge-secondary'}`}>
                {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'family' ? 'Family Member' : 'Caregiver'}
              </span>
            </div>
            <div className="nav-user">
              <span style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
                Welcome, {currentUser.name}
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container main-content">
        {currentUser.role === 'admin' ? (
          <AdminDashboard 
            data={data} 
            setData={setData}
            onTriggerAlert={triggerEmergencyAlert}
            onResolveIncident={resolveIncident}
            onDataChange={loadData}
          />
        ) : currentUser.role === 'family' ? (
          <FamilyDashboard 
            data={data}
            currentUser={currentUser}
            onLogout={handleLogout}
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
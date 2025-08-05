import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './components/AdminDashboard';
import CaregiverDashboard from './components/CaregiverDashboard';
import { EmergencyAlert } from './components/EmergencyAlert';
import { FamilyLoginPage } from './components/FamilyLoginPage';
import { FamilyDashboard } from './components/FamilyDashboard';
import { Modal } from './components/Modal';
import { useModal } from './hooks/useModal';
import apiService from './services/api';

function StaffLogin() {
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
  const { modalState, showConfirm, closeModal } = useModal();

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

  const handleLogout = () => {
    showConfirm(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to access the system.',
      async () => {
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
      },
      'Logout',
      'Cancel'
    );
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
      // Note: This would need modal implementation in parent component
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
            <p className="login-subtitle">Staff Portal</p>
            
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
    <div className="min-h-screen bg-pastel-background">
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
      <nav className="bg-pastel-white border-b border-gray-200 px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-info">SAFE Care System</span>
            <span className={`badge ${currentUser.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
              {currentUser.role === 'admin' ? 'Administrator' : 'Caregiver'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser.name}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary text-sm px-3 py-1">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
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
      
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}

// Komponen halaman tidak ditemukan
function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--error)', marginBottom: '1rem' }}>404</h1>
        <h2 className="login-title" style={{ color: 'var(--gray-700)' }}>Halaman Tidak Ditemukan</h2>
        <p className="login-subtitle" style={{ marginBottom: '2rem' }}>
          Maaf, halaman yang Anda cari tidak tersedia.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        </div>
      </div>
    </div>
  );
}

// Family Portal Component
function FamilyPortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>({
    users: [],
    residents: [],
    vitals: [],
    incidents: [],
    assignments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { modalState: familyModalState, showConfirm: showFamilyConfirm, closeModal: closeFamilyModal } = useModal();

  useEffect(() => {
    checkFamilyAuth();
  }, []);

  const checkFamilyAuth = async () => {
    try {
      // Check URL parameters for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        setIsLoading(false);
        return;
      }

      if (token && userParam) {
        // OAuth callback - set token and user
        const user = JSON.parse(decodeURIComponent(userParam));
        apiService.setToken(token);
        setCurrentUser(user);
        await loadFamilyData(user);
        // Clean URL
        window.history.replaceState({}, document.title, '/family-login');
      } else {
        // Check existing token
        const existingToken = localStorage.getItem('authToken');
        if (existingToken) {
          const response = await apiService.getProfile();
          if (response.success && response.data.user.role === 'family') {
            const user = response.data.user;
            // Validate that family user has an assigned resident
            if (!user.assignedResidentId) {
              console.error('Family user has no assigned resident');
              localStorage.removeItem('authToken');
              setIsLoading(false);
              return;
            }
            setCurrentUser(user);
            await loadFamilyData(user);
          }
        }
      }
    } catch (error) {
      console.error('Family auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilyData = async (user) => {
    try {
      console.log('🔍 Family user email:', user.email);
      
      const [residentsRes, incidentsRes, vitalsRes, usersRes] = await Promise.all([
        apiService.getResidents(),
        apiService.getIncidents(),
        apiService.getVitals(),
        apiService.getCaregivers()
      ]);

      const allResidents = residentsRes?.data || [];
      console.log('🔍 Available residents:', allResidents.map(r => ({ id: r._id || r.id, name: r.name, familyEmails: r.familyEmails })));
      
      // Find resident by email in familyEmails array
      const linkedResident = allResidents.find((r: any) => {
        if (r.familyEmails && Array.isArray(r.familyEmails)) {
          return r.familyEmails.includes(user.email);
        }
        return false;
      });

      if (linkedResident) {
        const residentObjectId = linkedResident._id || linkedResident.id;
        console.log('✅ Found linked resident:', { id: residentObjectId, name: linkedResident.name, email: user.email });
        
        // Filter data for this resident ObjectId only
        const residentVitals = (vitalsRes?.data || []).filter((v: any) => {
          const vResidentId = v.resident_id || v.residentId;
          return vResidentId === residentObjectId;
        });

        const residentIncidents = (incidentsRes?.data || []).filter((i: any) => {
          const iResidentId = i.residentId || i.resident_id;
          return iResidentId === residentObjectId;
        });

        console.log('🔍 Filtered data for resident:', {
          residentId: residentObjectId,
          vitalsCount: residentVitals.length,
          incidentsCount: residentIncidents.length
        });

        setData({
          users: usersRes?.data || [],
          residents: [linkedResident],
          vitals: residentVitals,
          incidents: residentIncidents,
          assignments: []
        });
      } else {
        console.log('❌ No resident linked to email:', user.email);
        // No resident linked to this email - return empty data
        setData({
          users: [],
          residents: [],
          vitals: [],
          incidents: [],
          assignments: []
        });
      }
    } catch (error) {
      console.error('Failed to load family data:', error);
    }
  };

  const handleFamilyLogin = async (user: any) => {
    setCurrentUser(user);
    await loadFamilyData(user);
  };

  const handleFamilyLogout = () => {
    showFamilyConfirm(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to access your family member\'s information.',
      () => {
        apiService.setToken(null);
        setCurrentUser(null);
        setData({
          users: [],
          residents: [],
          vitals: [],
          incidents: [],
          assignments: []
        });
      },
      'Logout',
      'Cancel'
    );
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
    return <FamilyLoginPage />;
  }

  return (
    <div className="min-h-screen bg-pastel-background">
      {/* Header */}
      <nav className="bg-pastel-white border-b border-gray-200 px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-info">SAFE Care System</span>
            <span className="badge badge-info">Family Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {currentUser.name}
            </span>
            <button onClick={handleFamilyLogout} className="btn btn-secondary text-sm px-3 py-1">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <FamilyDashboard 
          userData={currentUser}
          data={data} 
          currentUser={currentUser}
          onLogout={handleFamilyLogout}
        />
      </div>
      
      <Modal
        isOpen={familyModalState.isOpen}
        onClose={closeFamilyModal}
        title={familyModalState.title}
        message={familyModalState.message}
        type={familyModalState.type}
        onConfirm={familyModalState.onConfirm}
        confirmText={familyModalState.confirmText}
        cancelText={familyModalState.cancelText}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NotFoundPage />} />
        <Route path="/pp-login" element={<StaffLogin />} />
        <Route path="/family-login" element={<FamilyPortal />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
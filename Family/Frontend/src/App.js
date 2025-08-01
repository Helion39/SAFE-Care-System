import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VitalsPage from './pages/VitalsPage';
import IncidentsPage from './pages/IncidentsPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallback from './pages/AuthCallback';
import ErrorPage from './pages/ErrorPage';
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/error" element={<ErrorPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vitals" 
          element={
            <ProtectedRoute>
              <Layout>
                <VitalsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/incidents" 
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #C6E7FF',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
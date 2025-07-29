'use client';

import React, { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success) {
          setCurrentUser(response.data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
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
      if (response.success) {
        setCurrentUser(response.data);
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
    }
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await apiService.seedDatabase();
      alert('Database seeded successfully! You can now login with admin/admin123');
    } catch (error) {
      console.error('Seed error:', error);
      alert('Failed to seed database');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">SAFE Care System</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Role selection screen
    if (!selectedRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">SAFE Care System</h1>
            <p className="text-gray-600 mb-6">Elderly Care Monitoring System</p>
            
            <button 
              onClick={() => handleRoleSelect('admin')} 
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 mb-3"
            >
              Login as Admin
            </button>
            
            <button 
              onClick={() => handleRoleSelect('caregiver')} 
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 mb-4"
            >
              Login as Caregiver
            </button>
            
            <div className="border-t pt-4">
              <button 
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
              >
                {isSeeding ? 'Seeding...' : 'Initialize Database'}
              </button>
              <p className="text-xs text-gray-500 mt-2">Click this first if it's your first time</p>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">Select your role to continue</p>
          </div>
        </div>
      );
    }

    // Login form screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-blue-600 mb-2 text-center">SAFE Care System</h1>
          <p className="text-gray-600 mb-6 text-center">
            {selectedRole === 'admin' ? 'Administrator Login' : 'Caregiver Login'}
          </p>
          
          <form onSubmit={handleLogin}>
            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {loginError}
              </div>
            )}
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-3 mb-4">
              <button 
                type="button"
                onClick={handleBackToRoleSelection}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Back
              </button>
              <button 
                type="submit"
                className="flex-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </form>
          
          <div className="text-center text-sm text-gray-600">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-blue-600">SAFE Care System</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentUser.role === 'admin' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Caregiver'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.name}
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            {currentUser.role === 'admin' ? 'Admin Dashboard' : 'Caregiver Dashboard'}
          </h2>
          <p className="text-gray-600">
            Welcome to the SAFE Care System! The full dashboard functionality will be available soon.
          </p>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800">✅ Authentication Working!</h3>
            <p className="text-green-700 text-sm mt-1">
              You are successfully logged in as {currentUser.role}. 
              The system is connected to MongoDB and ready for full functionality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
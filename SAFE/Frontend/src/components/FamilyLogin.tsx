import React, { useState } from 'react';
import { Users, Mail, Lock, ArrowLeft } from 'lucide-react';
import apiService from '../services/api';

interface FamilyLoginProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

export function FamilyLogin({ onLogin, onBack }: FamilyLoginProps) {
  const [loginForm, setLoginForm] = useState({ email: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    try {
      const response = await apiService.familyLogin({
        email: loginForm.email
      });
      
      if (response.success) {
        onLogin(response.data.user);
      } else {
        setLoginError(response.message || 'Login failed');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth for family login
    const baseUrl = process.env.REACT_APP_API_URL ? 
      process.env.REACT_APP_API_URL.replace('/api', '') : 
      'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '400px' }}>
        <button
          onClick={onBack}
          className="healthcare-btn healthcare-btn-secondary"
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            left: '1rem',
            padding: '0.5rem',
            minWidth: 'auto'
          }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Users style={{ width: '3rem', height: '3rem', color: 'var(--healthcare-primary)', margin: '0 auto 1rem' }} />
          <h1 className="login-title">Family Portal</h1>
          <p className="login-subtitle">Access your loved one's care information</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          {loginError && (
            <div className="healthcare-alert healthcare-alert-danger" style={{ marginBottom: '1rem' }}>
              {loginError}
            </div>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--gray-400)', 
                width: '1rem', 
                height: '1rem' 
              }} />
              <input
                type="email"
                placeholder="Enter your registered email address"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="healthcare-btn healthcare-btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '1.5rem 0',
          color: 'var(--healthcare-gray-500)',
          fontSize: '0.875rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--healthcare-gray-300)' }}></div>
          <span style={{ padding: '0 1rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--healthcare-gray-300)' }}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="healthcare-btn healthcare-btn-secondary"
          style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: '#fff',
            border: '1px solid var(--healthcare-gray-300)',
            color: '#333'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--healthcare-gray-600)'
        }}>
          <p>Don't have an account? Contact the facility administrator</p>
        </div>
      </div>
    </div>
  );
}
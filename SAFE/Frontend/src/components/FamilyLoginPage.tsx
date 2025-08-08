import React, { useState } from 'react';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import { Users, UserPlus } from 'lucide-react';

export function FamilyLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { modalState, showAlert, closeModal } = useModal();

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Redirect to Google OAuth for family login
    const baseUrl = process.env.REACT_APP_API_URL ? 
      process.env.REACT_APP_API_URL.replace('/api', '') : 
      'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  const handleRegister = () => {
    showAlert(
      'Request Family Access',
      'Family registration will be handled by facility staff. Please contact the care facility to get access to your loved one\'s care information.',
      'info'
    );
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '5rem', 
            height: '5rem', 
            backgroundColor: '#1565C0', 
            borderRadius: '50%', 
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
          <h1 className="login-title" style={{ color: '#1565C0' }}>Family Portal</h1>
          <p className="login-subtitle" style={{ fontSize: 'var(--text-base)' }}>
            Stay connected with your loved one's care
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="btn btn-primary w-full"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: '#1565C0',
              color: 'white',
              fontSize: 'var(--text-base)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '1rem 0',
            color: 'var(--gray-500)',
            fontSize: 'var(--text-sm)'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
            <span style={{ padding: '0 1rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-300)' }}></div>
          </div>

          <button
            onClick={handleRegister}
            className="btn btn-outline w-full"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: '#E3F2FD',
              color: '#1565C0',
              border: '1px solid #1565C0',
              fontSize: 'var(--text-base)'
            }}
          >
            <UserPlus style={{ width: '1.2rem', height: '1.2rem' }} />
            Request Family Access
          </button>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#E3F2FD',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #1565C0'
        }}>
          <h3 style={{ 
            fontSize: 'var(--text-base)', 
            color: '#1565C0',
            margin: '0 0 1rem 0',
            fontWeight: '600'
          }}>How to Get Access</h3>
          <div style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--gray-600)',
            textAlign: 'left',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>• Contact your care facility to register your email</p>
            <p style={{ margin: '0 0 0.5rem 0' }}>• Use your Google account for secure access</p>
            <p style={{ margin: '0' }}>• View your loved one's care updates and vitals</p>
          </div>
        </div>

      </div>
      
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
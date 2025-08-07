import React from 'react';
import { Shield, ArrowLeft, Mail } from 'lucide-react';

interface UnauthorizedPageProps {
  onBackToLogin?: () => void;
}

export function UnauthorizedPage({ onBackToLogin }: UnauthorizedPageProps) {
  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ 
          width: '5rem', 
          height: '5rem', 
          backgroundColor: '#dc2626', 
          borderRadius: '50%', 
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Shield style={{ width: '2rem', height: '2rem', color: 'white' }} />
        </div>
        
        <h1 className="login-title" style={{ color: '#dc2626', marginBottom: '1rem' }}>
          Access Denied
        </h1>
        
        <p className="login-subtitle" style={{ marginBottom: '2rem', color: 'var(--gray-600)' }}>
          Your email address is not registered for family access to any resident's care information.
        </p>

        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            fontSize: 'var(--text-base)', 
            color: '#dc2626',
            margin: '0 0 1rem 0',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Mail style={{ width: '1rem', height: '1rem' }} />
            How to Get Access
          </h3>
          <div style={{ 
            fontSize: 'var(--text-sm)', 
            color: '#7f1d1d',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>• Contact the care facility administration</p>
            <p style={{ margin: '0 0 0.5rem 0' }}>• Request to add your email to your loved one's family access list</p>
            <p style={{ margin: '0 0 0.5rem 0' }}>• Provide proper identification and relationship verification</p>
            <p style={{ margin: '0' }}>• Once approved, you can access care information using this email</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {onBackToLogin && (
            <button
              onClick={onBackToLogin}
              className="btn btn-secondary"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              Back to Login
            </button>
          )}
          
          <button
            onClick={() => window.location.href = 'mailto:admin@safecare.com?subject=Family Access Request'}
            className="btn btn-primary"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Mail style={{ width: '1rem', height: '1rem' }} />
            Contact Admin
          </button>
        </div>
      </div>
    </div>
  );
}
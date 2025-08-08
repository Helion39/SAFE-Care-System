import React, { useState } from 'react';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import { UserPlus } from 'lucide-react';

export function FamilyLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    email: '',
    residentName: '',
    relationship: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/family/request-access`;
      console.log('Submitting request to:', apiUrl);
      console.log('Request data:', requestForm);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setShowRequestModal(false);
        setRequestForm({ email: '', residentName: '', relationship: '', message: '' });
        showAlert(
          'Request Submitted Successfully',
          'Your family access request has been sent to the facility administrator. You will be contacted soon regarding your request.',
          'info'
        );
      } else {
        showAlert(
          'Request Failed',
          data.message || 'Failed to submit your request. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error submitting family access request:', error);
      showAlert(
        'Request Failed',
        `Failed to submit your request: ${error.message}. Please check your internet connection and try again.`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestForm({ email: '', residentName: '', relationship: '', message: '' });
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            margin: '0 auto 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="/SAFE.png"
              alt="SAFE Care System"
              style={{
                width: '10rem',
                height: '10rem',
                objectFit: 'contain'
              }}
            />
          </div>
          <h1 className="login-title" style={{ color: 'var(--info)' }}>Family Portal</h1>
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
              backgroundColor: 'var(--pastel-primary)',
              color: 'var(--info)',
              fontSize: 'var(--text-base)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
              backgroundColor: 'var(--info-light)',
              color: 'var(--info)',
              border: '1px solid var(--info)',
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
          backgroundColor: 'var(--info-light)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--info)'
        }}>
          <h3 style={{
            fontSize: 'var(--text-base)',
            color: 'var(--info)',
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

      {/* Family Access Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--pastel-white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              color: 'var(--info)',
              marginBottom: '1.5rem',
              fontSize: 'var(--text-xl)',
              fontWeight: '600'
            }}>Request Family Access</h2>

            <form onSubmit={handleRequestSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--gray-700)'
                }}>Your Email Address *</label>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)'
                  }}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--gray-700)'
                }}>Resident Name *</label>
                <input
                  type="text"
                  value={requestForm.residentName}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, residentName: e.target.value }))}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)'
                  }}
                  placeholder="Enter the resident's full name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--gray-700)'
                }}>Relationship (Optional)</label>
                <input
                  type="text"
                  value={requestForm.relationship}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, relationship: e.target.value }))}
                  className="input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)'
                  }}
                  placeholder="e.g., Son, Daughter, Spouse"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--gray-700)'
                }}>Additional Message (Optional)</label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Any additional information or special requests..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseRequestModal}
                  className="btn btn-outline"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)'
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--pastel-primary)',
                    color: 'var(--info)',
                    border: '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)'
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
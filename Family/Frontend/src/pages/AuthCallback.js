import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
          // Handle authentication errors
          navigate('/auth/error?message=' + error);
          return;
        }

        if (token && refreshToken) {
          // Login with tokens
          login(token, refreshToken);
          navigate('/dashboard');
        } else {
          // Missing tokens
          navigate('/auth/error?message=missing_tokens');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth/error?message=callback_error');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner text="Completing sign in..." />
        <p className="mt-4 text-sm text-gray-600">
          Please wait while we complete your authentication...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
import React from 'react';
import { HeartIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50 to-secondary-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-accent to-primary-300 rounded-2xl flex items-center justify-center mb-6 shadow-soft">
            <HeartIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            SAFE Care
          </h1>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Family Portal
          </p>
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Stay connected with your loved one's care. Access vital signs, incident reports, and health updates securely.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 my-8">
          <div className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <HeartIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Real-time Health Data</h3>
              <p className="text-xs text-gray-600">Monitor vitals and health status</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Secure Access</h3>
              <p className="text-xs text-gray-600">Protected with Google authentication</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Family Focused</h3>
              <p className="text-xs text-gray-600">Designed for family members</p>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-accent to-primary-400 hover:from-primary-400 hover:to-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing in, you agree to access only your authorized family member's care information. 
              <br />
              <span className="font-medium">Secure • Private • HIPAA Compliant</span>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              Need Access?
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              If you don't have access yet, please contact the care facility staff to be added to your loved one's authorized family members list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
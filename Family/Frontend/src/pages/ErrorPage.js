import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ExclamationTriangleIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message');

  const getErrorContent = (error) => {
    switch (error) {
      case 'not_authorized':
        return {
          title: 'Access Not Authorized',
          description: 'Your Google account is not linked to any resident in our system.',
          action: 'Please contact the care facility staff to be added as an authorized family member.',
          showContact: true
        };
      case 'access_revoked':
        return {
          title: 'Access Revoked',
          description: 'Your access to this resident\'s information has been revoked.',
          action: 'Please contact the care facility if you believe this is an error.',
          showContact: true
        };
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'We encountered a technical issue while processing your request.',
          action: 'Please try again in a few moments or contact support if the problem persists.',
          showContact: false
        };
      case 'missing_tokens':
        return {
          title: 'Authentication Error',
          description: 'There was an issue with the authentication process.',
          action: 'Please try signing in again.',
          showContact: false
        };
      case 'callback_error':
        return {
          title: 'Sign In Error',
          description: 'There was an error completing your sign in.',
          action: 'Please try signing in again.',
          showContact: false
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'We encountered an unexpected error.',
          action: 'Please try again or contact support if the problem persists.',
          showContact: false
        };
    }
  };

  const errorContent = getErrorContent(errorMessage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-50 to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Error Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-soft">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorContent.title}
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorContent.description}
          </p>
        </div>

        {/* Action Message */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {errorContent.action}
          </p>

          {/* Contact Information */}
          {errorContent.showContact && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Contact Care Facility:
              </h3>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Phone</p>
                  <p className="text-sm text-gray-600">(555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <EnvelopeIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Email</p>
                  <p className="text-sm text-gray-600">family@safecare.com</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent to-primary-400 hover:from-primary-400 hover:to-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200 transform hover:scale-105"
            >
              Try Signing In Again
            </Link>

            {errorContent.showContact && (
              <button
                onClick={() => window.open('tel:+15551234567')}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Call Care Facility
              </button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            If you continue to experience issues, please contact our technical support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
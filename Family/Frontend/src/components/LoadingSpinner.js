import React from 'react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-accent rounded-full animate-spin"></div>
        </div>
        
        {/* Inner ring */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${size === 'large' ? 'w-6 h-6' : size === 'medium' ? 'w-4 h-4' : 'w-2 h-2'} border-2 border-gray-300 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-transparent border-t-primary-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
      </div>
      
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
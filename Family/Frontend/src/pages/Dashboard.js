import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HeartIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user, resident } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await familyAPI.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getVitalsStatusColor = (status) => {
    switch (status) {
      case 'recent': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'old': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_old': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50 border-red-200';
      case 'claimed': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error Loading Dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-accent hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-br from-accent to-primary-300 rounded-2xl flex items-center justify-center">
              {dashboardData?.resident?.profileImage ? (
                <img
                  src={dashboardData.resident.profileImage}
                  alt={dashboardData.resident.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-600">
                Viewing care information for <span className="font-semibold">{dashboardData?.resident?.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Room {dashboardData?.resident?.room} • Age {dashboardData?.resident?.age} • Caregiver: {dashboardData?.resident?.assignedCaregiver}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="text-sm text-gray-500">
              Last updated: {dashboardData?.lastUpdated ? format(new Date(dashboardData.lastUpdated), 'MMM d, yyyy h:mm a') : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vitals Status */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Latest Vitals</h3>
              {dashboardData?.vitals?.latest ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    {dashboardData.vitals.latest.systolicBP}/{dashboardData.vitals.latest.diastolicBP} mmHg
                  </p>
                  <p className="text-sm text-gray-600">
                    {dashboardData.vitals.latest.heartRate} BPM
                  </p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVitalsStatusColor(dashboardData.vitals.status.status)}`}>
                    {dashboardData.vitals.status.timeAgo}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No vitals data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Health Summary */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {dashboardData?.vitals?.healthSummary?.status === 'normal' ? (
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              )}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Health Status</h3>
              <div className="mt-2">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  dashboardData?.vitals?.healthSummary?.status === 'normal' 
                    ? 'text-green-600 bg-green-50 border-green-200'
                    : 'text-yellow-600 bg-yellow-50 border-yellow-200'
                }`}>
                  {dashboardData?.vitals?.healthSummary?.status === 'normal' ? 'Normal' : 'Needs Attention'}
                </div>
                {dashboardData?.vitals?.healthSummary?.alerts?.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {dashboardData.vitals.healthSummary.alerts[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.incidents?.recent?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                  Last 7 days
                  {dashboardData?.incidents?.activeCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {dashboardData.incidents.activeCount} active
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Vitals Details */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Vitals Reading</h3>
          {dashboardData?.vitals?.latest ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600">Blood Pressure</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.vitals.latest.systolicBP}/{dashboardData.vitals.latest.diastolicBP}
                  </p>
                  <p className="text-xs text-gray-500">mmHg</p>
                </div>
                <div className="bg-card rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.vitals.latest.heartRate}
                  </p>
                  <p className="text-xs text-gray-500">BPM</p>
                </div>
              </div>
              {dashboardData.vitals.latest.temperature && (
                <div className="bg-card rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-600">Temperature</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.vitals.latest.temperature}°F
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Recorded {formatDistanceToNow(new Date(dashboardData.vitals.latest.timestamp))} ago</span>
                {dashboardData.vitals.latest.hasAlerts && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Has Alerts
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <HeartIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No vitals data available</p>
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
          {dashboardData?.incidents?.recent?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.incidents.recent.slice(0, 3).map((incident, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {incident.type.replace('_', ' ')} Incident
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(incident.detectionTime))} ago
                      </p>
                    </div>
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
              {dashboardData.incidents.recent.length > 3 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    And {dashboardData.incidents.recent.length - 3} more incidents
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-300" />
              <p className="mt-2 text-sm text-gray-500">No recent incidents</p>
              <p className="text-xs text-gray-400">Great news! Everything looks good.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
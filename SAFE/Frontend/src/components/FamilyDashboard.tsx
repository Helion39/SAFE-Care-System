import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Heart, Activity, AlertTriangle, User } from 'lucide-react';

interface FamilyDashboardProps {
  userData: any;
  data?: any;
  currentUser?: any;
  onLogout?: () => void;
}

export function FamilyDashboard({ userData, data, currentUser, onLogout }: FamilyDashboardProps) {
  const [loading, setLoading] = useState(false);

  const residentData = data?.residents?.[0] || null;
  const vitals = data?.vitals || [];
  const incidents = data?.incidents || [];

  if (loading) return <div>Loading...</div>;
  if (!residentData) return <div>No resident data found for your email.</div>;

  const latestVitals = vitals[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="card-header" style={{ fontSize: 'var(--text-2xl)' }}>
        <User />
        {residentData.name}'s Care Dashboard
      </div>

      <div className="grid grid-3">
        <div className="metric-card-refined">
          <div className="metric-label-top">Latest Vitals</div>
          {latestVitals ? (
            <div>
              <div>BP: {latestVitals.systolicBP || latestVitals.systolic_bp}/{latestVitals.diastolicBP || latestVitals.diastolic_bp}</div>
              <div>HR: {latestVitals.heartRate || latestVitals.heart_rate} bpm</div>
              <div>Temp: {latestVitals.temperature}°C</div>
              <div className="text-sm text-gray-500">
                {new Date(latestVitals.timestamp || latestVitals.createdAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div>No vitals recorded</div>
          )}
        </div>

        <div className="metric-card-refined">
          <div className="metric-label-top">Room</div>
          <div className="metric-number-large">{residentData.room || residentData.room_number}</div>
        </div>

        <div className="metric-card-refined">
          <div className="metric-label-top">Recent Incidents</div>
          <div className="metric-number-large">{incidents.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Medical Conditions</div>
        <div className="flex flex-wrap gap-1">
          {(residentData.medicalConditions || residentData.medical_conditions || []).map((condition: string, index: number) => (
            <span key={index} className="badge badge-secondary">{condition}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Recent Vitals History</div>
        <div className="space-y-2">
          {vitals.length > 0 ? vitals.slice(0, 5).map((vital: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div>BP: {vital.systolicBP || vital.systolic_bp}/{vital.diastolicBP || vital.diastolic_bp}</div>
                <div>HR: {vital.heartRate || vital.heart_rate} bpm</div>
                <div>Temp: {vital.temperature}°C</div>
                {vital.notes && <div className="text-sm text-gray-600">Notes: {vital.notes}</div>}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(vital.timestamp || vital.createdAt).toLocaleDateString()}
                <br />
                {new Date(vital.timestamp || vital.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )) : (
            <div className="text-gray-500 text-center py-4">No vitals recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
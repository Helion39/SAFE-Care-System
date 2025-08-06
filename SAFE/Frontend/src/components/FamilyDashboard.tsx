import React from 'react';
import { VitalsChart } from './VitalsChart';
import { Heart, Phone, Calendar, Activity, AlertCircle, User, Stethoscope, Clock } from 'lucide-react';

interface FamilyDashboardProps {
  data: any;
  currentUser: any;
  onLogout: () => void;
}

export function FamilyDashboard({ data, currentUser, onLogout }: FamilyDashboardProps) {
  // Find resident by assigned resident ID
  const resident = data.residents.find((r: any) => 
    (r._id || r.id) === currentUser.assignedResidentId
  );

  if (!resident) {
    return (
      <div className="flex items-center justify-center" style={{ height: '24rem' }}>
        <div className="card text-center" style={{ maxWidth: '28rem' }}>
          <User style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>No Resident Associated</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-2)' }}>
            Your account is not currently linked to any resident. Please contact the facility administrator.
          </p>
          <button onClick={onLogout} className="btn btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const residentId = resident._id || resident.id;
  
  const residentVitals = data.vitals
    .filter((v: any) => {
      const vResidentId = v.resident_id || v.residentId;
      return vResidentId === residentId;
    })
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const latestVitals = residentVitals[0];

  const recentIncidents = data.incidents
    .filter((i: any) => {
      const iResidentId = i.residentId || i.resident_id;
      return iResidentId === residentId;
    })
    .sort((a: any, b: any) => new Date(b.detectionTime || b.detection_time).getTime() - new Date(a.detectionTime || a.detection_time).getTime())
    .slice(0, 5);

  // Find assigned caregiver
  const assignedCaregiverId = resident.assignedCaregiver?._id || resident.assignedCaregiver || resident.assigned_caregiver_id;
  const assignedCaregiver = data.users.find((u: any) => (u._id || u.id) === assignedCaregiverId) || resident.assignedCaregiver;

  return (
    <div className="flex flex-col gap-3">
      {/* Resident Overview */}
      <div className="card">
        <div className="card-header">
          <User />
          {resident.name} - Care Monitoring
        </div>
        <div className="grid grid-3">
          <div>
            <div className="mb-1">
              <strong>Room:</strong> {resident.room || resident.room_number}
            </div>
            <div>
              <strong>Age:</strong> {resident.age} years
            </div>
          </div>
          <div>
            <div className="mb-1">
              <strong>Medical Conditions:</strong>
            </div>
            <div>
              {(resident.medicalConditions || resident.medical_conditions || []).map((condition: string, index: number) => (
                <span key={index} className="badge badge-secondary" style={{ marginRight: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                  {condition}{index < (resident.medicalConditions || resident.medical_conditions || []).length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1">
              <strong>Assigned Caregiver:</strong>
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              {assignedCaregiver ? assignedCaregiver.name : 'Not assigned'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Latest Vitals */}
        <div className="card">
          <div className="card-header">
            <Stethoscope style={{ width: '1.25rem', height: '1.25rem' }} />
            Latest Vital Signs
          </div>
          {latestVitals ? (
            <div>
              <div className="grid grid-2 mb-2">
                <div className="form-group">
                  <label className="label">Blood Pressure</label>
                  <div className="input" style={{ backgroundColor: 'var(--gray-50)' }}>
                    {latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Heart Rate</label>
                  <div className="input" style={{ backgroundColor: 'var(--gray-50)' }}>
                    {latestVitals.heart_rate} bpm
                  </div>
                </div>
              </div>
              {latestVitals.temperature && (
                <div className="form-group">
                  <label className="label">Temperature</label>
                  <div className="input" style={{ backgroundColor: 'var(--gray-50)' }}>
                    {latestVitals.temperature}°F
                  </div>
                </div>
              )}
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginTop: 'var(--space-1)' }}>
                <Clock style={{ width: '0.75rem', height: '0.75rem', display: 'inline', marginRight: '0.25rem' }} />
                Last checked: {new Date(latestVitals.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center p-3">
              <Activity style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
              <p style={{ color: 'var(--gray-500)' }}>No vital signs recorded yet</p>
            </div>
          )}
        </div>

        {/* Health Status */}
        <div className="card">
          <div className="card-header">
            <Heart />
            Health Status
          </div>
          {latestVitals ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span>Blood Pressure:</span>
                {latestVitals.systolic_bp > 140 || latestVitals.diastolic_bp > 90 ? (
                  <span className="badge badge-error">High</span>
                ) : latestVitals.systolic_bp < 90 || latestVitals.diastolic_bp < 60 ? (
                  <span className="badge badge-warning">Low</span>
                ) : (
                  <span className="badge badge-success">Normal</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Heart Rate:</span>
                {latestVitals.heart_rate > 100 ? (
                  <span className="badge badge-error">High</span>
                ) : latestVitals.heart_rate < 60 ? (
                  <span className="badge badge-warning">Low</span>
                ) : (
                  <span className="badge badge-success">Normal</span>
                )}
              </div>
              <div style={{ 
                padding: 'var(--space-2)', 
                backgroundColor: 'var(--primary-light)', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--gray-200)',
                marginTop: 'var(--space-1)'
              }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                  Overall health status is being monitored by medical staff.
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>
              No health data available
            </p>
          )}
        </div>
      </div>

      {/* Vitals Chart */}
      {residentVitals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Activity />
            Vital Signs Trends
          </div>
          <VitalsChart vitals={residentVitals} />
        </div>
      )}

      {/* Recent Vitals History */}
      <div className="card">
        <div className="card-header">
          <Calendar />
          Recent Vital Signs History
        </div>
        {residentVitals.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Blood Pressure</th>
                <th>Heart Rate</th>
                <th>Date/Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {residentVitals.slice(0, 10).map((vital: any) => (
                <tr key={vital.id}>
                  <td style={{ fontWeight: '500' }}>
                    {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {vital.heart_rate} bpm
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                    {new Date(vital.timestamp).toLocaleString()}
                  </td>
                  <td>
                    {vital.systolic_bp > 140 || vital.diastolic_bp > 90 ? (
                      <span className="badge badge-error">High BP</span>
                    ) : vital.systolic_bp < 90 || vital.diastolic_bp < 60 ? (
                      <span className="badge badge-warning">Low BP</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-3">
            <Activity style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
            <p style={{ color: 'var(--gray-500)' }}>No vital signs recorded yet</p>
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <div className="card-header">
          <AlertCircle />
          Recent Incidents
        </div>
        {recentIncidents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentIncidents.map((incident: any) => (
              <div 
                key={incident.id} 
                style={{ 
                  padding: 'var(--space-2)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: incident.status === 'resolved' ? 'var(--primary-light)' : 'var(--gray-50)'
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {incident.type} - {incident.severity}
                  </span>
                  <span className={`badge ${
                    incident.status === 'resolved' ? 'badge-success' : 
                    incident.status === 'claimed' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {incident.status}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', marginBottom: 'var(--space-1)' }}>
                  {incident.description}
                </p>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                  {new Date(incident.detectionTime || incident.detection_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-3">
            <AlertCircle style={{ width: '3rem', height: '3rem', margin: '0 auto var(--space-2)', color: 'var(--gray-400)' }} />
            <p style={{ color: 'var(--gray-500)' }}>No recent incidents</p>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="card">
        <div className="card-header">
          <Phone />
          Emergency Contact
        </div>
        <div style={{ 
          padding: 'var(--space-3)',
          backgroundColor: 'var(--primary-light)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>
            Facility Emergency Line
          </p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--primary)', marginBottom: 'var(--space-1)' }}>
            (555) 123-4567
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
            Available 24/7 for emergencies
          </p>
        </div>
      </div>
    </div>
  );
}
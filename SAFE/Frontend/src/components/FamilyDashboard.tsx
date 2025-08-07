import { Heart, Activity, User, Home, Clock, FileText, Thermometer } from 'lucide-react';

interface FamilyDashboardProps {
  userData: any;
  data?: any;
  currentUser?: any;
  onLogout?: () => void;
}

export function FamilyDashboard({ userData, data, currentUser, onLogout }: FamilyDashboardProps) {
  // Use data passed from parent instead of making separate API call
  const residentData = data?.residents?.[0] || null;
  const vitals = data?.vitals || [];

  if (!residentData) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      color: '#1565C0',
      textAlign: 'center',
      padding: '20px'
    }}>
      No resident data found for your email.
    </div>
  );

  const latestVitals = vitals[0];

  return (
    <div style={{
      backgroundColor: '#f5f9ff',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ padding: '24px' }}>
        {/* Plain Header Title */}
        <h1 style={{
          color: '#1565C0',
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 32px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <User style={{ width: '24px', height: '24px' }} />
          {residentData.name}'s Care Dashboard
        </h1>

        {/* Key Metrics - Admin Dashboard Style */}
        <div className="grid grid-4" style={{ marginBottom: '32px' }}>
          {/* Latest Blood Pressure Metric */}
          <div className="metric-card-refined metric-card-info">
            <div className="metric-label-top">Blood Pressure</div>
            <div className="metric-content">
              <div className="metric-number-large text-info">
                {latestVitals ?
                  `${latestVitals.systolicBP || latestVitals.systolic_bp}/${latestVitals.diastolicBP || latestVitals.diastolic_bp}`
                  : '--/--'
                }
              </div>
              <Heart className="metric-icon-small" />
            </div>
          </div>

          {/* Heart Rate Metric */}
          <div className="metric-card-refined metric-card-success">
            <div className="metric-label-top">Heart Rate</div>
            <div className="metric-content">
              <div className="metric-number-large text-success">
                {latestVitals ? (latestVitals.heartRate || latestVitals.heart_rate) : '--'}
              </div>
              <Activity className="metric-icon-small" />
            </div>
          </div>

          {/* Temperature Metric */}
          <div className="metric-card-refined metric-card-purple">
            <div className="metric-label-top">Temperature</div>
            <div className="metric-content">
              <div className="metric-number-large text-purple">
                {latestVitals && latestVitals.temperature ? latestVitals.temperature : '--'}
              </div>
              <Thermometer className="metric-icon-small" />
            </div>
          </div>

          {/* Room Number Metric - Moved to the right */}
          <div className="metric-card-refined metric-card-warning">
            <div className="metric-label-top">Room Number</div>
            <div className="metric-content">
              <div className="metric-number-large text-warning">
                {residentData.room || residentData.room_number}
              </div>
              <Home className="metric-icon-small" />
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            backgroundColor: '#E3F2FD',
            padding: '16px 24px'
          }}>
            <h3 style={{
              color: '#1565C0',
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText style={{ width: '16px', height: '16px' }} />
              Medical Conditions
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {(residentData.medicalConditions || residentData.medical_conditions || []).map((condition: string, index: number) => (
                <span key={index} style={{
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid #BBDEFB'
                }}>
                  {condition}
                </span>
              ))}
              {(!residentData.medicalConditions && !residentData.medical_conditions) ||
                (residentData.medicalConditions || residentData.medical_conditions || []).length === 0 && (
                  <div style={{
                    color: '#6c757d',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '100%',
                    padding: '20px 0'
                  }}>
                    <FileText style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 16px',
                      color: '#adb5bd'
                    }} />
                    No medical conditions recorded
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Recent Vitals History - Compact Mobile View */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            backgroundColor: '#E3F2FD',
            padding: '16px 24px'
          }}>
            <h3 style={{
              color: '#1565C0',
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Activity style={{ width: '16px', height: '16px' }} />
              Recent Vitals History
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            {vitals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vitals.slice(0, 3).map((vital: any, index: number) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #E3F2FD',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '500', color: '#495057' }}>BP: </span>
                        <span style={{ color: '#1565C0', fontWeight: '600' }}>
                          {vital.systolicBP || vital.systolic_bp}/{vital.diastolicBP || vital.diastolic_bp}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '500', color: '#495057' }}>HR: </span>
                        <span style={{ color: '#1565C0', fontWeight: '600' }}>
                          {vital.heartRate || vital.heart_rate} bpm
                        </span>
                      </div>
                    </div>
                    {vital.temperature && (
                      <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '500', color: '#495057' }}>Temp: </span>
                        <span style={{ color: '#1565C0', fontWeight: '600' }}>
                          {vital.temperature}°C
                        </span>
                      </div>
                    )}
                    {vital.notes && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        marginBottom: '12px',
                        fontStyle: 'italic',
                        backgroundColor: '#E3F2FD',
                        padding: '8px 12px',
                        borderRadius: '6px'
                      }}>
                        Notes: {vital.notes}
                      </div>
                    )}
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      textAlign: 'right',
                      borderTop: '1px solid #e9ecef',
                      paddingTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px'
                    }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {new Date(vital.timestamp || vital.createdAt).toLocaleDateString()} at{' '}
                      {new Date(vital.timestamp || vital.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                {vitals.length > 3 && (
                  <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    fontSize: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e9ecef'
                  }}>
                    Showing 3 of {vitals.length} recent vitals
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                padding: '60px 20px',
                fontSize: '14px'
              }}>
                <Activity style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px',
                  color: '#adb5bd'
                }} />
                No vitals recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
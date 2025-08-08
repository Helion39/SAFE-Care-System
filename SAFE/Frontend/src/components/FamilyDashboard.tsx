import { Heart, Activity, User, Home, Clock, FileText, Thermometer } from 'lucide-react';
import { ChatbotWidget } from './ChatbotWidget';

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
    <>
    <div className="bg-pastel-background min-h-screen font-sans">
      <div className="p-6">
        {/* Plain Header Title */}
        <h1 className="text-info text-xl font-semibold mb-8 flex items-center gap-3">
          <User className="w-6 h-6" />
          {residentData.name}'s Care Dashboard
        </h1>

        {/* Key Metrics - Admin Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="bg-white rounded-lg overflow-hidden mb-8 shadow-sm">
          <div className="bg-info-light p-4">
            <h3 className="text-info text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Medical Conditions
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {(residentData.medicalConditions || residentData.medical_conditions || []).map((condition: string, index: number) => (
                <span key={index} className="bg-info-light text-info py-2 px-4 rounded-full text-sm font-medium border border-blue-200">
                  {condition}
                </span>
              ))}
              {(!residentData.medicalConditions && !residentData.medical_conditions) ||
                (residentData.medicalConditions || residentData.medical_conditions || []).length === 0 && (
                  <div className="text-gray-500 italic text-sm text-center w-full py-5">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    No medical conditions recorded
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Recent Vitals History - Compact Mobile View */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="bg-info-light p-4">
            <h3 className="text-info text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Vitals History
            </h3>
          </div>
          <div className="p-6">
            {vitals.length > 0 ? (
              <div className="flex flex-col gap-4">
                {vitals.slice(0, 3).map((vital: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-5 border border-blue-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">BP: </span>
                        <span className="text-info font-semibold">
                          {vital.systolicBP || vital.systolic_bp}/{vital.diastolicBP || vital.diastolic_bp}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">HR: </span>
                        <span className="text-info font-semibold">
                          {vital.heartRate || vital.heart_rate} bpm
                        </span>
                      </div>
                    </div>
                    {vital.temperature && (
                      <div className="text-sm mb-3">
                        <span className="font-medium text-gray-600">Temp: </span>
                        <span className="text-info font-semibold">
                          {vital.temperature}°C
                        </span>
                      </div>
                    )}
                    {vital.notes && (
                      <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-md mb-3">
                        Notes: {vital.notes}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 text-right border-t pt-3 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(vital.timestamp || vital.createdAt).toLocaleDateString()} at{' '}
                      {new Date(vital.timestamp || vital.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                {vitals.length > 3 && (
                  <div className="text-center text-gray-500 text-xs pt-3 border-t">
                    Showing 3 of {vitals.length} recent vitals
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16 text-sm">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                No vitals recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* Chatbot Widget */}
    <ChatbotWidget />
    </>
  );
}
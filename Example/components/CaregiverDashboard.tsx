import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { VitalsChart } from './VitalsChart';
import { generateHealthSummary } from './mockData';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Stethoscope,
  Brain
} from 'lucide-react';

export function CaregiverDashboard({ data, setData, currentUser, onTriggerAlert, onResolveIncident }) {
  const [vitalsForm, setVitalsForm] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: ''
  });
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const assignedResident = data.residents.find(r => r.id === currentUser.assigned_resident_id);
  
  const residentVitals = assignedResident 
    ? data.vitals
        .filter(v => v.resident_id === assignedResident.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  const claimedIncidents = data.incidents.filter(
    i => i.claimed_by === currentUser.id && i.status === 'claimed'
  );

  const handleVitalsSubmit = (e) => {
    e.preventDefault();
    if (!assignedResident) return;

    const newVital = {
      id: Date.now(),
      resident_id: assignedResident.id,
      systolic_bp: parseInt(vitalsForm.systolic_bp),
      diastolic_bp: parseInt(vitalsForm.diastolic_bp),
      heart_rate: parseInt(vitalsForm.heart_rate),
      timestamp: new Date().toISOString(),
      caregiver_id: currentUser.id
    };

    setData(prev => ({
      ...prev,
      vitals: [newVital, ...prev.vitals]
    }));

    setVitalsForm({
      systolic_bp: '',
      diastolic_bp: '',
      heart_rate: ''
    });
  };

  const handleGenerateAISummary = () => {
    if (assignedResident) {
      const summary = generateHealthSummary(residentVitals, assignedResident.name);
      setAiSummary(summary);
      setShowAISummary(true);
    }
  };

  const handleIncidentResolution = (incidentId, isTrueEmergency) => {
    onResolveIncident(incidentId, isTrueEmergency);
  };

  if (!assignedResident) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Assignment</h3>
            <p className="text-muted-foreground">
              You are not currently assigned to a resident. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestVitals = residentVitals[0];

  return (
    <div className="space-y-6">
      {/* Incident Response Section */}
      {claimedIncidents.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Active Incident Response Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {claimedIncidents.map(incident => (
              <div key={incident.id} className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>Emergency detected for {incident.resident_name}</strong> in Room {incident.room_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Detected: {new Date(incident.detection_time).toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Please verify the situation and confirm if this is a true emergency or false alarm.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleIncidentResolution(incident.id, true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Confirm Emergency
                  </Button>
                  <Button 
                    onClick={() => handleIncidentResolution(incident.id, false)}
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    False Alarm
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resident Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {assignedResident.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Room:</span>
                <Badge variant="outline">{assignedResident.room_number}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Age:</span>
                <span className="text-sm">{assignedResident.age} years</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Medical Conditions:</span>
              <div className="flex flex-wrap gap-1">
                {assignedResident.medical_conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Latest Vitals:</span>
              {latestVitals ? (
                <div className="text-sm space-y-1">
                  <div>BP: {latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg</div>
                  <div>HR: {latestVitals.heart_rate} bpm</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(latestVitals.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No recent vitals</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitals Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Log Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVitalsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic BP</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={vitalsForm.systolic_bp}
                    onChange={(e) => setVitalsForm(prev => ({
                      ...prev,
                      systolic_bp: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic BP</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={vitalsForm.diastolic_bp}
                    onChange={(e) => setVitalsForm(prev => ({
                      ...prev,
                      diastolic_bp: e.target.value
                    }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="72"
                  value={vitalsForm.heart_rate}
                  onChange={(e) => setVitalsForm(prev => ({
                    ...prev,
                    heart_rate: e.target.value
                  }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Record Vitals
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Health Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGenerateAISummary}
              disabled={residentVitals.length === 0}
              className="w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Health Summary
            </Button>
            
            {showAISummary && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis Report
                </h4>
                <div className="text-sm whitespace-pre-line">{aiSummary}</div>
              </div>
            )}
            
            {residentVitals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Record some vital signs to generate AI insights
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vitals Chart */}
      {residentVitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vital Signs Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VitalsChart vitals={residentVitals} />
          </CardContent>
        </Card>
      )}

      {/* Recent Vitals History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {residentVitals.length > 0 ? (
            <div className="space-y-2">
              {residentVitals.slice(0, 5).map(vital => (
                <div key={vital.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {vital.systolic_bp}/{vital.diastolic_bp} mmHg
                      </span>
                      <span className="font-medium">
                        {vital.heart_rate} bpm
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(vital.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vital.systolic_bp > 140 || vital.diastolic_bp > 90 ? (
                      <Badge variant="destructive">High BP</Badge>
                    ) : vital.systolic_bp < 90 || vital.diastolic_bp < 60 ? (
                      <Badge variant="secondary">Low BP</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No vital signs recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Emergency Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emergency Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => onTriggerAlert(assignedResident.id)}
            variant="outline"
            size="sm"
          >
            Simulate Emergency for {assignedResident.name}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
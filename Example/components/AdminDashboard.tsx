import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { VitalsChart } from './VitalsChart';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Camera, 
  Phone,
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';

export function AdminDashboard({ data, setData, onTriggerAlert, onResolveIncident }) {
  const [selectedResident, setSelectedResident] = useState(null);

  const activeIncidents = data.incidents.filter(i => i.status === 'active' || i.status === 'claimed');
  const resolvedToday = data.incidents.filter(i => 
    i.status === 'resolved' && 
    new Date(i.resolved_time).toDateString() === new Date().toDateString()
  );

  const handleAssignCaregiver = (residentId, caregiverId) => {
    setData(prev => ({
      ...prev,
      residents: prev.residents.map(r =>
        r.id === residentId ? { ...r, assigned_caregiver_id: parseInt(caregiverId) } : r
      ),
      users: prev.users.map(u =>
        u.id === parseInt(caregiverId) ? { ...u, assigned_resident_id: residentId } : u
      )
    }));
  };

  const handleConfirmEmergency = (incidentId) => {
    const adminAction = "Hospital contacted - Emergency services dispatched";
    onResolveIncident(incidentId, true, adminAction);
  };

  const getResidentVitals = (residentId) => {
    return data.vitals
      .filter(v => v.resident_id === residentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{activeIncidents.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Residents</p>
                <p className="text-2xl font-bold text-primary">{data.residents.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Caregivers</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {data.users.filter(u => u.role === 'caregiver').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-primary">{resolvedToday.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Active Emergency Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeIncidents.map(incident => {
                const caregiver = data.users.find(u => u.id === incident.claimed_by);
                return (
                  <Alert key={incident.id} className="border-red-200">
                    <AlertDescription className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {incident.status === 'claimed' ? 'BEING HANDLED' : 'AWAITING RESPONSE'}
                          </Badge>
                          <span className="font-semibold">{incident.resident_name}</span>
                          <span className="text-sm text-muted-foreground">
                            Room {incident.room_number}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Detected: {new Date(incident.detection_time).toLocaleString()}
                          {caregiver && (
                            <span className="ml-4">
                              Claimed by: {caregiver.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {incident.status === 'claimed' && (
                        <Button
                          onClick={() => handleConfirmEmergency(incident.id)}
                          className="bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Hospital
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Caregiver Assignments</TabsTrigger>
          <TabsTrigger value="incidents">Incident History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cameras">Camera Status</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Caregiver Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Assigned Caregiver</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.residents.map(resident => {
                    const assignedCaregiver = data.users.find(u => u.id === resident.assigned_caregiver_id);
                    return (
                      <TableRow key={resident.id}>
                        <TableCell>{resident.name}</TableCell>
                        <TableCell>{resident.room_number}</TableCell>
                        <TableCell>
                          {assignedCaregiver ? (
                            <Badge variant="secondary">{assignedCaregiver.name}</Badge>
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => handleAssignCaregiver(resident.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Assign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {data.users
                                .filter(u => u.role === 'caregiver')
                                .map(caregiver => (
                                  <SelectItem key={caregiver.id} value={caregiver.id.toString()}>
                                    {caregiver.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.incidents
                    .sort((a, b) => new Date(b.detection_time) - new Date(a.detection_time))
                    .map(incident => {
                      const responseTime = incident.resolved_time ? 
                        Math.round((new Date(incident.resolved_time) - new Date(incident.detection_time)) / 1000 / 60) 
                        : null;
                      
                      return (
                        <TableRow key={incident.id}>
                          <TableCell>
                            {new Date(incident.detection_time).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{incident.resident_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Room {incident.room_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              incident.status === 'resolved' ? 'secondary' : 
                              incident.status === 'claimed' ? 'default' : 'destructive'
                            }>
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {incident.resolution && (
                              <Badge variant={
                                incident.resolution === 'true_emergency' ? 'destructive' : 'outline'
                              }>
                                {incident.resolution === 'true_emergency' ? 'Emergency' : 'False Alarm'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {responseTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {responseTime}m
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.residents.map(resident => {
              const vitals = getResidentVitals(resident.id);
              return (
                <Card key={resident.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{resident.name} - Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VitalsChart vitals={vitals} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cameras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.camera_info.map(camera => (
                  <Card key={camera.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Room {camera.room_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Last checked: {new Date(camera.last_checked).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={camera.status === 'active' ? 'default' : 'destructive'}>
                          {camera.status === 'active' ? 'Active' : 'Maintenance Required'}
                        </Badge>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        📹 Camera feed available - AI monitoring enabled
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Emergency Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select onValueChange={setSelectedResident}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select resident..." />
              </SelectTrigger>
              <SelectContent>
                {data.residents.map(resident => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.name} - Room {resident.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedResident && onTriggerAlert(selectedResident)}
              disabled={!selectedResident}
              variant="outline"
              size="sm"
            >
              Simulate Fall Detection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
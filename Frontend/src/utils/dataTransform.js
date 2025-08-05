// Data transformation utilities to handle backend/frontend data structure differences

export const transformUser = (user) => {
  if (!user) return null;
  
  return {
    id: user._id || user.id,
    _id: user._id || user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive !== undefined ? user.isActive : (user.status === 'active'),
    status: user.isActive !== undefined ? (user.isActive ? 'active' : 'inactive') : user.status,
    phone: user.phone,
    lastLogin: user.lastLogin || user.last_login,
    isOnline: user.isOnline || false,
    createdAt: user.createdAt || user.created_at
  };
};

export const transformResident = (resident) => {
  if (!resident) return null;
  
  return {
    id: resident._id || resident.id,
    _id: resident._id || resident.id,
    name: resident.name,
    room: resident.room || resident.room_number,
    room_number: resident.room || resident.room_number,
    age: resident.age,
    medicalConditions: resident.medicalConditions || resident.medical_conditions || [],
    medical_conditions: resident.medicalConditions || resident.medical_conditions || [],
    emergencyContact: resident.emergencyContact || resident.emergency_contact,
    emergency_contact: resident.emergencyContact || resident.emergency_contact,
    assignedCaregiver: resident.assignedCaregiver,
    assigned_caregiver_id: resident.assignedCaregiver?._id || resident.assignedCaregiver || resident.assigned_caregiver_id,
    isActive: resident.isActive,
    notes: resident.notes,
    createdAt: resident.createdAt || resident.created_at,
    created_at: resident.createdAt || resident.created_at
  };
};

export const transformAssignment = (assignment) => {
  if (!assignment) return null;
  
  return {
    id: assignment._id || assignment.id,
    _id: assignment._id || assignment.id,
    caregiverId: assignment.caregiverId,
    residentId: assignment.residentId,
    caregiver: assignment.caregiverId,
    resident: assignment.residentId,
    isActive: assignment.isActive,
    shift: assignment.shift,
    priority: assignment.priority,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    assignedBy: assignment.assignedBy,
    createdAt: assignment.createdAt || assignment.created_at
  };
};

export const transformVitals = (vitals) => {
  if (!vitals) return null;
  
  return {
    id: vitals._id || vitals.id,
    _id: vitals._id || vitals.id,
    resident_id: vitals.residentId?._id || vitals.residentId || vitals.resident_id,
    residentId: vitals.residentId?._id || vitals.residentId || vitals.resident_id,
    systolic_bp: vitals.systolicBP || vitals.systolic_bp,
    diastolic_bp: vitals.diastolicBP || vitals.diastolic_bp,
    heart_rate: vitals.heartRate || vitals.heart_rate,
    temperature: vitals.temperature,
    oxygen_saturation: vitals.oxygenSaturation || vitals.oxygen_saturation,
    timestamp: vitals.timestamp,
    caregiver_id: vitals.caregiverId?._id || vitals.caregiverId || vitals.caregiver_id,
    caregiverId: vitals.caregiverId?._id || vitals.caregiverId || vitals.caregiver_id,
    notes: vitals.notes,
    alerts: vitals.alerts || [],
    resident_name: vitals.residentId?.name || vitals.resident_name,
    caregiver_name: vitals.caregiverId?.name || vitals.caregiver_name,
    createdAt: vitals.createdAt || vitals.created_at,
    updatedAt: vitals.updatedAt || vitals.updated_at
  };
};

export const transformIncident = (incident) => {
  if (!incident) return null;
  
  return {
    id: incident._id || incident.id,
    _id: incident._id || incident.id,
    resident_id: incident.residentId?._id || incident.residentId || incident.resident_id,
    residentId: incident.residentId?._id || incident.residentId || incident.resident_id,
    detection_time: incident.detectionTime || incident.detection_time,
    detectionTime: incident.detectionTime || incident.detection_time,
    type: incident.type,
    status: incident.status,
    severity: incident.severity,
    description: incident.description,
    claimed_by: incident.claimedBy?._id || incident.claimedBy || incident.claimed_by,
    claimedBy: incident.claimedBy?._id || incident.claimedBy || incident.claimed_by,
    resolution: incident.resolution,
    admin_action: incident.adminAction || incident.admin_action,
    adminAction: incident.adminAction || incident.admin_action,
    resolved_time: incident.resolvedTime || incident.resolved_time,
    resolvedTime: incident.resolvedTime || incident.resolved_time,
    resident_name: incident.residentId?.name || incident.resident_name,
    room_number: incident.residentId?.room || incident.room_number,
    notes: incident.notes,
    createdAt: incident.createdAt || incident.created_at,
    updatedAt: incident.updatedAt || incident.updated_at
  };
};

export const transformApiResponse = (response, type) => {
  if (!response || !response.data) return response;
  
  const transformers = {
    users: (data) => Array.isArray(data) ? data.map(transformUser) : transformUser(data),
    residents: (data) => Array.isArray(data) ? data.map(transformResident) : transformResident(data),
    assignments: (data) => Array.isArray(data) ? data.map(transformAssignment) : transformAssignment(data),
    vitals: (data) => Array.isArray(data) ? data.map(transformVitals) : transformVitals(data),
    incidents: (data) => Array.isArray(data) ? data.map(transformIncident) : transformIncident(data)
  };
  
  const transformer = transformers[type];
  if (transformer) {
    return {
      ...response,
      data: transformer(response.data)
    };
  }
  
  return response;
};
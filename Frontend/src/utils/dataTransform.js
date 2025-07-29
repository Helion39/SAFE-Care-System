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

export const transformApiResponse = (response, type) => {
  if (!response || !response.data) return response;
  
  const transformers = {
    users: (data) => Array.isArray(data) ? data.map(transformUser) : transformUser(data),
    residents: (data) => Array.isArray(data) ? data.map(transformResident) : transformResident(data),
    assignments: (data) => Array.isArray(data) ? data.map(transformAssignment) : transformAssignment(data)
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
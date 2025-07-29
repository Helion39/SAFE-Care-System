import React, { useState } from 'react';
import { CreateResidentForm } from './CreateResidentForm';
import apiService from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Home,
  Heart,
  Phone,
  Edit,
  Trash2
} from 'lucide-react';

interface ResidentManagementProps {
  data: any;
  setData: (data: any) => void;
  onDataChange: () => void;
}

export function ResidentManagement({ data, setData, onDataChange }: ResidentManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all');

  const residents = data.residents || [];
  const caregivers = data.users.filter((user: any) => user.role === 'caregiver');

  const filteredResidents = residents.filter((resident: any) => {
    const room = resident.room || resident.room_number;
    const conditions = resident.medicalConditions || resident.medical_conditions || [];
    const assignedCaregiverId = resident.assignedCaregiver?._id || resident.assignedCaregiver || resident.assigned_caregiver_id;
    
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (conditions && conditions.some((condition: string) => 
                           condition.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    
    const matchesFilter = filterAssignment === 'all' || 
                         (filterAssignment === 'assigned' && assignedCaregiverId) ||
                         (filterAssignment === 'unassigned' && !assignedCaregiverId);
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateResident = async (residentData: any) => {
    try {
      const response = await apiService.createResident(residentData);
      if (response.success) {
        await onDataChange(); // Refresh data
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create resident:', error);
      alert('Failed to create resident: ' + error.message);
    }
  };

  const handleDeleteResident = async (residentId: number) => {
    if (window.confirm('Are you sure you want to delete this resident? This action cannot be undone and will remove all associated data.')) {
      try {
        const response = await apiService.deleteResident(residentId);
        if (response.success) {
          await onDataChange(); // Refresh data
        }
      } catch (error) {
        console.error('Failed to delete resident:', error);
        alert('Failed to delete resident: ' + error.message);
      }
    }
  };

  const handleAssignCaregiver = async (residentId: string, caregiverId: string) => {
    try {
      if (!caregiverId) {
        // Handle unassignment - we'd need a delete assignment endpoint
        console.log('Unassigning caregiver from resident:', residentId);
        return;
      }

      const assignmentData = {
        caregiverId,
        residentId,
        shift: 'full_time',
        priority: 'normal'
      };

      console.log('🔍 Sending assignment data:', assignmentData);
      console.log('🔍 caregiverId type:', typeof caregiverId, 'value:', caregiverId);
      console.log('🔍 residentId type:', typeof residentId, 'value:', residentId);
      
      const response = await apiService.createAssignment(assignmentData);
      if (response.success) {
        await onDataChange(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to assign caregiver:', error);
      alert('Failed to assign caregiver: ' + error.message);
    }
  };



  const getExistingRooms = () => {
    return residents.map((resident: any) => resident.room_number || resident.room);
  };

  const handleEditResident = (resident: any) => {
    setEditingResident(resident);
    setShowCreateForm(true);
  };

  const handleUpdateResident = async (residentData: any) => {
    try {
      const response = await apiService.updateResident(editingResident.id, residentData);
      if (response.success) {
        await onDataChange(); // Refresh data
        setShowCreateForm(false);
        setEditingResident(null);
      }
    } catch (error) {
      console.error('Failed to update resident:', error);
      alert('Failed to update resident: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingResident(null);
  };

  if (showCreateForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {editingResident ? 'Edit Resident' : 'Add New Resident'}
          </h2>
          <button
            onClick={handleCancelEdit}
            className="healthcare-btn healthcare-btn-secondary"
          >
            Back to Resident List
          </button>
        </div>
        
        <CreateResidentForm
          onCreateResident={editingResident ? handleUpdateResident : handleCreateResident}
          onCancel={handleCancelEdit}
          existingRooms={getExistingRooms().filter(room => room !== editingResident?.room_number && room !== editingResident?.room)}
          initialData={editingResident}
          isEditing={!!editingResident}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="healthcare-card-header" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            <Home />
            Resident Management
          </div>
          <p style={{ color: 'var(--healthcare-gray-600)', fontSize: '0.875rem' }}>
            Manage resident information and caregiver assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="healthcare-btn healthcare-btn-primary"
        >
          <UserPlus />
          Add New Resident
        </button>
      </div>

      {/* Stats Cards */}
      <div className="healthcare-grid healthcare-grid-4">
        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Users style={{ width: '2rem', height: '2rem', color: 'var(--healthcare-primary)' }} />
          </div>
          <div className="healthcare-metric-number">{residents.length}</div>
          <div className="healthcare-metric-label">Total Residents</div>
        </div>
        
        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Heart style={{ width: '2rem', height: '2rem', color: 'var(--healthcare-success)' }} />
          </div>
          <div className="healthcare-metric-number" style={{ color: 'var(--healthcare-success)' }}>
            {residents.filter((r: any) => r.assignedCaregiver?._id || r.assignedCaregiver || r.assigned_caregiver_id).length}
          </div>
          <div className="healthcare-metric-label">Assigned</div>
        </div>
        
        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Users style={{ width: '2rem', height: '2rem', color: 'var(--healthcare-warning)' }} />
          </div>
          <div className="healthcare-metric-number" style={{ color: 'var(--healthcare-warning)' }}>
            {residents.filter((r: any) => !(r.assignedCaregiver?._id || r.assignedCaregiver || r.assigned_caregiver_id)).length}
          </div>
          <div className="healthcare-metric-label">Unassigned</div>
        </div>
        
        <div className="healthcare-metric-card">
          <div className="healthcare-metric-icon">
            <Home style={{ width: '2rem', height: '2rem', color: 'var(--healthcare-info)' }} />
          </div>
          <div className="healthcare-metric-number" style={{ color: 'var(--healthcare-info)' }}>
            {residents.length > 0 
              ? Math.round(residents.reduce((sum: number, r: any) => sum + r.age, 0) / residents.length)
              : 0
            }
          </div>
          <div className="healthcare-metric-label">Avg Age</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="healthcare-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--healthcare-gray-400)', 
              width: '1rem', 
              height: '1rem' 
            }} />
            <input
              placeholder="Search by name, room, or medical condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="healthcare-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
            className="healthcare-input"
            style={{ width: '200px' }}
          >
            <option value="all">All Residents</option>
            <option value="assigned">Assigned Only</option>
            <option value="unassigned">Unassigned Only</option>
          </select>
        </div>
      </div>

      {/* Resident List */}
      <div className="healthcare-card">
        <div className="healthcare-card-header">
          Residents ({filteredResidents.length})
        </div>
        {filteredResidents.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem 0' }}>
            <Home style={{ width: '3rem', height: '3rem', color: 'var(--healthcare-gray-400)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--healthcare-gray-500)' }}>
              {searchTerm || filterAssignment !== 'all' 
                ? 'No residents match your search criteria'
                : 'No residents found. Add your first resident.'
              }
            </p>
            {!searchTerm && filterAssignment === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="healthcare-btn healthcare-btn-primary"
                style={{ marginTop: '1rem' }}
              >
                <UserPlus />
                Add First Resident
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="healthcare-table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Room</th>
                  <th>Age</th>
                  <th>Medical Conditions</th>
                  <th>Assigned Caregiver</th>
                  <th>Emergency Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((resident: any) => {
                  const residentId = resident._id || resident.id;
                  const assignedCaregiverId = resident.assignedCaregiver?._id || resident.assignedCaregiver || resident.assigned_caregiver_id;
                  const assignedCaregiver = caregivers.find((c: any) => (c._id || c.id) === assignedCaregiverId) || resident.assignedCaregiver;
                  
                  return (
                    <tr key={residentId}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500' }}>{resident.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--healthcare-gray-500)' }}>
                            Added {new Date(resident.createdAt || resident.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="healthcare-badge healthcare-badge-secondary" style={{ fontFamily: 'monospace' }}>
                          {resident.room || resident.room_number}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem' }}>{resident.age} years</span>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {(resident.medicalConditions || resident.medical_conditions) && (resident.medicalConditions || resident.medical_conditions).length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {(resident.medicalConditions || resident.medical_conditions).slice(0, 2).map((condition: string, index: number) => (
                                <span key={index} className="healthcare-badge healthcare-badge-secondary" style={{ fontSize: '0.75rem' }}>
                                  {condition}
                                </span>
                              ))}
                              {(resident.medicalConditions || resident.medical_conditions).length > 2 && (
                                <span className="healthcare-badge healthcare-badge-secondary" style={{ fontSize: '0.75rem' }}>
                                  +{(resident.medicalConditions || resident.medical_conditions).length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--healthcare-gray-400)', fontSize: '0.875rem' }}>None listed</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ minWidth: '160px' }}>
                          <select
                            value={assignedCaregiverId || ''}
                            onChange={(e) => handleAssignCaregiver(residentId, e.target.value)}
                            className="healthcare-input"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                          >
                            <option value="">Unassigned</option>
                            {caregivers
                              .filter((caregiver: any) => caregiver.isActive !== undefined ? caregiver.isActive : (caregiver.status === 'active'))
                              .map((caregiver: any) => {
                                const caregiverId = caregiver._id || caregiver.id;
                                return (
                                  <option key={caregiverId} value={caregiverId}>
                                    {caregiver.name}
                                  </option>
                                );
                              })}
                          </select>
                          {assignedCaregiver && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--healthcare-gray-500)', marginTop: '0.25rem' }}>
                              {assignedCaregiver.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {(resident.emergencyContact || resident.emergency_contact) ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '500' }}>{(resident.emergencyContact || resident.emergency_contact).name}</div>
                            <div style={{ color: 'var(--healthcare-gray-600)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Phone style={{ width: '0.75rem', height: '0.75rem' }} />
                              {(resident.emergencyContact || resident.emergency_contact).phone}
                            </div>
                            <div style={{ color: 'var(--healthcare-gray-500)', fontSize: '0.75rem' }}>
                              {(resident.emergencyContact || resident.emergency_contact).relationship}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--healthcare-gray-400)', fontSize: '0.875rem' }}>Not provided</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditResident(resident)}
                            className="healthcare-btn healthcare-btn-secondary"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <Edit style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDeleteResident(residentId)}
                            className="healthcare-btn healthcare-btn-secondary"
                            style={{ 
                              padding: '0.5rem 0.75rem', 
                              fontSize: '0.75rem',
                              color: 'var(--healthcare-danger)'
                            }}
                          >
                            <Trash2 style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
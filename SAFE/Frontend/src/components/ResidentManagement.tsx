import React, { useState } from 'react';
import { CreateResidentForm } from './CreateResidentForm';
import { Modal } from './Modal';
import { InputModal } from './InputModal';
import { useModal } from '../hooks/useModal';
import apiService from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Home,
  Heart,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Activity,
  MessageSquare,
  Mail,
  Plus,
  X
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
  const [showFamilyEmails, setShowFamilyEmails] = useState<string | null>(null);
  const { modalState, inputModalState, showAlert, showConfirm, showInput, closeModal, closeInputModal } = useModal();

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
      showAlert('Error', `Failed to create resident: ${error.message}`, 'error');
    }
  };

  const handleDeleteResident = async (residentId: number) => {
    showConfirm(
      'Delete Resident',
      'Are you sure you want to delete this resident? This action cannot be undone and will remove all associated data.',
      async () => {
        try {
          const response = await apiService.deleteResident(residentId);
          if (response.success) {
            await onDataChange();
            showAlert('Success', 'Resident deleted successfully', 'success');
          }
        } catch (error) {
          console.error('Failed to delete resident:', error);
          showAlert('Error', `Failed to delete resident: ${error.message}`, 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleAssignCaregiver = async (residentId: string, caregiverId: string) => {
    try {
      if (!caregiverId) {
        // Handle unassignment - find and delete existing assignment
        console.log('Unassigning caregiver from resident:', residentId);
        
        // Find the current assignment for this resident
        const assignments = data.assignments || [];
        const currentAssignment = assignments.find((assignment: any) => 
          (assignment.residentId === residentId || assignment.residentId?._id === residentId) && 
          assignment.isActive
        );
        
        if (currentAssignment) {
          const response = await apiService.deleteAssignment(currentAssignment._id || currentAssignment.id);
          if (response.success) {
            console.log('✅ Successfully unassigned caregiver');
            await onDataChange();
          }
        } else {
          console.log('ℹ️ No active assignment found to remove');
        }
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
        await onDataChange();
      }
    } catch (error) {
      console.error('Failed to assign/unassign caregiver:', error);
      showAlert('Error', `Failed to assign/unassign caregiver: ${error.message}`, 'error');
    }
  };

  const handleManageFamilyEmails = async (residentId: string, action: 'add' | 'remove', email?: string) => {
    try {
      if (action === 'add') {
        showInput(
          'Add Family Email',
          'Enter family member email address',
          async (newEmail: string) => {
            try {
              const response = await apiService.addFamilyEmail(residentId, newEmail);
              if (response.success) {
                await onDataChange();
                showAlert('Success', 'Family email added successfully', 'success');
              }
            } catch (error: any) {
              showAlert('Error', `Failed to add family email: ${error.message}`, 'error');
            }
          },
          'email',
          (value: string) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return 'Please enter a valid email address';
            }
            return null;
          }
        );
      } else if (action === 'remove' && email) {
        showConfirm(
          'Remove Family Access',
          `Remove ${email} from family access?`,
          async () => {
            const response = await apiService.removeFamilyEmail(residentId, email);
            if (response.success) {
              await onDataChange();
              showAlert('Success', 'Family email removed successfully', 'success');
            }
          },
          'Remove',
          'Cancel'
        );
      }
    } catch (error) {
      console.error('Failed to manage family email:', error);
      showAlert('Error', `Failed to manage family email: ${error.message}`, 'error');
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
        await onDataChange();
        setShowCreateForm(false);
        setEditingResident(null);
      }
    } catch (error) {
      console.error('Failed to update resident:', error);
      showAlert('Error', `Failed to update resident: ${error.message}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingResident(null);
  };

  if (showCreateForm) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>
            {editingResident ? 'Edit Resident' : 'Add New Resident'}
          </h2>
          <button
            onClick={handleCancelEdit}
            className="btn btn-secondary"
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
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="card-header mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
            <Home />
            Resident Management
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          <UserPlus />
          Add New Resident
        </button>
      </div>

      {/* Healthcare Stats Cards */}
      <div className="grid grid-4">
        <div className="metric-card-refined metric-card-success">
          <div className="metric-label-top">Daily Checkups</div>
          <div className="metric-content">
            <div className="metric-number-large" style={{ color: 'var(--success)' }}>
              {Math.max(0, residents.length - 2)}
            </div>
            <CheckCircle className="metric-icon-small" />
          </div>
        </div>
        
        <div className="metric-card-refined metric-card-warning">
          <div className="metric-label-top">Complaints</div>
          <div className="metric-content">
            <div className="metric-number-large" style={{ color: 'var(--warning)' }}>
              {Math.min(2, Math.floor(residents.length * 0.15))}
            </div>
            <MessageSquare className="metric-icon-small" />
          </div>
        </div>
        
        <div className="metric-card-refined metric-card-error">
          <div className="metric-label-top">Health Alerts</div>
          <div className="metric-content">
            <div className="metric-number-large" style={{ color: 'var(--error)' }}>
              {Math.min(1, Math.floor(residents.length * 0.1))}
            </div>
            <Activity className="metric-icon-small" />
          </div>
        </div>
        
        <div className="metric-card-refined metric-card-info">
          <div className="metric-label-top">Care Plans</div>
          <div className="metric-content">
            <div className="metric-number-large" style={{ color: 'var(--info)' }}>
              {residents.length}
            </div>
            <Heart className="metric-icon-small" />
          </div>
        </div>
      </div>

      {/* Resident List with Search and Filter */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: '#E3F2FD', 
          padding: '16px 24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h3 style={{ 
              color: '#1565C0', 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: 0 
            }}>
              Residents
            </h3>
            <span style={{ 
              color: '#1565C0', 
              fontSize: '12px' 
            }}>
              {filteredResidents.length} total
            </span>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          {/* Search and Filter Section */}
          <div className="flex flex-col gap-2" style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--gray-400)', 
                width: '1rem', 
                height: '1rem' 
              }} />
              <input
                placeholder="Search by name, room, or medical condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="input"
              style={{ width: '200px' }}
            >
              <option value="all">All Residents</option>
              <option value="assigned">Assigned Only</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>
        {filteredResidents.length === 0 ? (
          <div className="text-center p-3">
            <Home style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)', margin: '0 auto var(--space-2)' }} />
            <p style={{ color: 'var(--gray-500)' }}>
              {searchTerm || filterAssignment !== 'all' 
                ? 'No residents match your search criteria'
                : 'No residents found. Add your first resident.'
              }
            </p>
            {!searchTerm && filterAssignment === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary mt-2"
              >
                <UserPlus />
                Add First Resident
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Resident ID</th>
                  <th>Resident</th>
                  <th>Room</th>
                  <th>Age</th>
                  <th>Medical Conditions</th>
                  <th>Family Access</th>
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
                        <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                          {resident.residentId || resident.resident_id || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500' }}>{resident.name}</div>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                            Added {new Date(resident.createdAt || resident.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontFamily: 'monospace' }}>
                          {resident.room || resident.room_number}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-sm)' }}>{resident.age} years</span>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {(resident.medicalConditions || resident.medical_conditions) && (resident.medicalConditions || resident.medical_conditions).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(resident.medicalConditions || resident.medical_conditions).slice(0, 2).map((condition: string, index: number) => (
                                <span key={index} className="badge badge-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                                  {condition}
                                </span>
                              ))}
                              {(resident.medicalConditions || resident.medical_conditions).length > 2 && (
                                <span className="badge badge-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                                  +{(resident.medicalConditions || resident.medical_conditions).length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>None listed</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '180px', position: 'relative' }}>
                          {resident.familyEmails && resident.familyEmails.length > 0 ? (
                            <div>
                              <div 
                                className="flex flex-wrap gap-1 mb-1 cursor-pointer"
                                onClick={() => setShowFamilyEmails(showFamilyEmails === residentId ? null : residentId)}
                                title="Click to view all family emails"
                              >
                                {resident.familyEmails.slice(0, 2).map((email: string, index: number) => (
                                  <span key={index} className="badge badge-primary" style={{ fontSize: 'var(--text-xs)' }}>
                                    {email.length > 15 ? `${email.substring(0, 15)}...` : email}
                                  </span>
                                ))}
                                {resident.familyEmails.length > 2 && (
                                  <span className="badge badge-primary" style={{ fontSize: 'var(--text-xs)' }}>
                                    +{resident.familyEmails.length - 2} more
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                                {resident.familyEmails.length} family member{resident.familyEmails.length !== 1 ? 's' : ''}
                              </div>
                              
                              {/* Family Emails Dropdown */}
                              {showFamilyEmails === residentId && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  zIndex: 10,
                                  backgroundColor: 'var(--white)',
                                  border: '1px solid var(--gray-200)',
                                  borderRadius: 'var(--radius)',
                                  padding: 'var(--space-2)',
                                  minWidth: '250px',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}>
                                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                                    Family Access Emails
                                  </div>
                                  {resident.familyEmails.map((email: string, index: number) => (
                                    <div key={index} className="flex items-center justify-between mb-1" style={{ fontSize: 'var(--text-xs)' }}>
                                      <span>{email}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleManageFamilyEmails(residentId, 'remove', email);
                                          setShowFamilyEmails(null);
                                        }}
                                        className="btn btn-sm btn-secondary"
                                        style={{ padding: '2px 4px', minHeight: 'auto' }}
                                        title="Remove email"
                                      >
                                        <X style={{ width: '0.5rem', height: '0.5rem' }} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>No family access</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ minWidth: '160px' }}>
                          <select
                            value={assignedCaregiverId || ''}
                            onChange={(e) => handleAssignCaregiver(residentId, e.target.value)}
                            className="input"
                            style={{ width: '100%', padding: '0.5rem', fontSize: 'var(--text-sm)' }}
                          >
                            <option value="">Unassigned</option>
                            {caregivers
                              .filter((caregiver: any) => {
                                const isActive = caregiver.isActive !== undefined ? caregiver.isActive : (caregiver.status === 'active');
                                const caregiverId = caregiver._id || caregiver.id;
                                
                                // Show caregiver if:
                                // 1. They are active AND
                                // 2. They are not assigned to any other resident OR they are assigned to current resident
                                const isAssignedToOtherResident = residents.some((r: any) => {
                                  const rId = r._id || r.id;
                                  const rAssignedCaregiverId = r.assignedCaregiver?._id || r.assignedCaregiver || r.assigned_caregiver_id;
                                  return rId !== residentId && rAssignedCaregiverId === caregiverId;
                                });
                                
                                return isActive && !isAssignedToOtherResident;
                              })
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
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                              {assignedCaregiver.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {(resident.emergencyContact || resident.emergency_contact) ? (
                          <div style={{ fontSize: 'var(--text-sm)' }}>
                            <div style={{ fontWeight: '500' }}>{(resident.emergencyContact || resident.emergency_contact).name}</div>
                            <div className="flex items-center gap-1" style={{ color: 'var(--gray-600)' }}>
                              <Phone style={{ width: '0.75rem', height: '0.75rem' }} />
                              {(resident.emergencyContact || resident.emergency_contact).phone}
                            </div>
                            <div style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>
                              {(resident.emergencyContact || resident.emergency_contact).relationship}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>Not provided</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleEditResident(resident)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Edit style={{ width: '0.75rem', height: '0.75rem' }} />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleManageFamilyEmails(residentId, 'add')}
                            className="btn btn-sm btn-secondary"
                            title="Add family email"
                          >
                            <Mail style={{ width: '0.75rem', height: '0.75rem' }} />
                            <Plus style={{ width: '0.5rem', height: '0.5rem', marginLeft: '-2px' }} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteResident(residentId)}
                            className="btn btn-sm btn-secondary"
                            style={{ 
                              color: 'var(--error)'
                            }}
                          >
                            <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
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
      
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
      
      <InputModal
        isOpen={inputModalState.isOpen}
        onClose={closeInputModal}
        onSubmit={inputModalState.onSubmit!}
        title={inputModalState.title}
        placeholder={inputModalState.placeholder}
        inputType={inputModalState.inputType}
        validation={inputModalState.validation}
      />
    </div>
  );
}
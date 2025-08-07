import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import apiService from '../services/api';

interface CreateResidentFormProps {
  onCreateResident: (residentData: any) => void;
  onCancel: () => void;
  existingRooms: string[];
  initialData?: any;
  isEditing?: boolean;
}

export function CreateResidentForm({ onCreateResident, onCancel, existingRooms, initialData, isEditing }: CreateResidentFormProps) {
  const [formData, setFormData] = useState({
    residentId: initialData?.residentId || '',
    name: initialData?.name || '',
    roomNumber: initialData?.room_number || initialData?.room || '',
    age: initialData?.age?.toString() || '',
    medicalConditions: initialData?.medical_conditions?.length ? initialData.medical_conditions : initialData?.medicalConditions?.length ? initialData.medicalConditions : [''],
    familyEmails: initialData?.familyEmails?.length ? initialData.familyEmails : [''],
    emergencyContact: {
      name: initialData?.emergency_contact?.name || initialData?.emergencyContact?.name || '',
      phone: initialData?.emergency_contact?.phone || initialData?.emergencyContact?.phone || '',
      relationship: initialData?.emergency_contact?.relationship || initialData?.emergencyContact?.relationship || ''
    },
    notes: initialData?.notes || ''
  });
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [roomCheckStatus, setRoomCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [roomCheckMessage, setRoomCheckMessage] = useState('');
  const [roomCheckTimeout, setRoomCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const { modalState, showAlert, closeModal } = useModal();

  const checkRoomAvailability = useCallback(async (roomNumber: string) => {
    if (!roomNumber.trim()) {
      setRoomCheckStatus('idle');
      setRoomCheckMessage('');
      return;
    }

    setRoomCheckStatus('checking');
    setRoomCheckMessage('Checking availability...');

    try {
      const excludeId = isEditing && initialData?.id ? initialData.id : null;
      const response = await apiService.checkRoomAvailability(roomNumber.trim(), excludeId);
      
      if (response.success) {
        if (response.available) {
          setRoomCheckStatus('available');
          setRoomCheckMessage('Room available');
        } else {
          setRoomCheckStatus('taken');
          setRoomCheckMessage(`Room occupied by ${response.occupiedBy?.name} (${response.occupiedBy?.residentId})`);
        }
      }
    } catch (error) {
      setRoomCheckStatus('idle');
      setRoomCheckMessage('');
    }
  }, [isEditing, initialData?.id]);

  useEffect(() => {
    if (roomCheckTimeout) {
      clearTimeout(roomCheckTimeout);
    }

    if (formData.roomNumber.trim()) {
      const timeout = setTimeout(() => {
        checkRoomAvailability(formData.roomNumber);
      }, 500);
      
      setRoomCheckTimeout(timeout);
    } else {
      setRoomCheckStatus('idle');
      setRoomCheckMessage('');
    }

    return () => {
      if (roomCheckTimeout) {
        clearTimeout(roomCheckTimeout);
      }
    };
  }, [formData.roomNumber, checkRoomAvailability]);

  const commonMedicalConditions = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Arthritis',
    'Dementia',
    'Alzheimer\'s',
    'COPD',
    'Osteoporosis',
    'Depression',
    'Anxiety',
    'Stroke History',
    'Kidney Disease'
  ];

  const validateForm = () => {
    const newErrors: any = {};

    // Resident ID is auto-generated, no validation needed

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Resident name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Room number validation
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    } else if (roomCheckStatus === 'taken') {
      newErrors.roomNumber = 'Room number already assigned to another resident';
    } else if (roomCheckStatus === 'checking') {
      newErrors.roomNumber = 'Please wait while we check room availability';
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = 'Age must be between 1 and 120';
      }
    }

    // Family emails validation
    const validEmails = formData.familyEmails.filter(email => email.trim());
    for (let i = 0; i < validEmails.length; i++) {
      const email = validEmails[i];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors[`familyEmail${i}`] = 'Please enter a valid email address';
      }
    }

    // Emergency contact validation (optional but if provided, must be complete)
    const { emergencyContact } = formData;
    if (emergencyContact.name || emergencyContact.phone || emergencyContact.relationship) {
      if (!emergencyContact.name.trim()) {
        newErrors.emergencyContactName = 'Emergency contact name is required';
      }
      if (!emergencyContact.phone.trim()) {
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      } else if (!/^\+?[\d\s\-()]+$/.test(emergencyContact.phone)) {
        newErrors.emergencyContactPhone = 'Please enter a valid phone number';
      }
      if (!emergencyContact.relationship.trim()) {
        newErrors.emergencyContactRelationship = 'Relationship is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const residentData: any = {
        name: formData.name.trim(),
        room: formData.roomNumber.trim(),
        age: parseInt(formData.age),
        medicalConditions: formData.medicalConditions.filter(condition => condition.trim()),
        familyEmails: formData.familyEmails.filter(email => email.trim()),
        emergencyContact: (formData.emergencyContact.name || formData.emergencyContact.phone) ? {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship.trim()
        } : null,
        notes: formData.notes.trim() || null
      };
      
      // Only include residentId if editing and it exists
      if (isEditing && formData.residentId) {
        residentData.residentId = formData.residentId.trim();
      }

      onCreateResident(residentData);
      
      // Reset form
      setFormData({
        residentId: '',
        name: '',
        roomNumber: '',
        age: '',
        medicalConditions: [''],
        familyEmails: [''],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: ''
      });
      
    } catch (error) {
      showAlert('Error', 'Failed to create resident. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }));
    
    // Clear error when user starts typing
    const errorKey = `emergencyContact${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const addMedicalCondition = () => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: [...prev.medicalConditions, '']
    }));
  };

  const removeMedicalCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }));
  };

  const updateMedicalCondition = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.map((condition, i) => 
        i === index ? value : condition
      )
    }));
  };

  const selectCommonCondition = (condition: string, index: number) => {
    updateMedicalCondition(index, condition);
  };

  const addFamilyEmail = () => {
    setFormData(prev => ({
      ...prev,
      familyEmails: [...prev.familyEmails, '']
    }));
  };

  const removeFamilyEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      familyEmails: prev.familyEmails.filter((_, i) => i !== index)
    }));
  };

  const updateFamilyEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      familyEmails: prev.familyEmails.map((email, i) => 
        i === index ? value : email
      )
    }));
    
    // Clear error when user starts typing
    const errorKey = `familyEmail${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  return (
    <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card-header">
        <UserPlus style={{ width: '1.25rem', height: '1.25rem' }} />
        {isEditing ? 'Edit Resident' : 'Add New Resident'}
      </div>
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="alert alert-error">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-3">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-2)' }}>Basic Information</h3>
          
          <div className="grid grid-3 mb-2">
            {/* Resident ID - Auto Generated */}
            <div className="form-group">
              <label className="label">Resident ID</label>
              <div className="input" style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)' }}>
                {isEditing ? (formData.residentId || 'Auto-Generated') : 'Auto-Generated'}
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Resident ID will be automatically generated in sequence
              </p>
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="label">Full Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter resident's full name"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Room Number */}
            <div className="form-group">
              <label htmlFor="roomNumber" className="label">Room Number *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="roomNumber"
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  placeholder="e.g., 101, A-205"
                  className={`input ${
                    errors.roomNumber ? 'border-red-500' : 
                    roomCheckStatus === 'taken' ? 'border-red-500' :
                    roomCheckStatus === 'available' ? 'border-green-500' : ''
                  }`}
                  style={{ paddingRight: '2.5rem' }}
                />
                {roomCheckStatus !== 'idle' && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {roomCheckStatus === 'checking' && (
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid var(--gray-300)',
                        borderTop: '2px solid var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {roomCheckStatus === 'available' && (
                      <CheckCircle style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
                    )}
                    {roomCheckStatus === 'taken' && (
                      <AlertCircle style={{ width: '1rem', height: '1rem', color: 'var(--error)' }} />
                    )}
                  </div>
                )}
              </div>
              {errors.roomNumber && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.roomNumber}
                </p>
              )}
              {roomCheckMessage && !errors.roomNumber && (
                <p style={{ 
                  color: roomCheckStatus === 'available' ? 'var(--success)' : 
                         roomCheckStatus === 'taken' ? 'var(--error)' : 'var(--gray-500)',
                  fontSize: 'var(--text-sm)', 
                  marginTop: '0.25rem' 
                }}>
                  {roomCheckMessage}
                </p>
              )}
            </div>

            {/* Age */}
            <div className="form-group">
              <label htmlFor="age" className="label">Age *</label>
              <input
                id="age"
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter age"
                className={`input ${errors.age ? 'border-red-500' : ''}`}
              />
              {errors.age && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.age}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600' }}>Medical Conditions</h3>
            <button
              type="button"
              onClick={addMedicalCondition}
              className="btn btn-sm btn-secondary"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Condition
            </button>
          </div>

          {formData.medicalConditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-start mb-2">
              <div style={{ flex: 1 }}>
                <input
                  value={condition}
                  onChange={(e) => updateMedicalCondition(index, e.target.value)}
                  placeholder="Enter medical condition or select from common conditions"
                  className="input"
                />
                
                {/* Common conditions dropdown */}
                {condition === '' && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {commonMedicalConditions.map((commonCondition) => (
                      <button
                        key={commonCondition}
                        type="button"
                        onClick={() => selectCommonCondition(commonCondition, index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: 'var(--text-xs)',
                          backgroundColor: 'var(--gray-100)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--gray-200)'}
                        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--gray-100)'}
                      >
                        {commonCondition}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.medicalConditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicalCondition(index)}
                  className="btn btn-sm btn-secondary"
                >
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Family Access */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600' }}>Family Access (Optional)</h3>
            <button
              type="button"
              onClick={addFamilyEmail}
              className="btn btn-sm btn-secondary"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Email
            </button>
          </div>

          {formData.familyEmails.map((email, index) => (
            <div key={index} className="flex gap-2 items-start mb-2">
              <div style={{ flex: 1 }}>
                <input
                  value={email}
                  onChange={(e) => updateFamilyEmail(index, e.target.value)}
                  placeholder="Enter family member email address"
                  type="email"
                  className={`input ${errors[`familyEmail${index}`] ? 'border-red-500' : ''}`}
                />
                {errors[`familyEmail${index}`] && (
                  <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                    {errors[`familyEmail${index}`]}
                  </p>
                )}
              </div>
              
              {formData.familyEmails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFamilyEmail(index)}
                  className="btn btn-sm btn-secondary"
                >
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
            </div>
          ))}
          
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Family members with these email addresses will receive access to view the resident's care information.
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="mb-3">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-2)' }}>Emergency Contact (Optional)</h3>
          
          <div className="grid grid-3 mb-2">
            {/* Contact Name */}
            <div className="form-group">
              <label htmlFor="emergencyContactName" className="label">Contact Name</label>
              <input
                id="emergencyContactName"
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                placeholder="Enter contact name"
                className={`input ${errors.emergencyContactName ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactName && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.emergencyContactName}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="form-group">
              <label htmlFor="emergencyContactPhone" className="label">Phone Number</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className={`input ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactPhone && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.emergencyContactPhone}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div className="form-group">
              <label htmlFor="emergencyContactRelationship" className="label">Relationship</label>
              <input
                id="emergencyContactRelationship"
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                placeholder="e.g., Son, Daughter, Spouse"
                className={`input ${errors.emergencyContactRelationship ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactRelationship && (
                <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                  {errors.emergencyContactRelationship}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes" className="label">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter any additional notes about the resident..."
            rows={3}
            className="input textarea"
            style={{ minHeight: '80px', resize: 'vertical' }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (isEditing ? 'Updating...' : 'Adding Resident...') : (isEditing ? 'Update Resident' : 'Add Resident')}
          </button>
        </div>
      </form>
      
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
    </div>
  );
}
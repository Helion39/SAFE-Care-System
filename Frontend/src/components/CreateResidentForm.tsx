import React, { useState } from 'react';
import { UserPlus, Plus, X } from 'lucide-react';

interface CreateResidentFormProps {
  onCreateResident: (residentData: any) => void;
  onCancel: () => void;
  existingRooms: string[];
  initialData?: any;
  isEditing?: boolean;
}

export function CreateResidentForm({ onCreateResident, onCancel, existingRooms, initialData, isEditing }: CreateResidentFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    roomNumber: initialData?.room_number || initialData?.room || '',
    age: initialData?.age?.toString() || '',
    medicalConditions: initialData?.medical_conditions?.length ? initialData.medical_conditions : initialData?.medicalConditions?.length ? initialData.medicalConditions : [''],
    emergencyContact: {
      name: initialData?.emergency_contact?.name || initialData?.emergencyContact?.name || '',
      phone: initialData?.emergency_contact?.phone || initialData?.emergencyContact?.phone || '',
      relationship: initialData?.emergency_contact?.relationship || initialData?.emergencyContact?.relationship || ''
    },
    notes: initialData?.notes || ''
  });
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Resident name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Room number validation
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    } else if (existingRooms.includes(formData.roomNumber.trim())) {
      newErrors.roomNumber = 'Room number already exists';
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
      
      const residentData = {
        name: formData.name.trim(),
        room: formData.roomNumber.trim(),
        age: parseInt(formData.age),
        medicalConditions: formData.medicalConditions.filter(condition => condition.trim()),
        emergencyContact: (formData.emergencyContact.name || formData.emergencyContact.phone) ? {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship.trim()
        } : null,
        notes: formData.notes.trim() || null
      };

      onCreateResident(residentData);
      
      // Reset form
      setFormData({
        name: '',
        roomNumber: '',
        age: '',
        medicalConditions: [''],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        notes: ''
      });
      
    } catch (error) {
      setErrors({ submit: 'Failed to create resident. Please try again.' });
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

  return (
    <div className="healthcare-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="healthcare-card-header">
        <UserPlus style={{ width: '1.25rem', height: '1.25rem' }} />
        {isEditing ? 'Edit Resident' : 'Add New Resident'}
      </div>
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="healthcare-alert healthcare-alert-danger">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Basic Information</h3>
          
          <div className="healthcare-grid healthcare-grid-3" style={{ marginBottom: '1rem' }}>
            {/* Name */}
            <div className="healthcare-form-group">
              <label htmlFor="name" className="healthcare-label">Full Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter resident's full name"
                className={`healthcare-input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Room Number */}
            <div className="healthcare-form-group">
              <label htmlFor="roomNumber" className="healthcare-label">Room Number *</label>
              <input
                id="roomNumber"
                type="text"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                placeholder="e.g., 101, A-205"
                className={`healthcare-input ${errors.roomNumber ? 'border-red-500' : ''}`}
              />
              {errors.roomNumber && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.roomNumber}
                </p>
              )}
            </div>

            {/* Age */}
            <div className="healthcare-form-group">
              <label htmlFor="age" className="healthcare-label">Age *</label>
              <input
                id="age"
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter age"
                className={`healthcare-input ${errors.age ? 'border-red-500' : ''}`}
              />
              {errors.age && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.age}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Medical Conditions</h3>
            <button
              type="button"
              onClick={addMedicalCondition}
              className="healthcare-btn healthcare-btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Add Condition
            </button>
          </div>

          {formData.medicalConditions.map((condition, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <input
                  value={condition}
                  onChange={(e) => updateMedicalCondition(index, e.target.value)}
                  placeholder="Enter medical condition or select from common conditions"
                  className="healthcare-input"
                />
                
                {/* Common conditions dropdown */}
                {condition === '' && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {commonMedicalConditions.map((commonCondition) => (
                      <button
                        key={commonCondition}
                        type="button"
                        onClick={() => selectCommonCondition(commonCondition, index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--healthcare-gray-100)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--healthcare-gray-200)'}
                        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'var(--healthcare-gray-100)'}
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
                  className="healthcare-btn healthcare-btn-secondary"
                  style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                >
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Emergency Contact */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Emergency Contact (Optional)</h3>
          
          <div className="healthcare-grid healthcare-grid-3" style={{ marginBottom: '1rem' }}>
            {/* Contact Name */}
            <div className="healthcare-form-group">
              <label htmlFor="emergencyContactName" className="healthcare-label">Contact Name</label>
              <input
                id="emergencyContactName"
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                placeholder="Enter contact name"
                className={`healthcare-input ${errors.emergencyContactName ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactName && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.emergencyContactName}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="healthcare-form-group">
              <label htmlFor="emergencyContactPhone" className="healthcare-label">Phone Number</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className={`healthcare-input ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactPhone && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.emergencyContactPhone}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div className="healthcare-form-group">
              <label htmlFor="emergencyContactRelationship" className="healthcare-label">Relationship</label>
              <input
                id="emergencyContactRelationship"
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                placeholder="e.g., Son, Daughter, Spouse"
                className={`healthcare-input ${errors.emergencyContactRelationship ? 'border-red-500' : ''}`}
              />
              {errors.emergencyContactRelationship && (
                <p style={{ color: 'var(--healthcare-danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.emergencyContactRelationship}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="healthcare-form-group">
          <label htmlFor="notes" className="healthcare-label">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter any additional notes about the resident..."
            rows={3}
            className="healthcare-input"
            style={{ minHeight: '80px', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="healthcare-btn healthcare-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="healthcare-btn healthcare-btn-primary"
          >
            {isLoading ? (isEditing ? 'Updating...' : 'Adding Resident...') : (isEditing ? 'Update Resident' : 'Add Resident')}
          </button>
        </div>
      </form>
    </div>
  );
}
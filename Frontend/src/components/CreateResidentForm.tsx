import React, { useState, useEffect } from 'react';

interface CreateResidentFormProps {
  onCreateResident: (residentData: any) => void;
  onCancel: () => void;
  existingRooms?: string[];
  initialData?: any;
  isEditing?: boolean;
}

export const CreateResidentForm: React.FC<CreateResidentFormProps> = ({
  onCreateResident,
  onCancel,
  existingRooms = [],
  initialData = {},
  isEditing = false
}) => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    room: '',
    medicalConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        age: initialData.age ? String(initialData.age) : '',
        room: initialData.room || initialData.room_number || '',
        medicalConditions: (initialData.medicalConditions || initialData.medical_conditions || []).join(', '),
        emergencyContactName: initialData.emergencyContact?.name || initialData.emergency_contact?.name || '',
        emergencyContactPhone: initialData.emergencyContact?.phone || initialData.emergency_contact?.phone || '',
        emergencyContactRelationship: initialData.emergencyContact?.relationship || initialData.emergency_contact?.relationship || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.room) {
      setError('Name, age, and room are required');
      return;
    }
    if (existingRooms.includes(form.room) && (!isEditing || form.room !== initialData.room)) {
      setError('Room already assigned to another resident');
      return;
    }
    setError('');
    onCreateResident({
      name: form.name,
      age: Number(form.age),
      room: form.room,
      medicalConditions: form.medicalConditions
        ? form.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      emergencyContact: {
        name: form.emergencyContactName,
        phone: form.emergencyContactPhone,
        relationship: form.emergencyContactRelationship
      }
    });
  };

  return (
    <form className="healthcare-form" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div className="healthcare-form-group">
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="healthcare-form-group">
        <label>Age *</label>
        <input name="age" type="number" value={form.age} onChange={handleChange} required min={0} />
      </div>
      <div className="healthcare-form-group">
        <label>Room *</label>
        <input name="room" value={form.room} onChange={handleChange} required />
      </div>
      <div className="healthcare-form-group">
        <label>Medical Conditions (comma separated)</label>
        <input name="medicalConditions" value={form.medicalConditions} onChange={handleChange} />
      </div>
      <div className="healthcare-form-group">
        <label>Emergency Contact Name</label>
        <input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} />
      </div>
      <div className="healthcare-form-group">
        <label>Emergency Contact Phone</label>
        <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} />
      </div>
      <div className="healthcare-form-group">
        <label>Emergency Contact Relationship</label>
        <input name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={handleChange} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button type="submit" className="healthcare-btn healthcare-btn-primary">
          {isEditing ? 'Update' : 'Create'}
        </button>
        <button type="button" className="healthcare-btn healthcare-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};
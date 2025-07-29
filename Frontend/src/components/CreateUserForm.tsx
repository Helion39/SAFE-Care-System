import React, { useState } from 'react';

interface CreateUserFormProps {
  onCreateUser: (userData: any) => void;
  onCancel: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCreateUser, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      setError('Name, username, and password are required');
      return;
    }
    setError('');
    onCreateUser(form);
  };

  return (
    <form className="healthcare-form" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div className="healthcare-form-group">
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="healthcare-form-group">
        <label>Username *</label>
        <input name="username" value={form.username} onChange={handleChange} required />
      </div>
      <div className="healthcare-form-group">
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} />
      </div>
      <div className="healthcare-form-group">
        <label>Password *</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />
      </div>
      <div className="healthcare-form-group">
        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button type="submit" className="healthcare-btn healthcare-btn-primary">Create</button>
        <button type="button" className="healthcare-btn healthcare-btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

interface CreateUserFormProps {
  onCreateUser: (userData: any) => void;
  onCancel: () => void;
}

export function CreateUserForm({ onCreateUser, onCancel }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        username: formData.username.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null
      };

      await onCreateUser(userData);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        phone: ''
      });
      
    } catch (error) {
      setErrors({ submit: 'Failed to create user. Please try again.' });
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

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card-header">
        <UserPlus style={{ width: '1.25rem', height: '1.25rem' }} />
        Create New Caregiver Account
      </div>
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="alert alert-error">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-2 mb-2">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name" className="label">Full Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username" className="label">Username *</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              className={`input ${errors.username ? 'border-red-500' : ''}`}
            />
            {errors.username && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.username}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-2 mb-2">
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="label">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className={`input ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="label">Phone (Optional)</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={`input ${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-2 mb-2">
          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.password}
              </p>
            )}
            <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)', marginTop: '0.25rem' }}>
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                {showConfirmPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>
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
            {isLoading ? 'Creating...' : 'Create Caregiver Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
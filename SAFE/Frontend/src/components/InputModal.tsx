import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  placeholder: string;
  inputType?: 'text' | 'email';
  validation?: (value: string) => string | null;
}

export function InputModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  placeholder,
  inputType = 'text',
  validation
}: InputModalProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) {
      setError('This field is required');
      return;
    }

    if (validation) {
      const validationError = validation(value.trim());
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onSubmit(value.trim());
    setValue('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            color: 'var(--gray-400)'
          }}
        >
          <X style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Mail style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
        </div>

        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: 'var(--gray-900)'
        }}>
          {title}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <input
              type={inputType}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              placeholder={placeholder}
              className={`input ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p style={{ 
                color: 'var(--error)', 
                fontSize: 'var(--text-sm)', 
                marginTop: '0.25rem' 
              }}>
                {error}
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '80px' }}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}: ModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle style={{ width: '2rem', height: '2rem', color: 'var(--success)' }} />;
      case 'warning':
        return <AlertTriangle style={{ width: '2rem', height: '2rem', color: 'var(--warning)' }} />;
      case 'error':
        return <AlertCircle style={{ width: '2rem', height: '2rem', color: 'var(--error)' }} />;
      case 'confirm':
        return <AlertTriangle style={{ width: '2rem', height: '2rem', color: 'var(--warning)' }} />;
      default:
        return <Info style={{ width: '2rem', height: '2rem', color: 'var(--info)' }} />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
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
          onClick={onClose}
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
          {getIcon()}
        </div>

        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '1rem',
          color: 'var(--gray-900)'
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--gray-600)',
          textAlign: 'center',
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center'
        }}>
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{ minWidth: '80px' }}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary"
                style={{ minWidth: '80px' }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ minWidth: '80px' }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
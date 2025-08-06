import React, { useState } from 'react';
import apiService from '../services/api';
import { Mail } from 'lucide-react';

interface FamilyLoginProps {
  onLoginSuccess: (userData: any) => void;
}

export function FamilyLogin({ onLoginSuccess }: FamilyLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await apiService.familyLogin({ email });
      if (response.success) {
        onLoginSuccess(response.data);
      }
    } catch (error) {
      console.error('Family login failed:', error);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="card-header">
        <Mail />
        Family Access
      </div>
      <form onSubmit={handleEmailLogin}>
        <div className="form-group">
          <label className="label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="input"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Signing in...' : 'Access Care Information'}
        </button>
      </form>
    </div>
  );
}
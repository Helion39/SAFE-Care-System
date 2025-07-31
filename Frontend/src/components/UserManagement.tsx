import React, { useState } from 'react';
import { CreateUserForm } from './CreateUserForm';
import apiService from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  UserCheck,
  UserX,
  Key
} from 'lucide-react';

interface UserManagementProps {
  data: any;
  setData: (data: any) => void;
  onDataChange: () => void;
}

export function UserManagement({ data, setData, onDataChange }: UserManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const caregivers = data.users.filter((user: any) => user.role === 'caregiver');

  const filteredCaregivers = caregivers.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const userStatus = user.isActive !== undefined ? (user.isActive ? 'active' : 'inactive') : user.status;
    const matchesFilter = filterStatus === 'all' || userStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await apiService.createUser({
        name: userData.name,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        phone: userData.phone
      });
      
      if (response.success) {
        await onDataChange(); // Refresh data
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user: ' + error.message);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const response = await apiService.toggleUserStatus(userId);
      if (response.success) {
        await onDataChange(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this caregiver account? This action cannot be undone.')) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          await onDataChange(); // Refresh data
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Enter new password for this user:');
    if (newPassword && newPassword.length >= 6) {
      try {
        const response = await apiService.resetUserPassword(userId, newPassword);
        if (response.success) {
          alert('Password reset successfully');
        }
      } catch (error) {
        console.error('Failed to reset password:', error);
        alert('Failed to reset password: ' + error.message);
      }
    } else if (newPassword !== null) {
      alert('Password must be at least 6 characters long');
    }
  };

  if (showCreateForm) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>Create New Caregiver</h2>
          <button
            onClick={() => setShowCreateForm(false)}
            className="btn btn-secondary"
          >
            Back to User List
          </button>
        </div>
        
        <CreateUserForm
          onCreateUser={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="card-header mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
            <Users />
            Caregiver Management
          </div>
          <p style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)' }}>
            Manage caregiver accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          <UserPlus />
          Add New Caregiver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3">
        <div className="metric-card">
          <div className="metric-icon">
            <Users style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
          </div>
          <div className="metric-number">{caregivers.length}</div>
          <div className="metric-label">Total Caregivers</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <UserCheck style={{ width: '2rem', height: '2rem', color: 'var(--success)' }} />
          </div>
          <div className="metric-number" style={{ color: 'var(--success)' }}>
            {caregivers.filter((u: any) => u.isActive !== undefined ? u.isActive : (u.status === 'active')).length}
          </div>
          <div className="metric-label">Active Caregivers</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <UserX style={{ width: '2rem', height: '2rem', color: 'var(--error)' }} />
          </div>
          <div className="metric-number" style={{ color: 'var(--error)' }}>
            {caregivers.filter((u: any) => u.isActive !== undefined ? !u.isActive : (u.status === 'inactive')).length}
          </div>
          <div className="metric-label">Inactive Caregivers</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col gap-2">
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
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '200px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="card">
        <div className="card-header">
          Caregiver Accounts ({filteredCaregivers.length})
        </div>
        {filteredCaregivers.length === 0 ? (
          <div className="text-center p-3">
            <Users style={{ width: '3rem', height: '3rem', color: 'var(--gray-400)', margin: '0 auto var(--space-2)' }} />
            <p style={{ color: 'var(--gray-500)' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'No caregivers match your search criteria'
                : 'No caregivers found. Create your first caregiver account.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary mt-2"
              >
                <UserPlus />
                Add First Caregiver
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCaregivers.map((user: any) => {
                  const userId = user._id || user.id;
                  const isActive = user.isActive !== undefined ? user.isActive : (user.status === 'active');
                  const isOnline = user.isOnline || false;
                  
                  return (
                  <tr key={userId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.name}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                          Created {new Date(user.createdAt || user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ 
                        backgroundColor: 'var(--gray-100)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: 'var(--text-sm)' 
                      }}>
                        {user.username}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-sm)' }}>
                        {user.email && (
                          <div style={{ color: 'var(--gray-600)' }}>{user.email}</div>
                        )}
                        {user.phone && (
                          <div style={{ color: 'var(--gray-600)' }}>{user.phone}</div>
                        )}
                        {!user.email && !user.phone && (
                          <span style={{ color: 'var(--gray-400)' }}>No contact info</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        {isActive && (
                          <span className={`badge ${isOnline ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: 'var(--text-xs)' }}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                      {user.lastLogin || user.last_login 
                        ? new Date(user.lastLogin || user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleUserStatus(userId)}
                          className="btn btn-sm btn-secondary"
                          style={{ 
                            color: isActive ? 'var(--error)' : 'var(--success)'
                          }}
                        >
                          {isActive ? (
                            <>
                              <UserX style={{ width: '0.75rem', height: '0.75rem' }} />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck style={{ width: '0.75rem', height: '0.75rem' }} />
                              Activate
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleResetPassword(userId)}
                          className="btn btn-sm btn-secondary"
                        >
                          <Key style={{ width: '0.75rem', height: '0.75rem' }} />
                          Reset Password
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(userId)}
                          className="btn btn-sm btn-secondary"
                          style={{ 
                            color: 'var(--error)'
                          }}
                        >
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
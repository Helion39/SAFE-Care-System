import { transformApiResponse } from '../utils/dataTransform.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Server error' }));
        console.error('API Error Response:', data);
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
      }
      throw error;
    }
  }

  // Authentication
  async login(credentials) {
    console.log('🔍 Frontend sending login credentials:', credentials);
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('🔍 Backend login response:', response);

    if (response.success && response.data && response.data.token) {
      console.log('✅ Setting token from response.data.token');
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Users Management
  async getUsers() {
    const response = await this.request('/users');
    return transformApiResponse(response, 'users');
  }

  async getCaregivers() {
    const response = await this.request('/users/caregivers');
    return transformApiResponse(response, 'users');
  }

  async createUser(userData) {
    return this.request('/users/create-caregiver', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(userId) {
    return this.request(`/users/${userId}/toggle-status`, {
      method: 'PUT',
    });
  }

  async resetUserPassword(userId, newPassword) {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Residents Management
  async getResidents() {
    const response = await this.request('/residents');
    console.log('Residents API response:', response);
    return transformApiResponse(response, 'residents');
  }

  async createResident(residentData) {
    console.log('🔍 Creating resident with data:', residentData);
    const response = await this.request('/residents', {
      method: 'POST',
      body: JSON.stringify(residentData),
    });
    return transformApiResponse(response, 'residents');
  }

  async updateResident(residentId, residentData) {
    const response = await this.request(`/residents/${residentId}`, {
      method: 'PUT',
      body: JSON.stringify(residentData),
    });
    return transformApiResponse(response, 'residents');
  }

  async deleteResident(residentId) {
    return this.request(`/residents/${residentId}`, {
      method: 'DELETE',
    });
  }

  async getResident(residentId) {
    return this.request(`/residents/${residentId}`);
  }

  async checkRoomAvailability(roomNumber, excludeId = null) {
    const params = excludeId ? `?excludeId=${excludeId}` : '';
    return this.request(`/residents/check-room/${encodeURIComponent(roomNumber)}${params}`);
  }

  // Assignments
  async getAssignments() {
    const response = await this.request('/assignments');
    return transformApiResponse(response, 'assignments');
  }

  async createAssignment(assignmentData) {
    const response = await this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return transformApiResponse(response, 'assignments');
  }

  async updateAssignment(assignmentId, assignmentData) {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  }

  async deleteAssignment(assignmentId) {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  // Vitals
  async getVitals(residentId = null) {
    const endpoint = residentId ? `/vitals/resident/${residentId}` : '/vitals';
    const response = await this.request(endpoint);
    return transformApiResponse(response, 'vitals');
  }

  async createVitals(vitalsData) {
    const response = await this.request('/vitals', {
      method: 'POST',
      body: JSON.stringify(vitalsData),
    });
    return transformApiResponse(response, 'vitals');
  }

  // Incidents
  async getIncidents() {
    const response = await this.request('/incidents');
    return transformApiResponse(response, 'incidents');
  }

  async createIncident(incidentData) {
    const response = await this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
    return transformApiResponse(response, 'incidents');
  }

  async claimIncident(incidentId) {
    return this.request(`/incidents/${incidentId}/claim`, {
      method: 'PUT',
    });
  }

  async resolveIncident(incidentId, resolution, notes = '', adminAction = '') {
    return this.request(`/incidents/${incidentId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution, notes, adminAction }),
    });
  }

  async adminCloseIncident(incidentId, adminAction = 'Incident closed by admin') {
    return this.request(`/incidents/${incidentId}/admin-close`, {
      method: 'PUT',
      body: JSON.stringify({ adminAction }),
    });
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  async getVitalsTrends(period = '7d', residentId = null) {
    const params = new URLSearchParams({ period });
    if (residentId) params.append('residentId', residentId);
    return this.request(`/analytics/vitals-trends?${params}`);
  }

  async getResidentHealthScores() {
    return this.request('/analytics/resident-health');
  }

  // Chatbot
  async sendChatMessage(message) {
    return this.request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Family Login
  async familyLogin(credentials) {
    const response = await this.request('/auth/family-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async familyGoogleLogin(googleToken) {
    const response = await this.request('/auth/family-google-login', {
      method: 'POST',
      body: JSON.stringify({ googleToken }),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getFamilyDataByEmail(email) {
    return this.request(`/family/data/${encodeURIComponent(email)}`);
  }

  // Family Access Management
  async addFamilyEmail(residentId, email) {
    return this.request(`/residents/${residentId}/family-emails`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async removeFamilyEmail(residentId, email) {
    return this.request(`/residents/${residentId}/family-emails`, {
      method: 'DELETE',
      body: JSON.stringify({ email }),
    });
  }

  // Family-specific data access
  async getFamilyResidentData(residentId) {
    const response = await this.request(`/family/resident/${residentId}`);
    return transformApiResponse(response, 'residents');
  }

  async getFamilyVitals(residentId) {
    const response = await this.request(`/family/resident/${residentId}/vitals`);
    return transformApiResponse(response, 'vitals');
  }

  async getFamilyIncidents(residentId) {
    const response = await this.request(`/family/resident/${residentId}/incidents`);
    return transformApiResponse(response, 'incidents');
  }
}

export default new ApiService();
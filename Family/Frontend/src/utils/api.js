import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('familyToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('familyRefreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('familyToken', accessToken);
            localStorage.setItem('familyRefreshToken', newRefreshToken);
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('familyToken');
        localStorage.removeItem('familyRefreshToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const familyAPI = {
  // Auth
  getProfile: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),

  // Family data
  getResident: () => api.get('/api/family/resident'),
  getVitals: (params = {}) => api.get('/api/family/vitals', { params }),
  getIncidents: (params = {}) => api.get('/api/family/incidents', { params }),
  getDashboard: () => api.get('/api/family/dashboard'),
  getFamilyProfile: () => api.get('/api/family/profile'),
};

export default api;
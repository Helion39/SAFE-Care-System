import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  resident: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        resident: action.payload.resident,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        resident: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        resident: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('familyToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('familyToken');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: {
              id: response.data.data.id,
              name: response.data.data.name,
              email: response.data.data.email,
              profilePicture: response.data.data.profilePicture,
              relationship: response.data.data.relationship,
              lastAccess: response.data.data.lastAccess
            },
            resident: response.data.data.resident
          }
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('familyToken');
      localStorage.removeItem('familyRefreshToken');
      delete axios.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Authentication failed' });
    }
  };

  const login = (token, refreshToken) => {
    try {
      localStorage.setItem('familyToken', token);
      localStorage.setItem('familyRefreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check auth to get user data
      checkAuth();
      
      toast.success('Welcome! You have been signed in successfully.');
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      toast.error('Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('familyToken');
      localStorage.removeItem('familyRefreshToken');
      delete axios.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
      toast.success('You have been signed out successfully.');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('familyRefreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/auth/refresh', {
        refreshToken
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('familyToken', accessToken);
        localStorage.setItem('familyRefreshToken', newRefreshToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    ...state,
    login,
    logout,
    checkAuth,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
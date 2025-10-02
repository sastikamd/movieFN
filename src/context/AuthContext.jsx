import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

// API Configuration with fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://moviebookingwebbackend.onrender.com/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// DEBUG: Environment variable checking (remove in production)
console.log('🔍 Environment Debug:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});
console.log('🔗 Final Axios Base URL:', axios.defaults.baseURL);

// Request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and token handling
axios.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Checking auth status:', { token: token ? 'exists' : 'missing' });
      
      if (!token) {
        console.log('❌ No token found, user not authenticated');
        setLoading(false);
        return;
      }

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token set in axios headers');

      const response = await axios.get('/auth/me');
      console.log('✅ Auth check successful:', response.data);

      if (response.data.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        console.log('👤 User authenticated:', response.data.data);
      } else {
        console.log('❌ Auth check failed, removing token');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error.response?.data || error.message);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login:', { email, password: '***' });
      
      const response = await axios.post('/auth/login', { email, password });
      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;

        // Store token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('💾 Token stored and axios headers updated');

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        console.log('👤 User logged in:', user);
        return { success: true, message: 'Login successful' };
      } else {
        console.log('❌ Login failed:', response.data.message);
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration:', { ...userData, password: '***' });
      
      const response = await axios.post('/auth/register', userData);
      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;

        // Store token
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('💾 Token stored after registration');

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        console.log('👤 User registered and logged in:', user);
        return { success: true, message: 'Registration successful' };
      } else {
        console.log('❌ Registration failed:', response.data.message);
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('👤 Updating profile:', profileData);
      
      const response = await axios.put('/auth/profile', profileData);
      console.log('✅ Profile update response:', response.data);

      if (response.data.success) {
        setUser(response.data.data);
        console.log('👤 Profile updated:', response.data.data);
        return { success: true, message: 'Profile updated successfully' };
      } else {
        return { success: false, message: response.data.message || 'Profile update failed' };
      }
    } catch (error) {
      console.error('❌ Profile update error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    console.log('👋 Logging out user');
    
    // Clear storage and axios headers
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    console.log('✅ User logged out successfully');
  };

  // Utility function to check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Utility function to check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
    
    // Utilities
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    hasRole,
    hasAnyRole,
    
    // User info shortcuts
    userName: user?.name,
    userEmail: user?.email,
    userRole: user?.role
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
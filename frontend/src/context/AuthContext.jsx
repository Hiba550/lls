import React, { createContext, useContext, useState, useEffect } from 'react';
import userApi from '../api/userApi';
import apiClient from '../api/apiClient'; // Add this import
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing tokens on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');
      
      if (token) {
        try {
          // First try to use cached user data
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setCurrentUser(userData);
              setIsAuthenticated(true);
            } catch (parseError) {
              console.error('Failed to parse stored user data:', parseError);
            }
          }
          
          // Then try to get fresh user profile from API
          try {
            const userData = await userApi.getCurrentUser();
            setCurrentUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
          } catch (profileError) {
            console.log('Could not fetch fresh profile, using stored data');
            // Continue with stored data if available
          }
        } catch (error) {
          // If token is invalid and we have refresh token, try to refresh
          if (refreshToken) {
            try {
              const tokenResponse = await userApi.refreshToken(refreshToken);
              localStorage.setItem('authToken', tokenResponse.access);
              localStorage.setItem('refreshToken', tokenResponse.refresh);
              
              // Try again with new token
              const userData = await userApi.getCurrentUser();
              setCurrentUser(userData);
              setIsAuthenticated(true);
            } catch (refreshError) {
              // If refresh fails, clear tokens and stay logged out
              logout();
              console.error("Failed to refresh token:", refreshError);
            }
          } else {
            // No refresh token, clear any existing tokens
            logout();
          }
        }
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password, skipApiCall = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let authData;
      
      if (!skipApiCall) {
        // Call the API to login
        authData = await userApi.login({ email, password });
        
        // Validate response
        if (!authData) {
          throw new Error('Login failed: Empty response from server');
        }
        
        // Check for required data
        if (!authData.access) {
          console.error('Invalid authentication response:', authData);
          throw new Error('Login failed: Invalid server response format');
        }
        
        // Store auth data
        localStorage.setItem('authToken', authData.access);
        if (authData.refresh) {
          localStorage.setItem('refreshToken', authData.refresh);
        }
        
        // Store user data
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user));
        }
      }
      
      // Get user info if not provided in the auth response
      if (!authData?.user) {
        try {
          const userResponse = await userApi.getCurrentUser();
          if (userResponse) {
            localStorage.setItem('user', JSON.stringify(userResponse));
            setCurrentUser(userResponse);
          }
        } catch (userError) {
          console.error('Error fetching user profile:', userError);
          // Continue with login even if profile fetch fails
        }
      } else {
        setCurrentUser(authData.user);
      }
      
      setIsAuthenticated(true);
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Force login function
  const forceLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, force logout any existing sessions
      await userApi.forceLogoutEmail(email);
      
      // Then attempt login
      const authData = await userApi.login({ email, password });
      
      // Check if tokens exist in the response
      if (!authData.access) {
        console.error('Invalid authentication response:', authData);
        throw new Error('Login failed: Invalid response format');
      }
      
      // Store tokens
      localStorage.setItem('authToken', authData.access);
      if (authData.refresh) {
        localStorage.setItem('refreshToken', authData.refresh);
      }
      
      // Store user data
      if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }
      
      // Set session active flag
      localStorage.setItem('sessionActive', 'true');
      
      // Update auth context state
      setCurrentUser(authData.user || {});
      setIsAuthenticated(true);
      
      return authData;
    } catch (error) {
      console.error('Force login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Update state
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Optionally, invalidate the token on server
    if (refreshToken) {
      try {
        await userApi.logout(refreshToken);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await userApi.updateProfile(profileData);
      setCurrentUser(prev => ({...prev, ...updatedProfile}));
      return updatedProfile;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };
  
  // Check if user has specific role (admin, etc.)
  const hasRole = (role) => {
    if (!currentUser) return false;
    
    // Handle array of roles
    if (Array.isArray(role)) {
      return role.includes(currentUser.user_type);
    }
    
    return currentUser.user_type === role;
  };

  const contextValue = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    loading,
    error,
    login,
    forceLogin,
    logout,
    updateProfile,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
import React, { createContext, useContext, useState, useEffect } from 'react';
import userApi from '../api/userApi';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing tokens on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token) {
        try {
          // Get user profile if token exists
          const userData = await userApi.getProfile();
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // If token is invalid and we have refresh token, try to refresh
          if (refreshToken) {
            try {
              const tokenResponse = await userApi.refreshToken(refreshToken);
              localStorage.setItem('authToken', tokenResponse.access);
              localStorage.setItem('refreshToken', tokenResponse.refresh);
              
              // Try again with new token
              const userData = await userApi.getProfile();
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
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await userApi.login({ email, password });
      
      // Store tokens
      localStorage.setItem('authToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      
      // Set user data
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      
      return response.user;
    } catch (error) {
      console.error("Login error:", error);
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
    return currentUser.user_type === role;
  };

  const contextValue = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    loading,
    login,
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
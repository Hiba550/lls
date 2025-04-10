import apiClient from './apiClient';

/**
 * User API service - handles user profile, settings and preferences
 */
const userApi = {
  /**
   * Login user and get authentication tokens
   * @param {Object} credentials - Login credentials (email, password)
   * @returns {Promise} Authentication tokens and user data
   */
  async login(credentials) {
    try {
      console.log('Login attempt with data:', credentials);
      try {
        // First check if this account already has an active session
        await apiClient.post('/api/auth/check-session/', { email: credentials.email });
        
        // If we get here, the user doesn't have an active session (received 200 OK)
        // Proceed with login
        const response = await apiClient.post('/api/auth/login/', credentials);
        
        // Check for empty response
        if (!response) {
          console.error('Empty login response from server');
          throw new Error('Login failed: Empty response from server');
        }
        
        console.log('Login response received, data:', response.data);
        
        // Process login response - IMPORTANT: Check the full response structure
        if (!response.data || !response.data.access) {
          console.error('Invalid login response format:', response);
          throw new Error('Login failed: Invalid response format (missing tokens)');
        }
        
        // Return the data portion of the response
        return response.data;
      } catch (error) {
        // If error is 409 Conflict, a session already exists
        if (error.response?.status === 409) {
          // Show conflict error with options to force login
          const conflictError = new Error('This account is already logged in on another device. Please logout from the other session first.');
          conflictError.isSessionConflict = true;
          throw conflictError;
        }
        
        // Log and rethrow any other error
        if (error.response?.status === 401) {
          console.error('Authentication failed: Invalid credentials');
        } else {
          console.error('Login error:', error);
        }
        
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Force logout a user by email address
   * Used before force login to terminate existing sessions
   * @param {string} email - User email address
   * @returns {Promise} Success message
   */
  async forceLogoutEmail(email) {
    try {
      const response = await apiClient.post('/api/auth/force-logout-email/', { email });
      return response.data;
    } catch (error) {
      console.error('Force logout error:', error);
      throw error;
    }
  },

  /**
   * Force login by terminating existing sessions
   * @param {Object} credentials - Login credentials (email, password)
   * @returns {Promise} Authentication tokens and user data
   */
  async forceLogin(credentials) {
    try {
      // First terminate any existing sessions for this user
      await this.forceLogoutEmail(credentials.email);
      
      // Then proceed with regular login
      const response = await apiClient.post('/api/auth/login/', credentials);
      
      if (!response || !response.data) {
        console.error('Empty force login response from server');
        throw new Error('Login failed: Empty response from server');
      }
      
      // Process login response
      if (!response.data.access) {
        throw new Error('Login failed: Invalid response format (missing tokens)');
      }
      
      // Store user data if available
      if (response.data && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('sessionActive', 'true');
      }
      
      return response.data;
    } catch (error) {
      console.error("Force login error:", error);
      throw error;
    }
  },

  /**
   * Logout user (invalidate refresh token)
   * @returns {Promise} Success message
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const result = await apiClient.post('/api/auth/logout/', { refresh: refreshToken });
      
      // Clear stored tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionActive');
      
      return result;
    } catch (error) {
      // Clear tokens even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionActive');
      throw error;
    }
  },

  /**
   * Force logout a specific user by ID (admin only)
   * @param {number} userId - User ID to force logout
   * @returns {Promise} Success message
   */
  async forceLogout(userId) {
    return apiClient.post(`/api/users/${userId}/force-logout/`);
  },

  /**
   * Get all active sessions (admin only)
   * @returns {Promise} List of active user sessions
   */
  async getActiveSessions() {
    return apiClient.get('/api/sessions/');
  },

  /**
   * Refresh the access token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise} New access and refresh tokens
   */
  async refreshToken(refreshToken) {
    return apiClient.post('/api/auth/token/refresh/', { refresh: refreshToken });
  },

  /**
   * Get the current user's profile
   * @returns {Promise} User profile data
   */
  async getProfile() {
    return apiClient.get('/api/profile/');
  },

  /**
   * Update the current user's profile
   * @param {Object} profileData - Updated profile information
   * @returns {Promise} Updated user profile
   */
  async updateProfile(profileData) {
    return apiClient.patch('/api/profile/', profileData);
  },

  /**
   * Update user's password
   * @param {Object} passwordData - Contains old_password, new_password, confirm_password
   * @returns {Promise} Success message
   */
  async changePassword(passwordData) {
    return apiClient.post('/api/profile/change-password/', passwordData);
  },

  /**
   * Get user preferences and settings
   * @returns {Promise} User preferences and settings
   */
  async getPreferences() {
    return apiClient.get('/api/preferences/');
  },

  /**
   * Save user preferences and settings
   * @param {Object} preferences - User preferences to save
   * @returns {Promise} Updated preferences
   */
  async savePreferences(preferences) {
    return apiClient.patch('/api/preferences/', preferences);
  },

  /**
   * Update notification settings
   * @param {Object} notificationSettings - Updated notification settings
   * @returns {Promise} Updated notification settings
   */
  async updateNotificationSettings(notificationSettings) {
    return apiClient.patch('/api/preferences/', { notification_preferences: notificationSettings });
  },

  /**
   * Upload user avatar
   * @param {FormData} formData - Form data with avatar file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Updated user profile with avatar URL
   */
  async uploadAvatar(formData, onProgress = null) {
    return apiClient.upload('/api/users/avatar/', formData, onProgress);
  },

  /**
   * Get all users (admin only)
   * @returns {Promise} List of users
   */
  async getAllUsers() {
    try {
      const response = await apiClient.get('/api/users/');
      return response.data || []; // Ensure we always return an array
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Create a new user (admin only)
   * @param {Object} userData - New user data
   * @returns {Promise} Created user data
   */
  async createUser(userData) {
    return apiClient.post('/api/users/', userData);
  },

  /**
   * Update a user (admin only)
   * @param {number} userId - ID of user to update
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user data
   */
  async updateUser(userId, userData) {
    return apiClient.patch(`/api/users/${userId}/`, userData);
  },

  /**
   * Delete a user (admin only)
   * @param {number} userId - ID of user to delete
   * @returns {Promise} Success message
   */
  async deleteUser(userId) {
    return apiClient.delete(`/api/users/${userId}/`);
  },

  /**
   * Get current user profile
   * @returns {Promise} User profile data
   */
  async getCurrentUser() {
    return apiClient.get('/api/profile/');
  }
};

/**
 * Handle user logout - clear tokens and redirect to login
 * This is a standalone function that can be imported directly
 */
export async function handleLogout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      // Call the logout API
      try {
        await fetch('/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ refresh: refreshToken })
        });
      } catch (error) {
        console.error('API logout failed:', error);
        // Continue with local logout even if API call fails
      }
    }
    
    // Clear stored tokens with the correct key names
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionActive');
    
    // Force redirect to login
    console.log('Redirecting to login page...');
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
    // Fallback redirect
    localStorage.clear();
    window.location.replace('/login');
  }
}

export default userApi;

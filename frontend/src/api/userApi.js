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
    return apiClient.post('/api/auth/login/', credentials);
  },

  /**
   * Logout user (invalidate refresh token)
   * @param {string} refreshToken - The refresh token to invalidate
   * @returns {Promise} Success message
   */
  async logout(refreshToken) {
    return apiClient.post('/api/auth/logout/', { refresh: refreshToken });
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
    return apiClient.get('/api/users/');
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

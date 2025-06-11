import apiClient from './apiClient';

/**
 * Notification API service
 */
const notificationApi = {
  /**
   * Get user notifications with optional filtering
   * @param {Object} params - Query parameters
   * @param {boolean} params.read - Filter by read status
   * @param {string} params.notification_type - Filter by notification type
   * @param {string} params.priority - Filter by priority (low, medium, high, critical)
   * @param {string} params.search - Search in title and message
   * @param {number} params.page - Page number for pagination
   * @param {number} params.page_size - Number of items per page
   * @returns {Promise} List of notifications with pagination info
   */
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/notifications/?${queryString}` : '/api/notifications/';
    return apiClient.get(url);
  },

  /**
   * Get notification statistics
   * @returns {Promise} Notification statistics
   */
  async getStats() {
    return apiClient.get('/api/notifications/stats/');
  },

  /**
   * Get unread notification count
   * @returns {Promise} Unread count
   */
  async getUnreadCount() {
    return apiClient.get('/api/notifications/unread_count/');
  },

  /**
   * Mark a notification as read
   * @param {string|number} id - Notification ID
   * @returns {Promise} Updated notification
   */
  async markAsRead(id) {
    return apiClient.patch(`/api/notifications/${id}/`, { read: true });
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} Success message
   */
  async markAllAsRead() {
    return apiClient.post('/api/notifications/mark_all_read/');
  },

  /**
   * Mark multiple notifications as read
   * @param {Array} ids - Array of notification IDs
   * @returns {Promise} Success message
   */
  async markMultipleAsRead(ids) {
    return apiClient.post('/api/notifications/bulk_mark_read/', { notification_ids: ids });
  },

  /**
   * Delete multiple notifications
   * @param {Array} ids - Array of notification IDs
   * @returns {Promise} Success message
   */
  async deleteMultiple(ids) {
    return apiClient.post('/api/notifications/bulk_delete/', { notification_ids: ids });
  },

  /**
   * Create a notification (admin only)
   * @param {Object} notificationData - Notification data
   * @returns {Promise} Created notification
   */
  async createNotification(notificationData) {
    return apiClient.post('/api/notifications/', notificationData);
  },

  /**
   * Delete a notification
   * @param {string|number} id - Notification ID
   * @returns {Promise} Success message
   */
  async deleteNotification(id) {
    return apiClient.delete(`/api/notifications/${id}/`);
  },

  /**
   * Get user notification preferences
   * @returns {Promise} User preferences
   */
  async getPreferences() {
    return apiClient.get('/api/notifications/preferences/');
  },

  /**
   * Update user notification preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise} Updated preferences
   */
  async updatePreferences(preferences) {
    return apiClient.post('/api/notifications/preferences/', preferences);
  },

  /**
   * Poll for new notifications (real-time updates)
   * @param {string} lastChecked - ISO timestamp of last check
   * @returns {Promise} New notifications since last check
   */
  async pollNotifications(lastChecked) {
    return apiClient.get(`/api/notifications/poll/?since=${encodeURIComponent(lastChecked)}`);
  },

  /**
   * Get notification by ID
   * @param {string|number} id - Notification ID
   * @returns {Promise} Notification details
   */
  async getNotification(id) {
    return apiClient.get(`/api/notifications/${id}/`);
  },
};

export default notificationApi;
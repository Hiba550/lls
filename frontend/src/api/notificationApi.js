import apiClient from './apiClient';

/**
 * Notification API service
 */
const notificationApi = {
  /**
   * Get user notifications
   * @returns {Promise} List of notifications
   */
  async getNotifications() {
    return apiClient.get('/api/notifications/');
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
    return apiClient.post('/api/notifications/mark-all-read/');
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
};

export default notificationApi;
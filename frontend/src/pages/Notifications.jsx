import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import notificationApi from '../api/notificationApi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, info, warning, error, success
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, low, medium, high, critical
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    highPriority: 0,
    categories: {}
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  const navigate = useNavigate();

  // Fetch notifications with filters
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        ordering: '-created_at'
      };

      // Apply filters
      if (filter === 'unread') params.read = false;
      if (filter === 'read') params.read = true;
      if (typeFilter !== 'all') params.notification_type = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();      const response = await notificationApi.getNotifications(params);
      
      setNotifications(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filter, typeFilter, priorityFilter, searchQuery]);  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationApi.getStats();
      // The API client returns response data directly (not nested under .data)
      const statsData = response;
      setStats({
        total: statsData.total_notifications || 0,
        unread: statsData.unread_count || 0,
        today: statsData.today_count || 0,
        highPriority: statsData.high_priority_count || 0,
        categories: statsData.categories || {}
      });
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        unread: 0,
        today: 0,
        highPriority: 0,
        categories: {}
      });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      fetchStats();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  }, [fetchStats]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      fetchStats();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  }, [fetchStats]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      setSelectedNotifications(prev => 
        prev.filter(id => id !== notificationId)
      );
      fetchStats();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [fetchStats]);

  // Bulk operations
  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await notificationApi.markMultipleAsRead(selectedNotifications);
      setNotifications(prev => 
        prev.map(notification => 
          selectedNotifications.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
      setSelectedNotifications([]);
      fetchStats();
      toast.success(`${selectedNotifications.length} notifications marked as read`);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }, [selectedNotifications, fetchStats]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await notificationApi.deleteMultiple(selectedNotifications);
      setNotifications(prev => 
        prev.filter(notification => !selectedNotifications.includes(notification.id))
      );
      setSelectedNotifications([]);
      fetchStats();
      toast.success(`${selectedNotifications.length} notifications deleted`);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      toast.error('Failed to delete notifications');
    }
  }, [selectedNotifications, fetchStats]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  }, [navigate, markAsRead]);

  // Toggle notification selection
  const toggleNotificationSelection = useCallback((notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  }, []);

  // Select all notifications
  const selectAllNotifications = useCallback(() => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  }, [notifications, selectedNotifications]);

  // Format time
  const formatTime = useCallback((timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  }, []);

  // Get notification icon
  const getNotificationIcon = useCallback((type) => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default: // info
        return (
          <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  }, []);

  // Get priority badge
  const getPriorityBadge = useCallback((priority) => {
    const baseClass = "px-2 py-1 text-xs font-medium rounded-full";
    switch (priority) {
      case 'critical':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Critical</span>;
      case 'high':
        return <span className={`${baseClass} bg-orange-100 text-orange-800`}>High</span>;
      case 'medium':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Medium</span>;
      case 'low':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Low</span>;
      default:
        return null;
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filter, typeFilter, priorityFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Stay updated with the latest activities and alerts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V7l-7-5z" />
                </svg>
              </div>
              <div className="ml-4">                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.unread}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.highPriority}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.today}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedNotifications.length} notification(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={selectAllNotifications}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark All as Read
              </button>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You're all caught up! No notifications to display.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleNotificationSelection(notification.id);
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className={`text-sm font-medium ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className={`text-sm ${
                            !notification.read 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} notifications
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrevious}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

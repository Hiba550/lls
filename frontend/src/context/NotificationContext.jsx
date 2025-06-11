import React, { createContext, useContext, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import NotificationContainer from '../components/NotificationContainer';
import 'react-toastify/dist/ReactToastify.css';

// Create the context
const NotificationContext = createContext();

// Custom hook for using notifications
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [customNotifications, setCustomNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification to the navbar/dropdown
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      read: false,
      ...notification,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(count => count + 1);
    
    return newNotification.id;
  }, []);

  // Add a custom floating notification
  const addCustomNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString() + Math.random(),
      duration: 5000,
      position: 'top-right',
      showCloseButton: true,
      ...notification,
    };
    
    setCustomNotifications(prev => [newNotification, ...prev]);
    
    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        deleteCustomNotification(newNotification.id);
      }, newNotification.duration);
    }
    
    return newNotification.id;
  }, []);

  // Delete a custom notification
  const deleteCustomNotification = useCallback((id) => {
    setCustomNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id && !notification.read 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Delete a notification
  const deleteNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      // If removing an unread notification, decrease the count
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  }, []);
  // Success notification helper
  const success = useCallback((message, title = "Success", options = {}) => {
    const { useToast = true, useCustom = true } = options;
    
    if (useToast) {
      toast.success(message);
    }
    
    if (useCustom) {
      return addCustomNotification({
        type: 'success',
        title,
        message,
        ...options,
      });
    }
    
    return addNotification({
      type: 'success',
      title,
      message,
    });
  }, [addNotification, addCustomNotification]);

  // Error notification helper
  const error = useCallback((message, title = "Error", options = {}) => {
    const { useToast = true, useCustom = true } = options;
    
    if (useToast) {
      toast.error(message);
    }
    
    if (useCustom) {
      return addCustomNotification({
        type: 'error',
        title,
        message,
        duration: 7000, // Error messages stay longer
        ...options,
      });
    }
    
    return addNotification({
      type: 'error',
      title,
      message,
    });
  }, [addNotification, addCustomNotification]);

  // Info notification helper
  const info = useCallback((message, title = "Information", options = {}) => {
    const { useToast = true, useCustom = true } = options;
    
    if (useToast) {
      toast.info(message);
    }
    
    if (useCustom) {
      return addCustomNotification({
        type: 'info',
        title,
        message,
        ...options,
      });
    }
    
    return addNotification({
      type: 'info',
      title,
      message,
    });
  }, [addNotification, addCustomNotification]);

  // Warning notification helper
  const warning = useCallback((message, title = "Warning", options = {}) => {
    const { useToast = true, useCustom = true } = options;
    
    if (useToast) {
      toast.warning(message);
    }
    
    if (useCustom) {
      return addCustomNotification({
        type: 'warning',
        title,
        message,
        duration: 6000, // Warning messages stay a bit longer
        ...options,
      });
    }
    
    return addNotification({
      type: 'warning',
      title,
      message,
    });
  }, [addNotification, addCustomNotification]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTimeAgo,
    success,
    error,
    info,
    warning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
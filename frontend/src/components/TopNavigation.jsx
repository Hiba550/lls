import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { handleLogout } from '../api/userApi'; // Import the logout function
import { toast } from 'react-toastify';  // or your toast library
import notificationApi from '../api/notificationApi';
// Performance optimized version of TopNavigation
// Uses React.memo and useCallback to prevent unnecessary re-renders
const TopNavigation = memo(({ companyName = "Assembly Management" }) => {
  // State management
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  // Add state for logout process
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Add state for current user
  const [currentUser, setCurrentUser] = useState(null);
  // Add comprehensive notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for click outside detection
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigationRef = useRef(null);
  
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Close dropdowns when clicking outside - optimized with useCallback
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown if clicked outside
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      
      // Close notifications if clicked outside
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      
      // Close mobile menu if clicked outside navigation area
      if (navigationRef.current && 
          !navigationRef.current.contains(event.target) && 
          !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
      
      // Close active submenu if clicking outside of any nav item
      if (!event.target.closest('.nav-item-with-submenu')) {
        setActiveSubmenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle route change - close mobile menu
  useEffect(() => {
    setMobileMenuOpen(false);
    
    // Set active submenu based on current path
    const currentPath = location.pathname;
    menuItems.forEach(item => {
      if (item.hasSubmenu && 
          item.submenu.some(sub => currentPath === sub.path || currentPath.startsWith(`${sub.path}/`))) {
        setActiveSubmenu(item.id);
      }
    });
  }, [location.pathname]);

  // Handler functions - memoized with useCallback for performance
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const toggleUserDropdown = useCallback(() => {
    setUserDropdownOpen(prev => !prev);
    setNotificationsOpen(false);
  }, []);
  
  const toggleNotifications = useCallback(() => {
    setNotificationsOpen(prev => !prev);
    setUserDropdownOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const toggleSubmenu = useCallback((menuId) => {
    setActiveSubmenu(prevActive => prevActive === menuId ? null : menuId);
  }, []);

  // Handle submenu item click
  const handleSubmenuItemClick = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  // Add a wrapper function for handling logout
  const onLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await handleLogout();
      // handleLogout will handle the redirect
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      toast.error("Logout failed. Please try again.");
    }
  }, []);

  // Load user info on component mount
  useEffect(() => {
    const userJSON = localStorage.getItem('user');
    if (userJSON) {
      try {
        const userData = JSON.parse(userJSON);
        setCurrentUser(userData);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  // Function to get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!currentUser) return "U";
    
    if (currentUser.full_name) {
      const nameParts = currentUser.full_name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return currentUser.full_name[0].toUpperCase();
    }
    
    return currentUser.email ? currentUser.email[0].toUpperCase() : "U";
  }, [currentUser]);

  // Notification management functions
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);
      
      // Use real API instead of mock data
      const response = await notificationApi.getNotifications({
        page_size: 20, // Limit to 20 most recent notifications
        ordering: '-created_at' // Most recent first
      });
      
      // Transform backend data to match frontend format
      const transformedNotifications = response.results.map(notification => ({
        id: notification.id,
        type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        time: notification.created_at,
        read: notification.is_read,
        category: notification.notification_type,
        priority: notification.priority,
        actionUrl: notification.action_url
      }));
      
      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Fallback to mock data if API fails
      const mockNotifications = [
        {
          id: 1,
          type: 'warning',
          title: 'Quality Alert',
          message: 'RSM unit #307 requires inspection',
          time: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          read: false,
          category: 'quality',
          priority: 'high',
          actionUrl: '/assembly/rsm/307'
        },
        {
          id: 2,
          type: 'success',
          title: 'Work Order Completed',
          message: 'WO #1234 assembly completed successfully',
          time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          read: false,
          category: 'production',
          priority: 'medium',
          actionUrl: '/work-orders/1234'
        },
        {
          id: 3,
          type: 'info',
          title: 'New Assignment',
          message: 'YBS assembly task assigned to your queue',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
          category: 'assignment',
          priority: 'low',
          actionUrl: '/assembly/ybs'
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      toast.error('Failed to load notifications - using offline data');
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Use real API
      await notificationApi.markAsRead(notificationId);
      
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Use real API
      await notificationApi.markAllAsRead();
      
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // Use real API
      await notificationApi.deleteNotification(notificationId);
      
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setNotificationsOpen(false);
    }
  }, [navigate, markAsRead]);

  // Format time for notifications
  const formatNotificationTime = useCallback((timeString) => {
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
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default: // info
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  }, []);

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up auto-refresh for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Simplified menu items structure
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/' 
    },
    { 
      id: 'work-orders', 
      label: 'Work Orders', 
      path: '/work-orders',
      hasSubmenu: true,
      submenu: [
        { id: 'all-orders', label: 'All Orders', path: '/work-orders' },
        { id: 'create-order', label: 'Create Order', path: '/work-orders/create' },
        { id: 'orders-management', label: 'Manage Orders', path: '/work-orders/manage' }
      ]
    },
    { 
      id: 'assembly', 
      label: 'Assembly',
      path: '/assembly',
      hasSubmenu: true,
      submenu: [
        { id: 'assembly-dashboard', label: 'Assembly Dashboard', path: '/assembly' },
        { id: 'ybs-assembly', label: 'YBS Assembly', path: '/assembly/ybs' },
        { id: 'rsm-assembly', label: 'RSM Assembly', path: '/assembly/rsm' }
      ]
    },
    { 
      id: 'inventory', 
      label: 'Inventory',
      path: '/inventory',
      hasSubmenu: true,
      submenu: [
        { id: 'inventory-dashboard', label: 'Overview', path: '/inventory' },
        { id: 'parts-inventory', label: 'Parts', path: '/inventory/parts' },
        { id: 'components', label: 'Components', path: '/inventory/components' },
        { id: 'stock-management', label: 'Stock', path: '/inventory/stock' }
      ]
    },
    { 
      id: 'reports', 
      label: 'Reports',
      path: '/reports',
      hasSubmenu: true,
      submenu: [
        { id: 'production-reports', label: 'Production', path: '/reports/production' },
        { id: 'quality-reports', label: 'Quality', path: '/reports/quality' },
        { id: 'efficiency-reports', label: 'Efficiency', path: '/reports/efficiency' }
      ]
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings' 
    },
    { 
      id: 'packing', 
      label: 'Packing',
      path: '/packing' 
    },
  ];
  
  // Helper functions for menu item state
  const isActiveMenuItem = useCallback((item) => {
    if (!item.hasSubmenu) {
      return location.pathname === item.path;
    } else {
      return item.submenu.some(subItem => 
        location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`)
      );
    }
  }, [location.pathname]);
  
  const isActiveSubmenuItem = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location.pathname]);
  
  // Initialize activeSubmenu on page load
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu.some(sub => 
        location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`)
      )) {
        setActiveSubmenu(item.id);
      }
    });
  }, []);
  
  // Icons for menu items - simplified and consistent
  const getIcon = (id) => {
    switch(id) {
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            <path d="M3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
            <path d="M14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        );
      case 'work-orders':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'assembly':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
        );
      case 'inventory':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'reports':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
        );
      case 'settings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case 'packing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="sticky top-0 z-40 w-full print:hidden">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center py-2 px-3 h-14">
            {/* Logo/Brand */}
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold">
                  <span className="text-sm">AM</span>
                </div>
                <span className="ml-2 text-base font-medium text-neutral-800 dark:text-white hidden sm:block">
                  {companyName}
                </span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="-mr-2 -my-2 md:hidden">
              <button 
                type="button" 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 mobile-menu-button"
                aria-expanded="false"
              >
                <span className="sr-only">Open menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1" ref={navigationRef}>
              {menuItems.map((item) => (
                <div key={item.id} className={`relative nav-item-with-submenu ${item.hasSubmenu ? 'has-submenu' : ''}`}>
                  {item.hasSubmenu ? (
                    <button 
                      onClick={() => toggleSubmenu(item.id)} 
                      className={`flex items-center px-2 py-2 text-sm font-medium ${
                        isActiveMenuItem(item) || activeSubmenu === item.id 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white'
                      }`}
                    >
                      <span className="mr-1.5">{getIcon(item.id)}</span>
                      {item.label}
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-0.5 transition-transform ${activeSubmenu === item.id ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <NavLink 
                      to={item.path} 
                      className={({ isActive }) => `flex items-center px-2 py-2 text-sm font-medium ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white'
                      }`}
                    >
                      <span className="mr-1.5">{getIcon(item.id)}</span>
                      {item.label}
                    </NavLink>
                  )}
                  
                  {/* Submenu for desktop */}
                  {item.hasSubmenu && activeSubmenu === item.id && (
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 z-40">
                      <div className="py-1">
                        {item.submenu.map((subItem) => (
                          <button 
                            key={subItem.id} 
                            onClick={() => handleSubmenuItemClick(subItem.path)} 
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              isActiveSubmenuItem(subItem.path) 
                                ? 'text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-700 font-medium' 
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Right side - Search, Theme Toggle, Notifications, User */}
            <div className="flex items-center space-x-2 ml-auto lg:ml-0">
              {/* Search - Hidden on small screens */}
              <div className="hidden md:block relative w-full max-w-xs">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                      <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      className="w-full py-1 pl-8 pr-3 text-sm h-8 rounded bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-1 focus:ring-blue-500"
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search"
                    />
                  </div>
                </form>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                type="button"
                className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              {/* Notifications */}
              <div ref={notificationRef} className="relative">
                <button 
                  onClick={toggleNotifications}
                  type="button" 
                  className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md" 
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 z-40">
                    <div className="py-1 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="flex justify-between items-center">
                          <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">Notifications</h2>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                            {notifications.filter(n => !n.read).length} New
                          </span>
                        </div>
                      </div>
                      
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div 
                            key={notification.id}
                            className={`px-4 py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer ${!notification.read ? 'bg-neutral-50 dark:bg-neutral-800' : ''}`}
                          >
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <div className={`
                                  h-8 w-8 rounded-full flex items-center justify-center 
                                  ${notification.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 
                                    notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                                    'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                  }
                                `}>
                                  {notification.type === 'alert' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  ) : notification.type === 'success' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2">
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{notification.title}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{notification.message}</p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="ml-auto mt-1">
                                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}

                      <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
                        <button 
                          onClick={() => {
                            navigate('/notifications');
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <div ref={userDropdownRef} className="relative">
                <button 
                  onClick={toggleUserDropdown}
                  type="button" 
                  className="flex items-center" 
                  aria-label="User menu" 
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 text-sm">{getUserInitials()}</span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 z-40">
                    <div className="py-1 divide-y divide-neutral-100 dark:divide-neutral-700">
                      <div className="px-4 py-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Logged in as</p>
                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {currentUser?.email || 'user@example.com'}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">Your Profile</Link>
                        <Link to="/settings" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">Settings</Link>
                        <button 
                          onClick={onLogout}
                          disabled={isLoggingOut}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {isLoggingOut ? "Signing out..." : "Sign out"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Search bar for mobile */}
              <form onSubmit={handleSearch} className="pb-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded border-neutral-300 dark:border-neutral-600 pl-8 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-sm"
                    placeholder="Search..."
                  />
                </div>
              </form>
              
              {/* Menu items for mobile */}
              {menuItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  {item.hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className={`flex items-center justify-between w-full px-3 py-2 text-left text-base ${
                          isActiveMenuItem(item) || activeSubmenu === item.id 
                            ? 'text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-800 font-medium' 
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="mr-2 text-current">
                            {getIcon(item.id)}
                          </span>
                          {item.label}
                        </div>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 transition-transform ${activeSubmenu === item.id ? 'transform rotate-180' : ''}`} 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {activeSubmenu === item.id && (
                        <div className="pl-10 space-y-1">
                          {item.submenu.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => handleSubmenuItemClick(subItem.path)}
                              className={`block w-full text-left px-3 py-2 text-sm ${
                                isActiveSubmenuItem(subItem.path) 
                                  ? 'text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-700 font-medium' 
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({isActive}) => `flex items-center px-3 py-2 text-base ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-800 font-medium' 
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="mr-2 text-current">
                        {getIcon(item.id)}
                      </span>
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}

              {/* Dark mode toggle for mobile */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={toggleDarkMode}
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-base text-neutral-700 dark:text-neutral-300"
                >
                  <span className="mr-2 text-current">
                    {darkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </span>
                  {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
              </div>

              {/* User section for mobile */}
              <div className="pt-4 pb-2 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 text-sm">{getUserInitials()}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-neutral-800 dark:text-white">
                      {currentUser?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {currentUser?.email || 'user@example.com'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base text-neutral-700 dark:text-neutral-300"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-2 text-base text-neutral-700 dark:text-neutral-300"
                  >
                    Settings
                  </Link>
                  <Link
                    to="/packing"
                    className="block px-3 py-2 text-base text-neutral-700 dark:text-neutral-300"
                  >
                    Packing
                  </Link>
                  <button
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-3 py-2 text-base text-neutral-700 dark:text-neutral-300 disabled:opacity-50"
                  >
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
});

export default TopNavigation;
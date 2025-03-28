import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ toggleSidebar, companyName = "Assembly Management System" }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle functions
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page with query
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // Mock notifications - In a production app, these would come from an API
  const notifications = [
    { 
      id: 1, 
      type: 'alert', 
      title: 'Quality alert: RSM unit #307',
      message: 'Inspection required for RSM assembly #307', 
      time: '3 minutes ago',
      read: false
    },
    { 
      id: 2, 
      type: 'success', 
      title: 'Work order #1234 completed',
      message: 'Assembly process finished successfully', 
      time: '1 hour ago',
      read: false 
    },
    { 
      id: 3, 
      type: 'info', 
      title: 'New RSM assembly scheduled',
      message: 'New assembly task assigned to production line', 
      time: '2 hours ago',
      read: true 
    }
  ];

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-150 ease-in-out">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side - Logo and Menu Toggle */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            aria-label="Toggle sidebar menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden md:flex md:items-center ml-3">
            <span className="font-display text-lg font-medium text-neutral-800 dark:text-white">
              {companyName}
            </span>
          </div>
        </div>
        
        {/* Center - Search */}
        <div className="flex-1 max-w-md px-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                  />
                </svg>
              </span>
              <input
                className="form-input pl-10 py-1.5 text-sm h-9"
                type="text"
                placeholder="Search assemblies, orders, components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
              />
            </div>
          </form>
        </div>
        
        {/* Right side - User menu */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className="p-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors relative"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              
              {/* Notification badge - only show if there are unread notifications */}
              {notifications.some(n => !n.read) && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-neutral-800"></span>
              )}
            </button>
            
            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="card absolute right-0 mt-2 w-80 sm:w-96 max-h-[calc(100vh-80px)] overflow-hidden z-30 shadow-lg">
                <div className="card-header py-2 px-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Notifications</h3>
                    <button className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                      Mark all as read
                    </button>
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-96 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map(notification => (
                        <div key={notification.id} className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                          <div className="flex">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                              ${notification.type === 'alert' ? 'bg-danger-100 dark:bg-danger-800/30 text-danger-600 dark:text-danger-400' : 
                                notification.type === 'success' ? 'bg-success-100 dark:bg-success-800/30 text-success-600 dark:text-success-400' :
                                'bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-400'
                              }`}
                            >
                              {notification.type === 'alert' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                              {notification.type === 'success' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {notification.type === 'info' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3 flex-grow">
                              <div className="flex justify-between">
                                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  {notification.title}
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                                  {notification.time}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="card-footer py-2 px-4 text-center">
                  <Link to="/notifications" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* User profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-600">
                <img 
                  src="/images/user-avatar.jpg" 
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Admin
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 dark:text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* User dropdown */}
            {dropdownOpen && (
              <div className="card absolute right-0 mt-2 w-48 shadow-lg z-30" role="menu">
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750" role="menuitem">
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750" role="menuitem">
                    Settings
                  </Link>
                  <Link to="/activity" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750" role="menuitem">
                    Activity Log
                  </Link>
                  <hr className="border-neutral-200 dark:border-neutral-700 my-1" />
                  <button className="block w-full text-left px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-neutral-100 dark:hover:bg-neutral-750" role="menuitem">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
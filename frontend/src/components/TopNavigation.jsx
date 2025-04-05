import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const TopNavigation = ({ companyName = "Assembly Management" }) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      // Only close active submenu if clicking outside of any nav item
      if (!event.target.closest('.nav-item-with-submenu')) {
        setActiveSubmenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle navigation and keep appropriate submenu open
  useEffect(() => {
    setMobileMenuOpen(false);
    
    // Check if current path matches any submenu path
    const currentPath = location.pathname;
    
    // Set the active submenu based on the current path
    menuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu.some(sub => {
        return currentPath === sub.path || currentPath.startsWith(`${sub.path}/`);
      })) {
        setActiveSubmenu(item.id);
      }
    });
    
    // The key fix - Don't reset activeSubmenu when on a submenu page
    // Previously this was causing the "Create Work Order" tab to disappear
  }, [location.pathname]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Toggle functions
  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (userDropdownOpen) setUserDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSubmenu = (menuId) => {
    setActiveSubmenu(activeSubmenu === menuId ? null : menuId);
  };

  // Handle submenu item click
  const handleSubmenuItemClick = (path) => {
    navigate(path);
    // Keep submenu open after navigation - the useEffect will handle this
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

  // Menu items with nested structure
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      path: '/' 
    },
    { 
      id: 'work-orders', 
      label: 'Work Orders', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      path: '/work-orders',
      hasSubmenu: true,
      submenu: [
        { id: 'all-orders', label: 'All Work Orders', path: '/work-orders' },
        { id: 'create-order', label: 'Create Order', path: '/work-orders/create' },
        { id: 'orders-management', label: 'Manage Orders', path: '/work-orders/manage' }
      ]
    },
    { 
      id: 'assembly', 
      label: 'Assembly',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/assembly',
      hasSubmenu: true,
      submenu: [
        { id: 'assembly-dashboard', label: 'Assembly Dashboard', path: '/assembly' },
        { id: 'ysb-assembly', label: 'YSB Assembly', path: '/assembly/ysb' },
        { id: 'rsm-assembly', label: 'RSM Assembly', path: '/assembly/rsm' }
      ]
    },
    { 
      id: 'inventory', 
      label: 'Inventory',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      path: '/inventory',
      hasSubmenu: true,
      submenu: [
        { id: 'inventory-dashboard', label: 'Inventory Dashboard', path: '/inventory' },
        { id: 'parts-inventory', label: 'Parts', path: '/inventory/parts' },
        { id: 'components', label: 'Components', path: '/inventory/components' },
        { id: 'stock-management', label: 'Stock Management', path: '/inventory/stock' }
      ]
    },
    { 
      id: 'reports', 
      label: 'Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
        </svg>
      ),
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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/settings' 
    }
  ];
  
  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };
  
  // Determine if a menu item should be active based on path
  const isActiveMenuItem = (item) => {
    if (!item.hasSubmenu) {
      return location.pathname === item.path;
    } else {
      // If it's a parent with submenu, it's active if any of its children are active
      return item.submenu.some(subItem => 
        location.pathname === subItem.path || location.pathname.startsWith(`${subItem.path}/`)
      );
    }
  };
  
  // Determine if a submenu item should be active
  const isActiveSubmenuItem = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Initialize activeSubmenu when page loads if we're on a submenu path
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu.some(sub => 
        location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`)
      )) {
        setActiveSubmenu(item.id);
      }
    });
  }, []);
  
  return (
    <div className="sticky top-0 z-40 w-full">
      <header className="bg-white dark:bg-neutral-900 shadow-md border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-150 ease-in-out">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 md:space-x-10">
            {/* Logo/Brand */}
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-md flex items-center justify-center text-white font-bold shadow-sm shadow-primary-500/10">
                  <span className="text-lg">AM</span>
                </div>
                <span className="ml-3 text-lg font-bold text-neutral-800 dark:text-white hidden sm:block">
                  {companyName}
                </span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="-mr-2 -my-2 md:hidden">
              <button 
                type="button" 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 dark:text-neutral-300 hover:text-neutral-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open menu</span>
                <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {menuItems.map((item) => (
                <div key={item.id} className={`relative nav-item-with-submenu group ${item.hasSubmenu ? 'has-submenu' : ''}`}>
                  {item.hasSubmenu ? (
                    <button 
                      onClick={() => toggleSubmenu(item.id)} 
                      className={`flex items-center rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm ${isActiveMenuItem(item) || activeSubmenu === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'}`}
                    >
                      <span className={`mr-2 ${isActiveMenuItem(item) || activeSubmenu === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform ${activeSubmenu === item.id ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <NavLink 
                      to={item.path} 
                      className={({ isActive }) => `flex items-center rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-300'}`}
                    >
                      <span className="mr-2">
                        {item.icon}
                      </span>
                      {item.label}
                    </NavLink>
                  )}
                  
                  {/* Submenu for desktop */}
                  {item.hasSubmenu && (
                    <AnimatePresence>
                      {activeSubmenu === item.id && (
                        <motion.div 
                          initial="hidden" 
                          animate="visible" 
                          exit="hidden" 
                          variants={dropdownVariants}
                          className="absolute left-0 mt-1 w-48 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 focus:outline-none z-40"
                        >
                          <div className="py-1">
                            {item.submenu.map((subItem) => (
                              <button 
                                key={subItem.id} 
                                onClick={() => handleSubmenuItemClick(subItem.path)} 
                                className={`block w-full text-left px-4 py-2 text-sm ${isActiveSubmenuItem(subItem.path) ? 'text-primary-600 dark:text-primary-400 bg-neutral-50 dark:bg-neutral-700/50 font-medium' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                              >
                                {subItem.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Right side - Search, Theme Toggle, Notifications, User */}
          <div className="flex items-center space-x-3 ml-auto lg:ml-0">
            {/* Search - Hidden on small screens */}
            <div className="hidden md:block relative w-full max-w-xs">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" />
                    </svg>
                  </span>
                  <input
                    className="w-full form-input pl-10 py-1.5 text-sm h-9 rounded-full bg-neutral-100 dark:bg-neutral-700 border-none focus:ring-2 focus:ring-primary-500 shadow-inner"
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
                className="flex items-center justify-center rounded-full p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
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
                  className="flex items-center justify-center rounded-full p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900" 
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-0 right-0.5 block h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div 
                      initial="hidden" 
                      animate="visible" 
                      exit="hidden" 
                      variants={dropdownVariants}
                      className="absolute right-0 mt-1 w-80 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 focus:outline-none z-40"
                    >
                      <div className="py-1 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-neutral-800 dark:text-white">Notifications</h2>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                              {notifications.filter(n => !n.read).length} New
                            </span>
                          </div>
                        </div>
                        
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <div 
                              key={notification.id}
                              className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-neutral-50 dark:bg-neutral-800/60' : ''}`}
                            >
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <div className={`
                                    h-10 w-10 rounded-full flex items-center justify-center 
                                    ${notification.type === 'alert' ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' : 
                                      notification.type === 'success' ? 'bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400' :
                                      'bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400'
                                    }
                                  `}>
                                    {notification.type === 'alert' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                    ) : notification.type === 'success' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{notification.title}</p>
                                    {!notification.read && (
                                      <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{notification.message}</div>
                                  <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{notification.time}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                            <p className="text-sm">No notifications</p>
                          </div>
                        )}

                        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
                          <button className="w-full text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                            View all notifications
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* User Menu */}
              <div ref={userDropdownRef} className="relative">
                <button 
                  onClick={toggleUserDropdown}
                  type="button" 
                  className="flex max-w-xs items-center rounded-full p-1 text-sm text-neutral-500 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900" 
                  aria-label="User menu" 
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/30 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                    <span className="font-medium text-primary-600 dark:text-primary-400">JD</span>
                  </div>
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div 
                      initial="hidden" 
                      animate="visible" 
                      exit="hidden" 
                      variants={dropdownVariants}
                      className="absolute right-0 mt-1 w-48 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 focus:outline-none z-40"
                    >
                      <div className="py-1 divide-y divide-neutral-100 dark:divide-neutral-700">
                        <div className="px-4 py-3">
                          <p className="text-sm text-neutral-800 dark:text-neutral-200">Logged in as</p>
                          <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">user@example.com</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">Your Profile</Link>
                          <Link to="/settings" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</Link>
                          <button className="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                            Sign out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
          
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileMenuVariants}
            >
              <div className="space-y-1 px-4 pt-2 pb-3">
                {/* Search bar for mobile */}
                <form onSubmit={handleSearch} className="pb-2">
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full rounded-md border-neutral-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                          className={`text-left flex items-center justify-between w-full rounded-md px-3 py-2 text-base font-medium ${isActiveMenuItem(item) || activeSubmenu === item.id ? 'text-primary-600 dark:text-primary-400 bg-neutral-50 dark:bg-neutral-800' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'}`}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 text-neutral-500 dark:text-neutral-400">
                              {item.icon}
                            </span>
                            {item.label}
                          </div>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 transition-transform ${activeSubmenu === item.id ? 'transform rotate-180' : ''}`} 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <AnimatePresence>
                          {activeSubmenu === item.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-10 space-y-1"
                            >
                              {item.submenu.map((subItem) => (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSubmenuItemClick(subItem.path)}
                                  className={`text-left block w-full rounded-md px-3 py-2 text-sm font-medium ${isActiveSubmenuItem(subItem.path) ? 'text-primary-600 dark:text-primary-400 bg-neutral-50 dark:bg-neutral-800' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'}`}
                                >
                                  {subItem.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <NavLink
                        to={item.path}
                        className={({isActive}) => `flex items-center rounded-md px-3 py-2 text-base font-medium ${isActive ? 'text-primary-600 dark:text-primary-400 bg-neutral-50 dark:bg-neutral-800' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'}`}
                      >
                        <span className="mr-3 text-neutral-500 dark:text-neutral-400">
                          {item.icon}
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
                    className="flex w-full items-center rounded-md px-3 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span className="mr-3 text-neutral-500 dark:text-neutral-400">
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
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>

                {/* User section for mobile */}
                <div className="pt-4 pb-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/30 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                        <span className="font-medium text-primary-600 dark:text-primary-400">JD</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-neutral-800 dark:text-white">User</div>
                      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">user@example.com</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

export default TopNavigation;
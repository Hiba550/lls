import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [activeGroup, setActiveGroup] = useState(null);
  const { darkMode } = useTheme();
  
  // Update active group based on current path
  useEffect(() => {
    if (location.pathname.includes('/assembly')) {
      setActiveGroup('assembly');
    } else if (location.pathname.includes('/inventory')) {
      setActiveGroup('inventory');
    } else if (location.pathname.includes('/work-orders')) {
      setActiveGroup('work-orders');
    } else if (location.pathname.includes('/reports')) {
      setActiveGroup('reports');
    }
  }, [location.pathname]);

  // Toggle submenu groups
  const toggleGroup = (group) => {
    setActiveGroup(activeGroup === group ? null : group);
  };

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
  const sidebarVariants = {
    open: { 
      width: "var(--sidebar-width)", 
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      } 
    },
    collapsed: { 
      width: "var(--sidebar-collapsed-width)", 
      transition: { 
        duration: 0.3,
        ease: "easeIn"
      } 
    }
  };

  const textVariants = {
    show: { 
      opacity: 1, 
      x: 0,
      display: "block",
      transition: { 
        delay: 0.1, 
        duration: 0.15
      } 
    },
    hide: { 
      opacity: 0, 
      x: -10, 
      transitionEnd: { 
        display: "none" 
      },
      transition: { 
        duration: 0.15 
      } 
    }
  };

  const submenuVariants = {
    open: { 
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.25,
          delay: 0.05
        }
      }
    },
    closed: { 
      height: 0,
      opacity: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.15,
        }
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isOpen ? "open" : "collapsed"}
        variants={sidebarVariants}
        className={`fixed top-0 left-0 h-full bg-neutral-800 dark:bg-neutral-900 text-white z-30 transform flex flex-col shadow-lg`}
      >
        {/* Logo and toggle */}
        <div className="flex items-center h-16 px-2 border-b border-neutral-700 dark:border-neutral-800 shrink-0">
          <div className="flex items-center justify-between w-full">
            <motion.div
              variants={textVariants}
              initial="show"
              animate={isOpen ? "show" : "hide"}
              className="flex items-center ml-2 overflow-hidden"
            >
              <span className="text-lg font-semibold text-white truncate">
                Assembly System
              </span>
            </motion.div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin pt-2">
          <ul className="px-1 py-2">
            {menuItems.map((item) => (
              <li key={item.id} className="mb-1">
                {item.hasSubmenu ? (
                  // Item with submenu
                  <div className="relative">
                    {/* Main menu item with dropdown */}
                    <button
                      onClick={() => toggleGroup(item.id)}
                      className={`w-full flex items-center ${isOpen ? 'px-3' : 'px-2 justify-center'} py-2 rounded-md transition-colors ${
                        location.pathname === item.path || activeGroup === item.id
                          ? 'bg-neutral-700 dark:bg-neutral-700 text-white'
                          : 'hover:bg-neutral-700/50 dark:hover:bg-neutral-800 text-neutral-300'
                      }`}
                      aria-expanded={activeGroup === item.id}
                    >
                      <span className="shrink-0 mr-3">{item.icon}</span>
                      
                      {isOpen && (
                        <motion.div
                          variants={textVariants}
                          className="flex-grow flex items-center justify-between"
                        >
                          <span className="truncate">{item.label}</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-4 w-4 transition-transform duration-200 ${activeGroup === item.id ? 'transform rotate-180' : ''}`}
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {isOpen && (
                      <AnimatePresence>
                        {activeGroup === item.id && (
                          <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={submenuVariants}
                            className="overflow-hidden"
                          >
                            <ul className="pl-4 ml-2 my-1 border-l border-neutral-600 dark:border-neutral-700">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.id}>
                                  <NavLink
                                    to={subItem.path}
                                    className={({ isActive }) =>
                                      `flex items-center px-3 py-1.5 text-sm rounded-md my-0.5 ${
                                        isActive
                                          ? 'bg-primary-700 text-white'
                                          : 'text-neutral-300 hover:bg-neutral-700/50 dark:hover:bg-neutral-800 hover:text-white'
                                      }`
                                    }
                                    aria-current={({ isActive }) => isActive ? 'page' : undefined}
                                  >
                                    <span className="truncate">{subItem.label}</span>
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ) : (
                  // Regular item
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center ${isOpen ? 'px-3' : 'px-2 justify-center'} py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-neutral-700 dark:bg-neutral-700 text-white'
                          : 'hover:bg-neutral-700/50 dark:hover:bg-neutral-800 text-neutral-300'
                      }`
                    }
                    aria-current={({ isActive }) => isActive ? 'page' : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {isOpen && (
                      <motion.span
                        variants={textVariants}
                        className="ml-3 truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Status footer */}
        <div className="p-3 border-t border-neutral-700 dark:border-neutral-800 bg-neutral-800 dark:bg-neutral-900 shrink-0">
          {isOpen ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center text-xs text-neutral-400">
                <div className="mr-2 h-2 w-2 rounded-full bg-success-500"></div>
                <span>System Online</span>
              </div>
              <span className="text-xs text-neutral-500">v1.2.0</span>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 rounded-full bg-success-500"></div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
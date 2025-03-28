import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen and close sidebar on mobile by default
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Animation variants
  const mainContentVariants = {
    expanded: { 
      marginLeft: "var(--sidebar-width)",
      transition: { duration: 0.3, ease: "easeOut" }
    },
    collapsed: { 
      marginLeft: "var(--sidebar-collapsed-width)",
      transition: { duration: 0.3, ease: "easeIn" }
    },
    mobile: {
      marginLeft: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <div className={`flex min-h-screen w-full ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar component */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <motion.div 
        initial={false}
        animate={isMobile ? "mobile" : sidebarOpen ? "expanded" : "collapsed"}
        variants={mainContentVariants}
        className="flex flex-col flex-1 w-full bg-neutral-50 dark:bg-neutral-900 transition-colors duration-150"
      >
        {/* Header/Navbar */}
        <Navbar toggleSidebar={toggleSidebar} />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-theme(spacing.16)-theme(spacing.14))]">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </motion.div>
    </div>
  );
};

export default Layout;
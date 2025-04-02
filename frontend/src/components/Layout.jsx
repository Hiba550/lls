import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import TopNavigation from './TopNavigation';

const Layout = () => {
  const { darkMode } = useTheme();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -10
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  };

  return (
    <div 
      className={`flex flex-col min-h-screen w-full ${darkMode ? 'dark' : ''}`}
      style={{
        backgroundImage: darkMode 
          ? 'radial-gradient(circle at 1px 1px, rgb(38, 38, 38) 1px, transparent 0), linear-gradient(to bottom, rgba(13,13,13,0.8) 0%, rgba(0,0,0,0) 100%)' 
          : 'radial-gradient(circle at 1px 1px, rgb(225, 225, 225) 1px, transparent 0), linear-gradient(to bottom, rgba(240,240,240,0.8) 0%, rgba(255,255,255,0) 100%)',
        backgroundSize: '40px 40px, 100% 100%',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Navigation Bar */}
      <TopNavigation />
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="flex flex-col flex-1 w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm transition-colors duration-150"
        >
          {/* Main Content Area - Full width to maximize screen space */}
          <main className="flex-1 w-full overflow-x-hidden">
            <div className="w-full mx-auto px-2 sm:px-3 py-3 sm:py-4 min-h-[calc(100vh-theme(spacing.16)-theme(spacing.14))]">
              <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700">
                <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600"></div>
                <div className="p-2 sm:p-4 lg:p-5">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Layout;
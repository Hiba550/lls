import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import designSystem from '../theme/designSystem';

/**
 * Main Layout component - Performance optimized for industrial applications
 * Provides the core structure for all pages with improved rendering performance
 */
const Layout = () => {
  const { darkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial loading state to prevent layout shift
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Apply dark/light mode to body element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Return loading state to prevent layout shift on initial render
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 border-2 border-blue-300 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-300 rounded-full animate-spin"></div>
          <p className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium">Loading Assembly Management</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-white">
      {/* Top Navigation */}
      <TopNavigation companyName="Assembly Management" />
      
      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer - optimized for print layouts to exclude from printing */}
      <Footer />
    </div>
  );
};

export default Layout;
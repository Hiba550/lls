import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Performance-optimized Footer using React.memo to prevent unnecessary re-renders
const Footer = memo(() => {
  const { darkMode } = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 print:hidden">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          {/* Company and copyright */}
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            <span>&copy; {currentYear} Assembly Management System</span>
          </div>
          
          {/* Center - Status Indicator */}
          <div className="flex items-center space-x-1 text-xs">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-neutral-500 dark:text-neutral-400">System Status: Operational</span>
            </div>
            <span className="text-neutral-300 dark:text-neutral-600">|</span>
            <span className="text-neutral-500 dark:text-neutral-400">Version 1.2.0</span>
          </div>
          
          {/* Right - Quick Links */}
          <div className="flex items-center space-x-4 text-xs">
            <Link to="/help" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
              Help
            </Link>
            <Link to="/support" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
              Support
            </Link>
            <Link to="/settings/legal" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
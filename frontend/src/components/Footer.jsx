import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const companyName = "Assembly Management System";
  const version = "1.2.0";
  
  // Quick links for the footer
  const quickLinks = [
    { label: 'Documentation', path: '/docs' },
    { label: 'Support', path: '/support' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' }
  ];

  return (
    <footer className="bg-gradient-to-r from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 border-t border-neutral-200 dark:border-neutral-700 transition-colors duration-150 ease-in-out">
      <div className="max-w-screen-2xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center">
            <Link to="/" className="flex items-center mb-2 sm:mb-0">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-md flex items-center justify-center text-white font-bold shadow-sm shadow-primary-500/10">
                <span className="text-sm">AM</span>
              </div>
              <span className="ml-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {companyName}
              </span>
            </Link>
            <div className="text-neutral-500 dark:text-neutral-400 text-xs sm:ml-3 mt-1 sm:mt-0 sm:pl-3 sm:border-l border-neutral-200 dark:border-neutral-700">
              &copy; {currentYear} All rights reserved
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center">
            {quickLinks.map((link, index) => (
              <React.Fragment key={link.path}>
                <Link 
                  to={link.path} 
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                >
                  {link.label}
                </Link>
                {index < quickLinks.length - 1 && (
                  <span className="mx-1 text-neutral-300 dark:text-neutral-600 flex items-center">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-full font-mono border border-neutral-200 dark:border-neutral-600">
              v{version}
            </span>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
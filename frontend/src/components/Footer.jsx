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
    <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 transition-colors duration-150 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-2 sm:mb-0 flex flex-col sm:flex-row items-center">
            <div className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center">
              <span>&copy; {currentYear} {companyName}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center mt-2 sm:mt-0">
            {quickLinks.map((link, index) => (
              <React.Fragment key={link.path}>
                <Link 
                  to={link.path} 
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.label}
                </Link>
                {index < quickLinks.length - 1 && (
                  <span className="mx-2 text-neutral-300 dark:text-neutral-600">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="hidden md:flex items-center space-x-4 mt-2 sm:mt-0">
            <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-full">
              Version {version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
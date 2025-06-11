import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  showCloseButton = true,
  position = 'top-right',
  id 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 300); // Wait for animation to complete
  };

  const getNotificationStyles = () => {
    const baseStyles = "flex items-start p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200`;
    }
  };

  const getIcon = () => {
    const iconClass = "h-6 w-6 flex-shrink-0 mt-0.5";
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={`${iconClass} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationDirection = () => {
    if (position.includes('right')) {
      return { x: 400, opacity: 0 };
    } else if (position.includes('left')) {
      return { x: -400, opacity: 0 };
    } else if (position.includes('top')) {
      return { y: -100, opacity: 0 };
    } else {
      return { y: 100, opacity: 0 };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={getAnimationDirection()}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={getAnimationDirection()}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed z-50 max-w-sm w-full ${getPositionStyles()}`}
        >
          <div className={getNotificationStyles()}>
            {getIcon()}
            
            <div className="ml-3 flex-1">
              {title && (
                <h4 className="text-sm font-semibold mb-1">{title}</h4>
              )}
              <p className="text-sm">{message}</p>
            </div>

            {showCloseButton && (
              <button
                onClick={handleClose}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;

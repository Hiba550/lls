import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  className = '',
  loading = false,
  ...rest
}) => {
  const { darkMode } = useTheme();
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: `bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 ${darkMode ? 'dark:bg-primary-700 dark:hover:bg-primary-800' : ''}`,
    secondary: `bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500 ${darkMode ? 'dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200' : ''}`,
    outlined: `bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-primary-500 ${darkMode ? 'dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200' : ''}`,
    success: `bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 ${darkMode ? 'dark:bg-green-600 dark:hover:bg-green-700' : ''}`,
    error: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 ${darkMode ? 'dark:bg-red-600 dark:hover:bg-red-700' : ''}`,
    warning: `bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500 ${darkMode ? 'dark:bg-yellow-600 dark:hover:bg-yellow-700' : ''}`,
    text: `text-primary-600 hover:bg-gray-100 focus:ring-primary-500 ${darkMode ? 'dark:text-primary-400 dark:hover:bg-gray-800' : ''}`
  };
  
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg'
  };
  
  const disabledStyles = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {startIcon && !loading && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outlined', 'success', 'error', 'warning', 'text']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  loading: PropTypes.bool
};

export default Button;
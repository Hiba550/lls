import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  variant = 'default',
  className = '',
  title,
  subtitle,
  action,
  elevation = 'md',
  noPadding = false,
  borderRadius = 'rounded-lg',
  hoverEffect = false,
  onClick,
  ...rest
}) => {
  const elevationStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  };
  
  const variantStyles = {
    default: 'bg-white border border-neutral-200',
    outlined: 'bg-white border border-neutral-300',
    filled: 'bg-neutral-100',
    primary: 'bg-primary-50 border border-primary-200',
    success: 'bg-green-50 border border-green-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    error: 'bg-red-50 border border-red-200',
  };
  
  const paddingStyles = noPadding ? '' : 'p-4';
  const hoverStyles = hoverEffect ? 'transition-all duration-200 hover:shadow-lg hover:translate-y-[-2px]' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${elevationStyles[elevation]} ${variantStyles[variant]} ${paddingStyles} ${borderRadius} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {(title || subtitle || action) && (
        <div className={`flex justify-between items-start ${children ? 'mb-3' : ''}`}>
          <div>
            {title && <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outlined', 'filled', 'primary', 'success', 'warning', 'error']),
  className: PropTypes.string,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  action: PropTypes.node,
  elevation: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  noPadding: PropTypes.bool,
  borderRadius: PropTypes.string,
  hoverEffect: PropTypes.bool,
  onClick: PropTypes.func
};

export default Card;
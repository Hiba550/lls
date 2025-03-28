import React from 'react';
import PropTypes from 'prop-types';

const SkeletonLoader = ({ 
  type, 
  count = 1, 
  className = '',
  animation = 'pulse', 
  withShimmer = false 
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden';
  
  const types = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-md',
    card: 'h-32 w-full',
    thumbnail: 'h-16 w-16 rounded-md',
    table: 'h-4 w-full grid grid-cols-4 gap-2',
    circle: 'h-8 w-8 rounded-full',
    // Add assembly-specific skeletons
    sensor: 'h-6 w-6 rounded',
    component: 'h-12 w-full rounded-sm'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    none: ''
  };

  const renderSkeleton = () => {
    const elements = [];
    
    for (let i = 0; i < count; i++) {
      elements.push(
        <div 
          key={i}
          className={`
            ${baseStyles} 
            ${types[type]} 
            ${animationClasses[animation]} 
            ${className} 
            ${i < count - 1 ? 'mb-2' : ''}
          `}
          aria-hidden="true"
          role="presentation"
        >
          {withShimmer && (
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
      );
    }
    
    return elements;
  };
  
  return <>{renderSkeleton()}</>;
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf([
    'text', 'title', 'avatar', 'button', 'card', 'thumbnail', 
    'table', 'circle', 'sensor', 'component'
  ]).isRequired,
  count: PropTypes.number,
  className: PropTypes.string,
  animation: PropTypes.oneOf(['pulse', 'none']),
  withShimmer: PropTypes.bool
};

export default SkeletonLoader;
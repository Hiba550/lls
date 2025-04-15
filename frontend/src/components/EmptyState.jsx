import React from 'react';
import PropTypes from 'prop-types';

const EmptyState = ({ title, description, icon, action }) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="flex justify-center mb-4">
        {icon || (
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node
};

export default EmptyState;
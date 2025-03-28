import React from 'react';
import PropTypes from 'prop-types';
import Card from '../common/Card';

const AssemblyStepCard = ({
  stepNumber,
  title,
  description,
  isActive,
  isCompleted,
  onSelect
}) => {
  let statusIcon;
  
  if (isCompleted) {
    statusIcon = (
      <div className="rounded-full bg-green-500 h-8 w-8 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
  } else {
    statusIcon = (
      <div className={`rounded-full h-8 w-8 flex items-center justify-center ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
        {stepNumber}
      </div>
    );
  }

  return (
    <Card
      variant={isActive ? 'primary' : 'default'}
      className={`mb-3 transition-all duration-200 ${isActive ? 'border-l-4 border-l-blue-500' : ''}`}
      hoverEffect={!isCompleted && !isActive}
      onClick={() => !isCompleted && onSelect()}
    >
      <div className="flex items-center">
        {statusIcon}
        <div className="ml-4">
          <h4 className={`font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Card>
  );
};

AssemblyStepCard.propTypes = {
  stepNumber: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  isActive: PropTypes.bool,
  isCompleted: PropTypes.bool,
  onSelect: PropTypes.func
};

export default AssemblyStepCard;
import React from 'react';
import PropTypes from 'prop-types';

const AssemblyProgress = ({ steps, currentStep }) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.completed).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-1 items-center">
        <div>
          <span className="text-lg font-medium text-gray-700">Assembly Progress</span>
        </div>
        <div className="text-xl font-bold text-blue-600">
          {Math.round(progress)}%
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="mt-4 flex justify-between">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
            style={{ width: `${100 / totalSteps}%` }}
          >
            <div 
              className={`w-4 h-4 rounded-full mb-1 ${
                index < currentStep ? 'bg-blue-500' : 
                index === currentStep ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-xs text-center">{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

AssemblyProgress.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired
  })).isRequired,
  currentStep: PropTypes.number.isRequired
};

export default AssemblyProgress;
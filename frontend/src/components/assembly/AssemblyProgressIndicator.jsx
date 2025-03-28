import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const AssemblyProgressIndicator = ({ steps, currentStepIndex }) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter((step, index) => index < currentStepIndex).length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">Assembly Progress</h3>
        <motion.span 
          className="text-2xl font-bold text-blue-600"
          key={progressPercentage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {Math.round(progressPercentage)}%
        </motion.span>
      </div>
      
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progressPercentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      <div className="mt-6 flex justify-between">
        {steps.map((step, index) => {
          const status = index < currentStepIndex 
            ? 'completed' 
            : index === currentStepIndex 
              ? 'current' 
              : 'upcoming';
            
          return (
            <div 
              key={index}
              className="flex flex-col items-center relative"
              style={{ width: `${100 / steps.length}%` }}
            >
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  status === 'completed' 
                    ? 'bg-blue-500 text-white' 
                    : status === 'current' 
                      ? 'bg-blue-500 text-white border-2 border-blue-300 ring-2 ring-blue-200' 
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {status === 'completed' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              
              <span 
                className={`mt-2 text-xs text-center transition-colors line-clamp-2 ${
                  status === 'upcoming' ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {step.name}
              </span>
              
              {/* Connector lines between steps */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute top-3 left-1/2 h-0.5 w-full ${
                    index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

AssemblyProgressIndicator.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  currentStepIndex: PropTypes.number.isRequired
};

export default AssemblyProgressIndicator;
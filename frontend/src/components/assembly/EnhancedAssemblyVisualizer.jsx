import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const EnhancedAssemblyVisualizer = ({
  assemblyType,
  itemCode,
  components = [],
  sensors = [],
  currentStep,
  completedSteps = [],
  onComponentClick,
  onSensorClick,
}) => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    if (components.length > 0) {
      const progress = (completedSteps.length / components.length) * 100;
      setAssemblyProgress(progress);
    }
  }, [components, completedSteps]);
  
  const handleComponentClick = (component) => {
    setSelectedComponent(component);
    if (onComponentClick) {
      onComponentClick(component);
    }
  };
  
  const getComponentStatus = (component) => {
    if (completedSteps.includes(component.id)) {
      return 'completed';
    }
    if (currentStep === component.id) {
      return 'current';
    }
    return 'pending';
  };
  
  const componentClasses = {
    completed: 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    current: 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 animate-pulse',
    pending: `border-gray-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
  };
  
  const sensorClasses = {
    completed: 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    current: 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 animate-pulse',
    pending: `border-gray-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
  };
  
  return (
    <div className={`relative p-6 rounded-xl shadow-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      {/* Header & Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">{assemblyType} Assembly - {itemCode}</h2>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(assemblyProgress)}%
          </div>
        </div>
        
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${assemblyProgress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 ${componentClasses.pending.split(' ')[0]} ${componentClasses.pending.split(' ')[1]}`} />
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 ${componentClasses.current.split(' ')[0]} ${componentClasses.current.split(' ')[1]} animate-pulse`} />
          <span className="text-sm">Current</span>
        </div>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-2 ${componentClasses.completed.split(' ')[0]} ${componentClasses.completed.split(' ')[1]}`} />
          <span className="text-sm">Completed</span>
        </div>
      </div>
      
      {/* Main Assembly Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {components.map((component) => {
          const status = getComponentStatus(component);
          return (
            <motion.div
              key={component.id}
              className={`relative p-4 rounded-lg shadow-sm border ${componentClasses[status]}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleComponentClick(component)}
            >
              <h3 className="text-lg font-medium mb-1">{component.name}</h3>
              <p className="text-sm opacity-80">{component.description || 'No description'}</p>
              
              {status === 'completed' && (
                <svg className="absolute top-2 right-2 h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              
              {status === 'current' && (
                <svg className="absolute top-2 right-2 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Sensors Grid */}
      {sensors.length > 0 && (
        <div className="p-4 border rounded-lg dark:border-gray-700">
          <h3 className="text-lg font-medium mb-3">Sensors</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {sensors.map((sensor) => {
              const status = completedSteps.includes(sensor.id) ? 'completed' : 
                             currentStep === sensor.id ? 'current' : 'pending';
              return (
                <motion.button
                  key={sensor.id}
                  className={`aspect-square rounded-md flex items-center justify-center text-sm font-medium border ${sensorClasses[status]}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSensorClick && onSensorClick(sensor)}
                >
                  {sensor.position}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Component Detail View */}
      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`rounded-lg shadow-lg max-w-md w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-6`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedComponent.name}</h3>
                <button 
                  className={`p-1 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setSelectedComponent(null)}
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium opacity-80">ID</p>
                  <p>{selectedComponent.id}</p>
                </div>
                
                {selectedComponent.description && (
                  <div>
                    <p className="text-sm font-medium opacity-80">Description</p>
                    <p>{selectedComponent.description}</p>
                  </div>
                )}
                
                {selectedComponent.barcode && (
                  <div>
                    <p className="text-sm font-medium opacity-80">Barcode</p>
                    <p className="font-mono">{selectedComponent.barcode}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium opacity-80">Status</p>
                  <p className={
                    completedSteps.includes(selectedComponent.id) ? 'text-green-500 dark:text-green-400' : 
                    currentStep === selectedComponent.id ? 'text-blue-500 dark:text-blue-400' : 
                    'text-gray-500 dark:text-gray-400'
                  }>
                    {completedSteps.includes(selectedComponent.id) ? 'Completed' : 
                     currentStep === selectedComponent.id ? 'Current Step' : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  onClick={() => setSelectedComponent(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

EnhancedAssemblyVisualizer.propTypes = {
  assemblyType: PropTypes.string.isRequired,
  itemCode: PropTypes.string.isRequired,
  components: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      barcode: PropTypes.string
    })
  ),
  sensors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ),
  currentStep: PropTypes.string,
  completedSteps: PropTypes.arrayOf(PropTypes.string),
  onComponentClick: PropTypes.func,
  onSensorClick: PropTypes.func
};

export default EnhancedAssemblyVisualizer;
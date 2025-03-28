import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const AssemblyVisualizer = ({
  assemblyType, // 'YSB' or 'RSM'
  itemCode,
  components,
  sensors,
  onComponentClick,
  onSensorClick,
  currentStep,
  scannedItems = []
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Component type styling
  const typeStyles = {
    'leftPcb': 'bg-red-400 hover:bg-red-500',
    'masterPcb': 'bg-green-400 hover:bg-green-500',
    'rightPcb': 'bg-blue-400 hover:bg-blue-500',
    'boardToBoard': 'bg-amber-700 hover:bg-amber-800 text-white',
    'powerCable': 'bg-yellow-700 hover:bg-yellow-800 text-white',
    'sensor': 'bg-gray-200 hover:bg-gray-300'
  };
  
  // Status-based styling
  const getItemStyles = (item) => {
    const baseStyle = typeStyles[item.type] || '';
    const isScanned = scannedItems.includes(item.id);
    const isActive = currentStep === item.id;
    
    if (isScanned) {
      return `${baseStyle} border-2 border-green-600 ring-2 ring-green-400`;
    } else if (isActive) {
      return `${baseStyle} border-2 border-blue-600 ring-2 ring-blue-400 animate-pulse`;
    }
    
    return baseStyle;
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {assemblyType} Assembly - {itemCode}
      </h2>
      
      <div className="flex flex-wrap justify-center mb-6">
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-gray-200 mr-2"></div>
          <span className="text-sm text-gray-600">Not Scanned</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-4 h-4 bg-blue-400 mr-2 animate-pulse"></div>
          <span className="text-sm text-gray-600">Active Step</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-400 mr-2"></div>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4 mb-6">
        {/* Left column: Component labels */}
        <div className="space-y-4">
          <div className="text-right font-medium text-gray-700">PCB Board</div>
          <div className="text-right font-medium text-gray-700">Joining Cable</div>
          <div className="text-right font-medium text-gray-700">P&C Cable</div>
        </div>
        
        {/* Right column: Components visualization */}
        <div className="space-y-4">
          {/* PCB boards */}
          <div className="grid grid-cols-3 gap-2">
            {components
              .filter(c => ['leftPcb', 'masterPcb', 'rightPcb'].includes(c.type))
              .map(component => (
                <motion.div
                  key={component.id}
                  className={`rounded p-2 text-center text-sm cursor-pointer transition-all ${getItemStyles(component)}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredItem(component)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => onComponentClick(component)}
                >
                  {component.name}
                </motion.div>
              ))}
          </div>
          
          {/* Board-to-board connections */}
          <div className="grid grid-cols-3 gap-2">
            <div className="invisible"></div>
            {components
              .filter(c => c.type === 'boardToBoard')
              .map(component => (
                <motion.div
                  key={component.id}
                  className={`rounded p-2 text-center text-sm cursor-pointer transition-all ${getItemStyles(component)}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredItem(component)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => onComponentClick(component)}
                >
                  {component.name}
                </motion.div>
              ))}
          </div>
          
          {/* Power & Communication Cable */}
          <div className="col-span-3">
            {components
              .filter(c => c.type === 'powerCable')
              .map(component => (
                <motion.div
                  key={component.id}
                  className={`rounded p-2 text-center cursor-pointer transition-all ${getItemStyles(component)}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredItem(component)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => onComponentClick(component)}
                >
                  {component.name}
                </motion.div>
              ))}
          </div>
        </div>
      </div>
      
      {/* Sensors grid */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium mb-3 text-center">Magnetic Coil Sensors</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          {sensors.map(sensor => (
            <motion.div
              key={sensor.id}
              className={`aspect-square rounded flex items-center justify-center cursor-pointer transition-all text-sm font-medium ${
                getItemStyles({ ...sensor, type: 'sensor' })
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredItem(sensor)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => onSensorClick(sensor)}
            >
              {sensor.position}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredItem && (
        <div className="absolute bg-gray-800 text-white p-2 rounded text-sm z-10 shadow-lg">
          <div className="font-medium">{hoveredItem.name}</div>
          {hoveredItem.barcode && <div>Barcode: {hoveredItem.barcode}</div>}
        </div>
      )}
    </div>
  );
};

AssemblyVisualizer.propTypes = {
  assemblyType: PropTypes.oneOf(['YSB', 'RSM']).isRequired,
  itemCode: PropTypes.string.isRequired,
  components: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      barcode: PropTypes.string
    })
  ).isRequired,
  sensors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
      barcode: PropTypes.string,
      name: PropTypes.string
    })
  ).isRequired,
  onComponentClick: PropTypes.func,
  onSensorClick: PropTypes.func,
  currentStep: PropTypes.string,
  scannedItems: PropTypes.arrayOf(PropTypes.string)
};

export default AssemblyVisualizer;
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card from '../common/Card';

const AssemblyCard = ({
  title,
  description,
  type, // 'YSB' or 'RSM'
  itemCode,
  thumbnailSrc,
  status = 'not-started', // 'not-started', 'in-progress', 'completed'
  progress = 0,
  to
}) => {
  const statusColors = {
    'not-started': {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300'
    },
    'in-progress': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300'
    },
    'completed': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300'
    }
  };
  
  const typeStyles = {
    'YSB': {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700'
    },
    'RSM': {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700'
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg"
      noPadding
    >
      <div className={`${typeStyles[type].bg} px-4 py-3`}>
        <h2 className="text-white text-lg font-semibold flex items-center justify-between">
          {title}
          {itemCode && (
            <span className="text-sm bg-white/20 rounded px-2 py-1">{itemCode}</span>
          )}
        </h2>
      </div>
      
      <div className="p-4">
        {thumbnailSrc && (
          <div className="mb-3 rounded overflow-hidden border border-gray-200">
            <img 
              src={thumbnailSrc} 
              alt={`${title} visualization`} 
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>
        
        {status !== 'not-started' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${statusColors[status].bg} ${statusColors[status].text} ${statusColors[status].border} border`}>
          {status === 'not-started' && 'Not Started'}
          {status === 'in-progress' && 'In Progress'}
          {status === 'completed' && 'Completed'}
        </div>
        
        <Link
          to={to}
          className={`block w-full text-center ${typeStyles[type].bg} ${typeStyles[type].hover} text-white font-medium py-2 px-4 rounded transition-colors`}
        >
          {status === 'in-progress' ? 'Continue Assembly' : 'Start Assembly'}
        </Link>
      </div>
    </Card>
  );
};

AssemblyCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['YSB', 'RSM']).isRequired,
  itemCode: PropTypes.string,
  thumbnailSrc: PropTypes.string,
  status: PropTypes.oneOf(['not-started', 'in-progress', 'completed']),
  progress: PropTypes.number,
  to: PropTypes.string.isRequired
};

export default AssemblyCard;
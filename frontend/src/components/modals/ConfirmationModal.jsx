import React from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  inputValue,
  inputPlaceholder,
  onInputChange,
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{title || 'Confirmation'}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {inputValue !== undefined && onInputChange && (
          <div className="mb-4">
            <textarea
              value={inputValue}
              onChange={onInputChange}
              placeholder={inputPlaceholder || ""}
              className="w-full p-2 border border-gray-300 rounded mt-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
        )}
        
        {children}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
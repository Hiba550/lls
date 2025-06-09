import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { createReworkOrderEnhanced, createAuditLog } from '../utils/assemblyUtils';

const EnhancedReworkModal = ({ 
  isOpen, 
  onClose, 
  orderToRework, 
  onReworkCreated 
}) => {
  const [reworkComponents, setReworkComponents] = useState([]);
  const [reworkNotes, setReworkNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComponentToggle = (component, checked) => {
    setReworkComponents(prev => {
      if (checked) {
        return [...prev, component];
      } else {
        return prev.filter(c => c.barcode !== component.barcode);
      }
    });
  };

  const handleCreateRework = async () => {
    if (!reworkNotes.trim()) {
      toast.error('Please provide rework notes');
      return;
    }

    try {
      setLoading(true);
      
      const result = await createReworkOrderEnhanced(
        orderToRework, 
        reworkComponents, 
        reworkNotes
      );
      
      if (result.success) {
        toast.success(result.message);
        
        // Call parent callback with rework order data
        if (onReworkCreated) {
          onReworkCreated(result.reworkOrder);
        }
        
        // Reset form and close modal
        setReworkComponents([]);
        setReworkNotes('');
        onClose();
        
        // Reload page after delay to refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating rework order:', error);
      toast.error(`Failed to create rework order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !orderToRework) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal content */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create Enhanced Rework Order
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Assembly Info */}
            <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Assembly Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Product:</span>
                  <p className="text-blue-600">{orderToRework.product}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Item Code:</span>
                  <p className="text-blue-600">{orderToRework.item_code}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Work Order Barcode:</span>
                  <p className="text-blue-600 font-mono">
                    {orderToRework.workOrderBarcodeNumber || orderToRework.barcodeNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Assembly Barcode:</span>
                  <p className="text-blue-600 font-mono">
                    {orderToRework.assemblyBarcodeNumber || orderToRework.serial_number || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Component Selection */}
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-3 text-gray-800">
                Select Components for Rework
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Leave empty for full assembly rework)
                </span>
              </h4>
              
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {orderToRework.scannedComponents && orderToRework.scannedComponents.length > 0 ? (
                  orderToRework.scannedComponents.map((component, idx) => (
                    <div key={idx} className="flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <input
                          id={`component-${idx}`}
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          onChange={(e) => handleComponentToggle(component, e.target.checked)}
                        />
                        <label htmlFor={`component-${idx}`} className="ml-3 block text-sm">
                          <div className="font-medium text-gray-900">
                            {component.componentName || component.barcode}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Barcode: {component.barcode} | Scanned: {new Date(component.scanTime).toLocaleString()}
                          </div>
                        </label>
                      </div>
                      
                      {component.replaced && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Previously Replaced
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-gray-500 italic">
                    No detailed component information available.
                    <br />
                    General full assembly rework will be created.
                  </div>
                )}
              </div>
              
              {reworkComponents.length > 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                  <span className="font-medium text-amber-800">
                    Selected components ({reworkComponents.length}):
                  </span>
                  <div className="mt-1">
                    {reworkComponents.map((comp, idx) => (
                      <span key={idx} className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                        {comp.componentName || comp.barcode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rework Notes */}
            <div className="mb-6">
              <label htmlFor="rework-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Rework Notes *
              </label>
              <textarea
                id="rework-notes"
                rows="4"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Describe the quality issues and rework requirements..."
                value={reworkNotes}
                onChange={(e) => setReworkNotes(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Please provide detailed notes about the quality issues and what needs to be reworked.
              </p>
            </div>

            {/* Rework Summary */}
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h5 className="text-sm font-medium text-gray-800 mb-2">Rework Summary</h5>
              <div className="text-sm text-gray-600">
                <p><strong>Type:</strong> {reworkComponents.length > 0 ? 'Component Replacement' : 'Full Assembly Rework'}</p>
                <p><strong>Components:</strong> {reworkComponents.length > 0 ? `${reworkComponents.length} selected` : 'All components'}</p>
                <p><strong>Priority:</strong> <span className="text-red-600 font-medium">HIGH</span></p>
                <p><strong>Estimated Time:</strong> 30-45 minutes</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRework}
                disabled={loading || !reworkNotes.trim()}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Rework Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReworkModal;

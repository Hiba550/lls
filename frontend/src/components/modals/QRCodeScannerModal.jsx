import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const QRCodeScannerModal = ({ isOpen, onClose, onScan }) => {
  const [scanError, setScanError] = useState(null);

  if (!isOpen) return null;

  const handleScan = (data) => {
    if (data) {
      onScan(data?.text || data);
      onClose();
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setScanError('Failed to access camera. Please check your camera permissions.');
  };

  // For testing without a camera
  const handleManualInput = (e) => {
    e.preventDefault();
    const manualInput = e.target.elements.manualInput.value;
    if (manualInput) {
      onScan(manualInput);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Scan QR Code</h2>
        
        {scanError ? (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {scanError}
          </div>
        ) : (
          <div className="mb-4">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              onError={handleError}
              className="w-full"
              scanDelay={300}
            />
          </div>
        )}
        
        <div className="my-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm text-gray-500">OR</span>
          </div>
        </div>
        
        <form onSubmit={handleManualInput} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              name="manualInput"
              placeholder="Enter code manually"
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;
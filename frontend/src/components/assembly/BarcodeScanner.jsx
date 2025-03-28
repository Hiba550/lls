import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const BarcodeScanner = ({ 
  onScan, 
  placeholder = 'Scan barcode here...', 
  buttonText = 'Verify',
  expectedBarcode = '',
  disabled = false
}) => {
  const [barcode, setBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState(null); // null, 'success', 'error'
  const inputRef = useRef(null);
  
  // Focus input on mount and when disabled changes
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  // Auto-verify when input matches expected length
  useEffect(() => {
    if (expectedBarcode && barcode.length === expectedBarcode.length && !disabled) {
      handleVerify();
    }
  }, [barcode, expectedBarcode, disabled]);
  
  const handleVerify = () => {
    if (!barcode.trim() || disabled) return;
    
    // Check if barcode is expected or call onScan for external validation
    if (expectedBarcode) {
      const isValid = barcode.trim() === expectedBarcode;
      setScanStatus(isValid ? 'success' : 'error');
      onScan(barcode, isValid);
      
      // Auto-reset status after a delay
      setTimeout(() => setScanStatus(null), 2000);
      
      if (isValid) {
        setBarcode('');
      }
    } else {
      onScan(barcode);
      setBarcode('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className="w-full">
      <div className={`
        flex items-center border rounded-md overflow-hidden transition-all
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${scanStatus === 'success' ? 'border-green-500 ring-2 ring-green-200' : ''}
        ${scanStatus === 'error' ? 'border-red-500 ring-2 ring-red-200' : ''}
        ${!scanStatus ? 'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200' : ''}
      `}
      >
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-grow px-4 py-2 focus:outline-none
            ${scanStatus === 'success' ? 'bg-green-50' : ''}
            ${scanStatus === 'error' ? 'bg-red-50' : ''}
          `}
          autoComplete="off"
          autoFocus
        />
        <button
          onClick={handleVerify}
          disabled={disabled || !barcode.trim()}
          className={`
            px-4 py-2 font-medium text-white transition-colors whitespace-nowrap
            ${disabled || !barcode.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
            ${scanStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
            ${scanStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
          `}
        >
          {scanStatus === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {scanStatus === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {buttonText}
        </button>
      </div>
      
      {scanStatus === 'error' && expectedBarcode && (
        <p className="text-red-500 text-sm mt-1">
          Expected barcode: {expectedBarcode}
        </p>
      )}
    </div>
  );
};

BarcodeScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  buttonText: PropTypes.string,
  expectedBarcode: PropTypes.string,
  disabled: PropTypes.bool
};

export default BarcodeScanner;z
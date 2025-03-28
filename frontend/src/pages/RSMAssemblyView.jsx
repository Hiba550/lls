import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import WorkOrderAuth from '../components/common/WorkOrderAuth';

const RSMAssemblyView = ({ workOrder }) => {
  const { itemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get assembly ID from URL query parameters if available
  const queryParams = new URLSearchParams(location.search);
  const assemblyId = queryParams.get('id');
  const workOrderId = queryParams.get('workOrderId');
  
  useEffect(() => {
    // Fix for direct iframe approach
    const container = document.getElementById('rsm-assembly-iframe-container');
    if (!container) return;
    
    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.overflow = 'auto';
    
    // Set the source URL with appropriate path and parameters
    // Use the public path for the HTML file
    iframe.src = `/src/pages/RSM/${itemCode}.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}`;
    
    // Add load and error handlers
    iframe.onload = () => {
      console.log('RSM assembly iframe loaded successfully');
      setIsLoading(false);
    };
    
    iframe.onerror = (e) => {
      console.error('Failed to load RSM assembly iframe', e);
      setError(`Failed to load assembly page for ${itemCode}`);
      setIsLoading(false);
    };
    
    // Clear the container and append the iframe
    container.innerHTML = '';
    container.appendChild(iframe);
    
    return () => {
      if (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [itemCode, assemblyId, workOrderId]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-red-600 text-xl font-bold mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/assembly/rsm')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Return to RSM Assembly List
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-full w-full">
      {workOrder && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-sm">
          <div className="container mx-auto">
            <span className="font-semibold">Work Order:</span> #{workOrder.id} - 
            <span className="font-semibold ml-2">Product:</span> {workOrder.product} - 
            <span className="font-semibold ml-2">Item Code:</span> {workOrder.pcb_item_code || workOrder.item_code}
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading RSM Assembly Interface...</p>
          </div>
        </div>
      )}
      <div id="rsm-assembly-iframe-container" className="h-full w-full"></div>
    </div>
  );
};

// Wrap the component with WorkOrderAuth
const RSMAssemblyViewWithAuth = () => {
  const { itemCode } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');

  return (
    <WorkOrderAuth
      workOrderId={workOrderId}
      pcbType="RSM"
      pcbItemCode={itemCode}
      redirectPath="/assembly/rsm"
    >
      <RSMAssemblyView />
    </WorkOrderAuth>
  );
};

export default RSMAssemblyViewWithAuth;
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import WorkOrderAuth from '../../components/common/WorkOrderAuth';

const YSBAssemblyView = ({ workOrder }) => {
  const { itemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the assembly ID from query parameters
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');
  const assemblyId = searchParams.get('id');
  
  useEffect(() => {
    // Validate that we have an item code
    if (!itemCode) {
      setError('No item code provided');
      setLoading(false);
      return;
    }
    
    // Create and append iframe with the appropriate HTML file
    const container = document.getElementById('ysb-assembly-container');
    if (!container) {
      setError('Assembly container not found');
      setLoading(false);
      return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100vh - 4rem)';
    iframe.style.border = 'none';
    iframe.src = `/src/pages/YSB/${itemCode}.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}`;
    
    iframe.onload = () => {
      setLoading(false);
    };
    
    iframe.onerror = () => {
      setError(`Failed to load assembly page for ${itemCode}`);
      setLoading(false);
    };
    
    container.appendChild(iframe);
    
    // Handle messages from the iframe
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'YBS_ASSEMBLY_LOADED') {
        setLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [itemCode, assemblyId, workOrderId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading assembly for {itemCode}...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/assembly/ysb')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return to Assembly Manager
        </button>
      </div>
    );
  }
  
  return (
    <div id="ysb-assembly-container" className="w-full h-full">
      {workOrder && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-sm">
          <div className="container mx-auto">
            <span className="font-semibold">Work Order:</span> #{workOrder.id} - 
            <span className="font-semibold ml-2">Product:</span> {workOrder.product} - 
            <span className="font-semibold ml-2">Item Code:</span> {workOrder.pcb_item_code || workOrder.item_code}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap the component with WorkOrderAuth
const YSBAssemblyViewWithAuth = () => {
  const { itemCode } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');

  return (
    <WorkOrderAuth
      workOrderId={workOrderId}
      pcbType="YSB"
      pcbItemCode={itemCode}
      redirectPath="/assembly/ysb"
    >
      <YSBAssemblyView />
    </WorkOrderAuth>
  );
};

export default YSBAssemblyViewWithAuth;
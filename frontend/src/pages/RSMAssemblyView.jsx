import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import WorkOrderAuth from '../components/common/WorkOrderAuth';

const RSMAssemblyView = ({ workOrder }) => {
  const { itemCode: rawItemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  
  // Normalize the item code by removing any "RSM-" prefix
  const itemCode = rawItemCode ? rawItemCode.replace(/^RSM-/, '') : '';
  
  // Get assembly ID from URL query parameters if available
  const queryParams = new URLSearchParams(location.search);
  const assemblyId = queryParams.get('assemblyId') || queryParams.get('id');
  const workOrderId = queryParams.get('workOrderId');
  
  // Handle messages from the iframe for navigation
  useEffect(() => {
    // Event listener for messages from the iframe
    const handleIframeMessage = (event) => {
      // Make sure the message is from our iframe
      if (!event.data || typeof event.data !== 'object') return;
      
      // Handle navigation requests from the iframe
      if (event.data.type === 'navigation') {
        if (event.data.action === 'return_to_dashboard') {
          // Navigate to dashboard
          navigate('/');
        } else if (event.data.action === 'return_to_assembly') {
          // Navigate to assembly list
          navigate('/assembly/rsm');
        }
      }
    };

    // Add the event listener
    window.addEventListener('message', handleIframeMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [navigate]);
  
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
    iframeRef.current = iframe;    // First, try to load the specific item code HTML file
    // Use the normalized item code
    const specificUrl = `/src/pages/RSM/${itemCode}.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}`;
    const defaultUrl = `/src/pages/RSM/default.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}&itemCode=${itemCode}`;
    
    // Set the source URL with appropriate path and parameters
    iframe.src = specificUrl;
    
    console.log('RSMAssemblyView loading:', {
      itemCode,
      assemblyId,
      workOrderId,
      specificUrl,
      defaultUrl
    });
    
    // Add load and error handlers
    iframe.onload = () => {
      console.log('RSM assembly iframe loaded successfully');
      setIsLoading(false);
      
      // Inject communication script into iframe to handle navigation
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        const script = iframeDocument.createElement('script');
        script.textContent = `
          // Handle all anchor clicks in the iframe
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target) {
              const href = target.getAttribute('href');
              
              // Check if this is a return link
              if (href === '/' || href === '/dashboard' || href.includes('dashboard')) {
                e.preventDefault();
                window.parent.postMessage({
                  type: 'navigation',
                  action: 'return_to_dashboard'
                }, '*');
              }
              
              // Check if this is a return to assembly link
              else if (href === '/assembly' || href === '/assembly/rsm' || href.includes('/assembly/')) {
                e.preventDefault();
                window.parent.postMessage({
                  type: 'navigation',
                  action: 'return_to_assembly'
                }, '*');
              }
            }
          });
          
          // Handle any form submissions that might navigate
          document.addEventListener('submit', function(e) {
            const form = e.target;
            const action = form.getAttribute('action');
            
            if (action && (action === '/' || action.includes('dashboard') || action.includes('/assembly/'))) {
              e.preventDefault();
              window.parent.postMessage({
                type: 'navigation',
                action: action.includes('dashboard') ? 'return_to_dashboard' : 'return_to_assembly'
              }, '*');
            }
          });
        `;
        iframeDocument.body.appendChild(script);
      } catch (error) {
        console.error("Could not inject navigation handler into iframe:", error);
      }
    };
    
    iframe.onerror = () => {
      console.log(`Specific HTML file not found for ${itemCode}, falling back to default template`);
      // If specific HTML file doesn't exist, fall back to the default template
      iframe.src = defaultUrl;
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
  
  // Add a handler for manual return to provide an escape from potential iframe issues
  const handleManualReturn = () => {
    navigate('/assembly/rsm');
  };
  
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
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <span className="font-semibold">Work Order:</span> #{workOrder.id} - 
              <span className="font-semibold ml-2">Product:</span> {workOrder.product} - 
              <span className="font-semibold ml-2">Item Code:</span> {workOrder.pcb_item_code || workOrder.item_code}
            </div>
            {/* Add a reliable return button outside the iframe context */}
            <button
              onClick={handleManualReturn}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Return to Assembly List
            </button>
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
  const { itemCode: rawItemCode } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');
  
  // Normalize the item code by removing any "RSM-" prefix
  const itemCode = rawItemCode ? rawItemCode.replace(/^RSM-/, '') : '';
  return (
    <WorkOrderAuth
      workOrderId={workOrderId}
      pcbType="RSM"
      redirectPath="/assembly/rsm"
    >
      <RSMAssemblyView />
    </WorkOrderAuth>
  );
};

export default RSMAssemblyViewWithAuth;
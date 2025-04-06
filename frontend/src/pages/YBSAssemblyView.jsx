import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import WorkOrderAuth from '../components/common/WorkOrderAuth';

const YSBAssemblyView = ({ workOrder }) => {
  const { itemCode: rawItemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState('calc(100vh - 140px)');
  const iframeRef = useRef(null);
  
  // Normalize the item code by removing any "YBS-" prefix
  const itemCode = rawItemCode ? rawItemCode.replace(/^YBS-/, '') : '';
  
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
          navigate('/assembly/ybs');
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
  
  // Adjust iframe height based on window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      // Adjust height based on header/footer presence
      const headerHeight = workOrder ? 84 : 44; // Estimated heights
      setIframeHeight(`calc(100vh - ${headerHeight}px)`);
    };
    
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [workOrder]);
  
  // Add a handler for manual return to provide an escape from potential iframe issues
  const handleManualReturn = () => {
    navigate('/assembly/ybs');
  };
  
  useEffect(() => {
    // Fix for direct iframe approach with performance optimizations
    const container = document.getElementById('ybs-assembly-iframe-container');
    if (!container) return;
    
    // Create iframe element - optimized for performance
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('loading', 'eager'); // Priority loading
    iframe.title = 'YBS Assembly Interface';
    iframeRef.current = iframe;
    
    // First, try to load the specific item code HTML file
    // Use the normalized item code
    const specificUrl = `/src/pages/YBS/${itemCode}.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}`;
    const defaultUrl = `/src/pages/YBS/default.html?id=${assemblyId || ''}&workOrderId=${workOrderId || ''}&itemCode=${itemCode}`;
    
    // Set the source URL with appropriate path and parameters
    iframe.src = specificUrl;
    
    // Add load and error handlers
    iframe.onload = () => {
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
              else if (href === '/assembly' || href === '/assembly/ybs' || href.includes('/assembly/')) {
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
          
          // Add a global function the iframe can call directly
          window.returnToParentApp = function(target) {
            window.parent.postMessage({
              type: 'navigation',
              action: target === 'dashboard' ? 'return_to_dashboard' : 'return_to_assembly'
            }, '*');
          };
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
    
    // Optimize by only making DOM changes once
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
      <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-100 dark:bg-neutral-800 p-4">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-md shadow-sm border border-neutral-200 dark:border-neutral-700 max-w-md w-full">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold">Error Loading Assembly View</h2>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300 mb-5">{error}</p>
          <button
            onClick={() => navigate('/assembly/ybs')}
            className="w-full bg-neutral-700 hover:bg-neutral-800 dark:bg-neutral-600 dark:hover:bg-neutral-700 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            Return to YBS Assembly List
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900">
      {workOrder && (
        <div className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-x-6">
              <div className="flex items-center">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Work Order:</span>
                <span className="ml-2 font-semibold text-neutral-800 dark:text-neutral-200">#{workOrder.id}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Product:</span>
                <span className="ml-2 font-semibold text-neutral-800 dark:text-neutral-200">{workOrder.product}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-neutral-500 dark:text-neutral-400">Item Code:</span>
                <span className="ml-2 font-semibold text-neutral-800 dark:text-neutral-200">{workOrder.pcb_item_code || workOrder.item_code}</span>
              </div>
            </div>
            
            {/* Add a reliable return button outside the iframe context */}
            <button
              onClick={handleManualReturn}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-neutral-800"
            >
              Return to Assembly List
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-white dark:bg-neutral-900 bg-opacity-80 dark:bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-sm font-medium">Loading Assembly Interface</p>
          </div>
        </div>
      )}
      
      <div 
        id="ybs-assembly-iframe-container" 
        className="flex-1 w-full"
        style={{ height: iframeHeight }}
      ></div>
    </div>
  );
};

// Wrap the component with WorkOrderAuth
const YSBAssemblyViewWithAuth = () => {
  const { itemCode: rawItemCode } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');
  
  // Normalize the item code by removing any "YBS-" prefix
  const itemCode = rawItemCode ? rawItemCode.replace(/^YBS-/, '') : '';

  return (
    <WorkOrderAuth
      workOrderId={workOrderId}
      pcbType="YBS"
      pcbItemCode={itemCode}
      redirectPath="/assembly/ybs"
    >
      <YSBAssemblyView />
    </WorkOrderAuth>
  );
};

export default YSBAssemblyViewWithAuth;
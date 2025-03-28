import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const YBSAssemblyView = () => {
  const { itemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate we have an item code
    if (!itemCode) {
      setError('No item code provided');
      setIsLoading(false);
      return;
    }
    
    // Check if the HTML file exists by creating an image and catching 404s
    const checkUrl = `/src/pages/YSB/${itemCode}.html`;
    const img = new Image();
    img.onload = () => {
      // Although this shouldn't happen (trying to load HTML as image)
      setIsLoading(false);
    };
    img.onerror = () => {
      // This will happen, but we need to check the status code
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', checkUrl, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          setIsLoading(false);
        } else {
          setError(`Assembly template for ${itemCode} not found`);
          setIsLoading(false);
        }
      };
      xhr.onerror = function() {
        setError('Failed to verify assembly template');
        setIsLoading(false);
      };
      xhr.send();
    };
    img.src = checkUrl;
  }, [itemCode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-lg">Loading assembly interface...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-300 rounded-md text-center">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
        <p className="mb-4 text-red-600">{error}</p>
        <button 
          onClick={() => navigate('/assembly/ysb')} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Assembly List
        </button>
      </div>
    );
  }

  // If everything is ok, show the iframe with the assembly page
  return (
    <div className="w-full h-full">
      <iframe
        src={`/src/pages/YSB/${itemCode}.html${location.search}`}
        style={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          border: 'none'
        }}
        title={`YBS Assembly ${itemCode}`}
      />
    </div>
  );
};

export default YBSAssemblyView;
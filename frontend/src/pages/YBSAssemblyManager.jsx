import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

const YBSAssemblyManager = () => {
  const [loading, setLoading] = useState(true);
  const [pcbItems, setPcbItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const { itemCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug current path and params
  useEffect(() => {
    console.log('YBSAssemblyManager loaded', { 
      path: location.pathname,
      itemCode: itemCode 
    });
  }, [location, itemCode]);

  // Fetch PCB items on component mount
  useEffect(() => {
    fetchPCBItems();
  }, []);

  // Handle URL parameter for item code
  useEffect(() => {
    if (itemCode && pcbItems.length > 0) {
      console.log(`Looking for item with code: ${itemCode}`);
      // Try to match exactly
      let item = pcbItems.find(item => item.item_code === itemCode);
      
      // If not found, try a case-insensitive search
      if (!item) {
        item = pcbItems.find(item => 
          item.item_code.toLowerCase() === itemCode.toLowerCase());
      }
      
      if (item) {
        console.log('Item found:', item);
        setSelectedItem(item);
      } else {
        console.error(`Item code ${itemCode} not found in available PCB items`);
        toast.error(`PCB item ${itemCode} not found`);
      }
    }
  }, [itemCode, pcbItems]);

  const fetchPCBItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/pcb-items/?category=YBS');
      console.log('Fetched PCB items:', response.data);
      setPcbItems(response.data);
    } catch (error) {
      console.error('Error fetching PCB items:', error);
      toast.error('Failed to load PCB items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item) => {
    console.log('Selected PCB item:', item);
    setSelectedItem(item);
    navigate(`/assembly/ybs/${item.item_code}`);
  };

  // Determine the iframe URL based on the selected item
  const getIframeUrl = () => {
    if (!selectedItem) return '';
    
    // Use item code to determine HTML file
    const baseUrl = `/src/pages/YBS/${selectedItem.item_code}.html`;
    return baseUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we have an item code but no selection, show loading or not found
  if (itemCode && !selectedItem) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">YBS Assembly</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded">
          <p className="text-red-700 dark:text-red-300">
            PCB Item {itemCode} not found. Please select a valid PCB item.
          </p>
          <button 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate('/assembly/ybs')}
          >
            Back to YBS Assembly
          </button>
        </div>
      </div>
    );
  }

  // If we have a selected item, show the assembly view
  if (selectedItem) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">YBS Assembly: {selectedItem.item_code}</h1>
        <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl mb-2">{selectedItem.name}</h2>
          <p className="text-gray-600 dark:text-gray-300">{selectedItem.cable_description}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Category:</span> {selectedItem.category}
            </div>
            {selectedItem.spindle_count && (
              <div>
                <span className="font-semibold">Spindle Count:</span> {selectedItem.spindle_count}
              </div>
            )}
            {selectedItem.pitch && (
              <div>
                <span className="font-semibold">Pitch:</span> {selectedItem.pitch}
              </div>
            )}
          </div>
          <div className="mt-4">
            <button 
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => navigate('/assembly/ybs')}
            >
              Back to PCB List
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <iframe 
            src={getIframeUrl()}
            className="w-full h-[calc(100vh-400px)] min-h-[500px] border-0"
            title="YBS Assembly Process"
            onError={(e) => {
              console.error('Failed to load iframe:', e);
              e.target.style.display = 'none';
              document.getElementById('iframe-fallback')?.classList.remove('hidden');
            }}
          />
          <div id="iframe-fallback" className="hidden p-8 text-center">
            <p className="text-lg text-red-600 dark:text-red-400">
              Assembly instructions for this PCB item could not be loaded.
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please contact technical support for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default view - show list of PCB items
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">YBS Assembly Manager</h1>
      <p className="mb-6">Select a PCB item to view its assembly instructions:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pcbItems.map(item => (
          <div 
            key={item.item_code}
            className="bg-white dark:bg-gray-800 p-4 rounded shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleItemSelect(item)}
          >
            <h3 className="text-lg font-semibold">{item.item_code}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                {item.category}
              </span>
              {item.spindle_count && (
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                  {item.spindle_count} spindles
                </span>
              )}
              {item.pitch && (
                <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                  {item.pitch}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {pcbItems.length === 0 && (
        <div className="text-center p-12">
          <p className="text-gray-500 dark:text-gray-400">No YBS PCB items found.</p>
        </div>
      )}
    </div>
  );
};

export default YBSAssemblyManager;
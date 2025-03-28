import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RSMAssembly = () => {
  const [assemblyItems, setAssemblyItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // RSM part numbers mapping with descriptions
  const rsmPartNumbers = {
    '5RS011027': 'RSM REGULAR 24 SPINDLES',
    '5RS011028': 'RSM REGULAR 36 SPINDLES',
    '5RS011075': 'RSM COMPACT 24 SPINDLES',
    '5RS011076': 'RSM COMPACT 36 SPINDLES',
  };

  useEffect(() => {
    // Load available RSM assembly items
    const loadAssemblyItems = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be fetched from an API
        // For now, we'll create mock data from the rsmPartNumbers object
        const mockItems = Object.entries(rsmPartNumbers).map(([itemCode, description]) => ({
          itemCode,
          description,
          thumbnail: null // placeholder for image
        }));
        
        setAssemblyItems(mockItems);
        setError(null);
      } catch (err) {
        console.error('Error loading RSM assembly items:', err);
        setError('Failed to load RSM assembly items. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssemblyItems();
  }, []);

  // Filter items based on search query
  const filteredItems = assemblyItems.filter(item => 
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">RSM Assembly Management</h1>
        <p className="text-gray-600">
          Select an RSM assembly type to begin the component verification process.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by part number or description..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <p className="text-gray-500">No matching assembly items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.itemCode} className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="bg-green-600 px-4 py-2">
                <h3 className="text-white font-semibold">{item.itemCode}</h3>
              </div>
              <div className="p-4">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-md mb-4">
                  {/* Placeholder for an image - in a real app you'd have actual images */}
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                    <span>RSM Assembly</span>
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{item.description}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  RSM circuit board assembly with component verification process.
                </p>
                <button
                  onClick={() => navigate(`/assembly/rsm/${item.itemCode}`)}
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Start Assembly Process
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default RSMAssembly;
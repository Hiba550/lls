import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios'; // Add this import
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchItemMaster, updateItem, createItem, createBomComponent } from '../api/itemMasterApi';
import { useAuth } from '../context/AuthContext';
import ItemForm from '../components/forms/ItemForm';

const Inventory = () => {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole('admin');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('item_code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // Add this function somewhere in your component
  const checkAvailableEndpoints = async () => {    try {
      // Try different potential API roots - removing /api/ to avoid 401 errors
      const potentialEndpoints = [
        '/api/item-master/',
        '/api/bom-components/'
      ];
      
      for (const endpoint of potentialEndpoints) {
        try {
          const response = await axios.get(endpoint);
          console.log(`Endpoint ${endpoint} exists:`, response.data);
        } catch (error) {
          console.log(`Error with ${endpoint}:`, error.response?.status || error.message);
        }
      }
    } catch (error) {
      console.error('Error checking endpoints:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
      checkAvailableEndpoints(); // Add this line
    }
  }, [isAdmin]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // List all available API endpoints for debugging
      console.log("Attempting to fetch from API...");
      
      const data = await fetchItemMaster();
      console.log("API response successful:", data);
      
      setItems(Array.isArray(data) ? data : []);
      setError(null);    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load inventory items. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddItem = async (formData) => {
    try {
      setLoading(true);

      // Create FormData object for file uploads
      const form = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        // Handle checkboxes and boolean values explicitly
        if (typeof formData[key] === 'boolean') {
          form.append(key, formData[key] ? 'true' : 'false');
        }
        // Handle files
        else if (key === 'image' && formData[key] instanceof File) {
          form.append(key, formData[key]);
        }
        // Skip null/undefined values
        else if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      });
      
      // Add required fields that might be missing with default values
      if (!formData.hasOwnProperty('sno') || !form.has('sno')) {
        form.append('sno', '');
      }
      
      if (!formData.hasOwnProperty('type') || !form.has('type')) {
        form.append('type', 'Part');
      }
      
      if (!formData.hasOwnProperty('item_code') || !form.has('item_code')) {
        form.append('item_code', '');
      }
      
      if (!formData.hasOwnProperty('description') || !form.has('description')) {
        form.append('description', '');
      }
      
      // Log the form data for debugging
      console.log('Submitting form with:', Object.fromEntries(form.entries()));
      
      const response = await createItem(form);
      
      // Add the new item to the list
      setItems((prev) => [...prev, response]);
      
      // Show success message
      toast.success('Item created successfully');
      
      // Reset form state
      setShowAddForm(false);
      
      // Refresh item list
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
      
      // Better error message with more details
      let errorMessage = 'Failed to create item';
      
      if (error.response?.data) {
        // If we have field-specific errors, show them in detail
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMessage += `: ${errors}`;
        } else if (error.response.data.detail) {
          errorMessage += `: ${error.response.data.detail}`;
        } else if (typeof error.response.data === 'string') {
          errorMessage += `: ${error.response.data}`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditForm(true);
    setShowViewDetails(false);
  };

  const handleUpdateItem = async (formData) => {
    try {
      setLoading(true);

      // Create FormData object for file uploads
      const form = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === 'image' && formData[key] instanceof File) {
          form.append(key, formData[key]);
        } else {
          form.append(key, formData[key]);
        }
      });

      await updateItem(selectedItem.id, form);

      // Update the item in the local state
      setItems(
        items.map((item) =>
          item.id === selectedItem.id ? { ...item, ...formData } : item
        )
      );

      // Close form
      setShowEditForm(false);

      // Show success message
      toast.success(`Updated item ${formData.item_code} successfully`);

      // Refresh to get latest data
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(`Failed to update item: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowViewDetails(true);
    setShowEditForm(false);
  };

  const closeItemDetails = () => {
    setShowViewDetails(false);
    setShowEditForm(false);
    setSelectedItem(null);
  };

  const handleAddBomComponent = async (bomData) => {
    try {
      setLoading(true);

      // For each child item, create a BOM component
      const promises = bomData.child_items.map((childId) => {
        return createBomComponent({
          parent_item: bomData.parent_item,
          child_item: childId,
          quantity: bomData.quantity,
          case_no: bomData.case_no,
        });
      });

      await Promise.all(promises);

      // Refresh items to get updated data
      fetchItems();

      toast.success('BOM components added successfully');
    } catch (error) {
      console.error('Error adding BOM components:', error);
      toast.error(`Failed to add BOM components: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    return (
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a[sortField] && !b[sortField]) return 0;
    if (!a[sortField]) return 1;
    if (!b[sortField]) return -1;

    const comparison = String(a[sortField]).localeCompare(String(b[sortField]));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Show unauthorized message for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md border-l-4 border-yellow-500">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Unauthorized Access</h2>
          <div className="flex items-center mb-4 bg-yellow-50 p-3 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H9m1.5-1l-1 1m0 0l-1-1m1 1v1M9 7h1m2 0h1m2 0h1m-6 0H9"
              />
            </svg>
            <p className="text-yellow-700">This section is restricted to administrators only.</p>
          </div>
          <p className="text-gray-600 mb-4">
            You are signed in as: <span className="font-semibold">{user?.username || user?.email || 'Unknown User'}</span>
          </p>
          <p className="text-gray-600">
            Please contact your administrator if you need access to inventory management.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="bottom-right" autoClose={5000} />
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-4">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by item code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-auto">
            <ItemForm
              onSubmit={handleAddItem}
              onCancel={() => setShowAddForm(false)}
              items={items}
              handleAddBomComponent={handleAddBomComponent}
              fetchItems={fetchItems}
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('sno')}
                >
                  S.No
                  {sortField === 'sno' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('item_code')}
                >
                  Item Code
                  {sortField === 'item_code' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('description')}
                >
                  Description
                  {sortField === 'description' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {sortField === 'type' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('uom')}
                >
                  UOM
                  {sortField === 'uom' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No items match your search.' : 'No items found. Add some items to get started.'}
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.uom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Item Details: {selectedItem.item_code}</h3>
                <button onClick={closeItemDetails} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item details rendered here */}
                <div>
                  <p className="text-sm font-medium text-gray-500">S.No</p>
                  <p className="mt-1">{selectedItem.sno || '-'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Item Code</p>
                  <p className="mt-1">{selectedItem.item_code}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-1">{selectedItem.description}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1">{selectedItem.type}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">UOM</p>
                  <p className="mt-1">{selectedItem.uom || '-'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Code</p>
                  <p className="mt-1">{selectedItem.code || '-'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">U Oper Name</p>
                  <p className="mt-1">{selectedItem.u_oper_name || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Processes</p>
                  <div className="mt-1 flex space-x-4">
                    <span className={`inline-flex items-center ${selectedItem.assembly ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={selectedItem.assembly ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      Assembly
                    </span>
                    <span className={`inline-flex items-center ${selectedItem.burn_test ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={selectedItem.burn_test ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      Burn Test
                    </span>
                    <span className={`inline-flex items-center ${selectedItem.packing ? 'text-green-600' : 'text-gray-400'}`}>
                      <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={selectedItem.packing ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      Packing
                    </span>
                  </div>
                </div>

                {selectedItem.image && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Image</p>
                    <div className="mt-1">
                      <img src={selectedItem.image} alt={selectedItem.item_code} className="max-w-xs object-cover rounded" />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Weight</p>
                  <p className="mt-1">{selectedItem.weight || '-'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Rev No</p>
                  <p className="mt-1">{selectedItem.rev_no || '0'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Rev Reason</p>
                  <p className="mt-1">{selectedItem.rev_reason || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Customer Complaint Info</p>
                  <p className="mt-1">{selectedItem.customer_complaint_info || '-'}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleEditItem(selectedItem)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Edit Item: {selectedItem.item_code}</h3>
                <button onClick={closeItemDetails} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <ItemForm
                initialData={selectedItem}
                onSubmit={handleUpdateItem}
                onCancel={closeItemDetails}
                items={items}
                handleAddBomComponent={handleAddBomComponent}
                fetchItems={fetchItems}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
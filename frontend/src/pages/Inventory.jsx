import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchItemMaster, updateItem, patchItem } from '../api/itemMasterApi';

const Inventory = () => {
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
  const [newItem, setNewItem] = useState({
    item_code: '',
    description: '',
    type: 'Part',
    uom: 'Nos',
    quantity: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItemMaster();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectedItemChange = (e) => {
    const { name, value } = e.target;
    setSelectedItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleSelectedNumberInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedItem(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newItem.item_code || !newItem.description) {
      toast.error('Item code and description are required');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post('/api/item-master/', newItem);
      
      // Add the new item to the list
      setItems(prev => [...prev, response.data]);
      
      // Reset form
      setNewItem({
        item_code: '',
        description: '',
        type: 'Part',
        uom: 'Nos',
        quantity: 0
      });
      
      // Close form
      setShowAddForm(false);
      
      // Show success message
      toast.success('Item created successfully');
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowViewDetails(true);
    setShowEditForm(false);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditForm(true);
    setShowViewDetails(false);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    if (!selectedItem || !selectedItem.id) {
      toast.error('No item selected for update');
      return;
    }

    try {
      setLoading(true);
      
      // Only update the quantity field to avoid changing other data
      await patchItem(selectedItem.id, {
        quantity: selectedItem.quantity
      });
      
      // Update the item in the local state
      setItems(items.map(item => 
        item.id === selectedItem.id ? { ...item, quantity: selectedItem.quantity } : item
      ));
      
      // Close form
      setShowEditForm(false);
      
      // Show success message
      toast.success(`Updated quantity for ${selectedItem.item_code}`);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeItemDetails = () => {
    setShowViewDetails(false);
    setShowEditForm(false);
    setSelectedItem(null);
  };

  const handleImportItems = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/item-master/import_data/', { items: parsedItems });
      toast.success(`Imported ${response.data.total} items successfully`);
      fetchItems(); // Refresh the item list
    } catch (error) {
      console.error('Error importing items:', error);
      toast.error('Failed to import items. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    return item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a[sortField] && !b[sortField]) return 0;
    if (!a[sortField]) return 1;
    if (!b[sortField]) return -1;
    
    const comparison = String(a[sortField]).localeCompare(String(b[sortField]));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => fetchItems()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </motion.div>
      
      {/* Add New Item Form */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Inventory Item</h3>
          
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
                <input
                  type="text"
                  name="item_code"
                  value={newItem.item_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={newItem.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Part">Part</option>
                  <option value="BOM">Bill of Materials</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  name="description"
                  value={newItem.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                <select
                  name="uom"
                  value={newItem.uom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Nos">Nos</option>
                  <option value="Mts">Meters</option>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Pack">Pack</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={newItem.quantity}
                  onChange={handleNumberInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* View Item Details */}
      {showViewDetails && selectedItem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Item Details</h3>
            <button 
              onClick={closeItemDetails}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">S.No</p>
              <p className="text-md font-semibold">{selectedItem.sno}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Item Code</p>
              <p className="text-md font-semibold">{selectedItem.item_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="text-md">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedItem.type === 'Part' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedItem.type}
                </span>
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-md">{selectedItem.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">UOM</p>
              <p className="text-md">{selectedItem.uom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Quantity</p>
              <p className="text-md">{selectedItem.quantity} {selectedItem.uom}</p>
            </div>
            {selectedItem.product && (
              <div>
                <p className="text-sm font-medium text-gray-500">Product</p>
                <p className="text-md">{selectedItem.product}</p>
              </div>
            )}
            {selectedItem.code && (
              <div>
                <p className="text-sm font-medium text-gray-500">Code</p>
                <p className="text-md">{selectedItem.code}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={() => handleEditItem(selectedItem)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Item
            </button>
          </div>
        </motion.div>
      )}

      {/* Edit Item Form */}
      {showEditForm && selectedItem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Edit Item</h3>
            <button 
              onClick={closeItemDetails}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                <input
                  type="text"
                  name="item_code"
                  value={selectedItem.item_code}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  name="type"
                  value={selectedItem.type}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={selectedItem.description}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                <input
                  type="text"
                  name="uom"
                  value={selectedItem.uom}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={selectedItem.quantity}
                  onChange={handleSelectedNumberInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={closeItemDetails}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Updating...' : 'Update Item'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by item code or description"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('sno')}
                >
                  <div className="flex items-center">
                    S.No
                    {sortField === 'sno' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('item_code')}
                >
                  <div className="flex items-center">
                    Item Code
                    {sortField === 'item_code' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description
                    {sortField === 'description' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Type
                    {sortField === 'type' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Quantity
                    {sortField === 'quantity' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No items match your search' : 'No items available'}
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, index) => (
                  <motion.tr 
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.sno || index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_code}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === 'Part' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity} {item.uom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => handleViewItem(item)}
                      >
                        View
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleEditItem(item)}
                      >
                        Edit
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory; 
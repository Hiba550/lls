import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const ItemForm = ({ initialData, onSubmit, onCancel, items, handleAddBomComponent: parentAddBomComponent, fetchItems }) => {
  const [formData, setFormData] = useState({
    sno: initialData?.sno || '',
    type: initialData?.type || 'Part',
    product: initialData?.product || '',
    item_code: initialData?.item_code || '',
    description: initialData?.description || '',
    uom: initialData?.uom || '',
    code: initialData?.code || '',
    u_oper_name: initialData?.u_oper_name || '',
    assembly: initialData?.assembly || false,
    burn_test: initialData?.burn_test || false,
    packing: initialData?.packing || false,
    weight: initialData?.weight || '',
    rev_reason: initialData?.rev_reason || '',
    rev_no: initialData?.rev_no || 0,
    customer_complaint_info: initialData?.customer_complaint_info || '',
    image: initialData?.image || null,
  });

  const [newItem, setNewItem] = useState({
    item_code: '',
    description: '',
    type: 'Part',
    uom: 'Nos',
    sno: '',
    product: '',
    code: '',
    u_oper_name: '',
    assembly: false,
    burn_test: false,
    packing: false,
    weight: '',
    rev_reason: '',
    rev_no: 0,
    customer_complaint_info: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBomForm, setShowBomForm] = useState(false);
  const [bomData, setBomData] = useState({
    parent_item: '',
    child_items: [],
    quantity: '',
    case_no: '',
  });
  const [tempChildItem, setTempChildItem] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error for this field when changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      image: file,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sno) newErrors.sno = 'Serial number is required';
    if (!formData.item_code) newErrors.item_code = 'Item code is required';
    if (!formData.description) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      onSubmit(formData);
      setLoading(false);
    }
  };

  const handleSubmitBomComponent = async (e) => {
    e.preventDefault();

    if (!bomData.parent_item || bomData.child_items.length === 0) {
      toast.error('Parent item and at least one child item are required');
      return;
    }

    try {
      setLoading(true);

      // Call the parent function passed in as prop
      await parentAddBomComponent(bomData);
      
      // Reset form and close
      setBomData({
        parent_item: '',
        child_items: [],
        quantity: 1,
        case_no: '',
      });
      setShowBomForm(false);
    } catch (error) {
      console.error('Error adding BOM components:', error);
      toast.error('Failed to add BOM components: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>

        <button
          onClick={() => setShowBomForm(!showBomForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {showBomForm ? 'Cancel' : 'Add BOM Component'}
        </button>
      </div>

      {showBomForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Add BOM Component</h3>

          <form onSubmit={handleSubmitBomComponent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Item *</label>
                <select
                  name="parent_item"
                  value={bomData.parent_item}
                  onChange={(e) => setBomData({ ...bomData, parent_item: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Parent Item</option>
                  {items
                    .filter((item) => item.type === 'BOM')
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_code} - {item.description}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Child Items *</label>
                <div className="border border-gray-300 rounded-md p-4">
                  <div className="mb-2">
                    <select
                      name="child_item"
                      id="child_item"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={(e) => {
                        const selectedItemId = e.target.value;
                        if (selectedItemId) {
                          setTempChildItem(selectedItemId);
                        }
                      }}
                    >
                      <option value="">Select Child Item</option>
                      {items
                        .filter((item) => item.type === 'Part')
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_code} - {item.description}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (tempChildItem && !bomData.child_items.includes(tempChildItem)) {
                        setBomData({
                          ...bomData,
                          child_items: [...bomData.child_items, tempChildItem],
                        });
                        setTempChildItem('');
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Add Child Item
                  </button>

                  {bomData.child_items.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Selected Items:</p>
                      <ul className="list-disc pl-5">
                        {bomData.child_items.map((childId) => {
                          const childItem = items.find((item) => item.id === childId);
                          return (
                            <li key={childId} className="text-sm flex justify-between">
                              <span>
                                {childItem ? `${childItem.item_code} - ${childItem.description}` : childId}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBomData({
                                    ...bomData,
                                    child_items: bomData.child_items.filter((id) => id !== childId),
                                  });
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={bomData.quantity}
                  onChange={(e) => setBomData({ ...bomData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case No</label>
                <input
                  type="text"
                  name="case_no"
                  value={bomData.case_no}
                  onChange={(e) => setBomData({ ...bomData, case_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowBomForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !bomData.parent_item || bomData.child_items.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
              >
                {loading ? 'Saving...' : 'Save BOM Component'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">S.No *</label>
              <input
                type="number"
                name="sno"
                value={formData.sno}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  errors.sno ? 'border-red-300' : ''
                }`}
                required
              />
              {errors.sno && <p className="mt-1 text-sm text-red-600">{errors.sno}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="Part">Part</option>
                <option value="BOM">Bill of Materials</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  errors.item_code ? 'border-red-300' : ''
                }`}
                required
              />
              {errors.item_code && <p className="mt-1 text-sm text-red-600">{errors.item_code}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  errors.description ? 'border-red-300' : ''
                }`}
                required
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
              <select
                name="uom"
                value={formData.uom}
                onChange={handleChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">U Oper Name</label>
              <input
                type="text"
                name="u_oper_name"
                value={formData.u_oper_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="assembly"
                  name="assembly"
                  checked={formData.assembly}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="assembly" className="ml-2 block text-sm text-gray-700">
                  Assembly
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="burn_test"
                  name="burn_test"
                  checked={formData.burn_test}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="burn_test" className="ml-2 block text-sm text-gray-700">
                  Burn Test
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="packing"
                  name="packing"
                  checked={formData.packing}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="packing" className="ml-2 block text-sm text-gray-700">
                  Packing
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <input
                type="number"
                step="0.01"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rev Reason</label>
              <input
                type="text"
                name="rev_reason"
                value={formData.rev_reason}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rev No</label>
              <input
                type="number"
                name="rev_no"
                value={formData.rev_no}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Complaint Info</label>
              <textarea
                name="customer_complaint_info"
                value={formData.customer_complaint_info}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
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
      )}
    </>
  );
};

export default ItemForm;
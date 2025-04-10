import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { createWorkOrder, updateWorkOrder, fetchWorkOrderById, fetchPCBTypes } from '../api/workOrderApi';
import { fetchItemMaster, fetchPCBItems } from '../api/itemMasterApi';

const WorkOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itemMasterList, setItemMasterList] = useState([]);
  const [pcbTypesList, setPcbTypesList] = useState([]);
  const [pcbTypes, setPcbTypes] = useState([]);
  const [pcbItems, setPcbItems] = useState([]);
  const [filteredPcbItems, setFilteredPcbItems] = useState([]);
  
  // Machine options based on PCB type
  const machineOptions = {
    YBS: [
      { id: 'ybs-m1', name: 'YBS Worker 1' },
      { id: 'ybs-m2', name: 'YBS Worker 2' },
      { id: 'ybs-m3', name: 'YBS Worker 3' }
    ],
    RSM: [
      { id: 'rsm-m1', name: 'RSM Worker 1' },
      { id: 'rsm-m2', name: 'RSM Worker 2' },
      { id: 'rsm-m3', name: 'RSM Worker 3' }
    ]
  };
  
  const [formData, setFormData] = useState({
    product: '',
    item_code: '',
    pcb_type: '',  
    pcb_type_code: '',
    pcb_item_code: '',
    quantity: 1,
    from_date: new Date().toISOString().split('T')[0], // Add from_date with today as default
    target_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    machine_id: '',
    machine_no: '',
    machine_type: '',
    description: '',
    released_by: 'System',
    remarks: '',
    status: 'Pending'
  });

  // Load item master data, PCB types and PCB items
  useEffect(() => {
    const loadPcbTypes = async () => {
      try {
        const data = await fetchPCBTypes();
        if (Array.isArray(data) && data.length > 0) {
          setPcbTypesList(data);
          // Extract codes for dropdown display
          const typeCodes = data.map(type => type.code);
          setPcbTypes(typeCodes);
        } else {
          // Fallback if no data
          setPcbTypes(['YBS', 'RSM']);
        }
      } catch (error) {
        console.error('Failed to load PCB types', error);
        setPcbTypes(['YBS', 'RSM']);
      }
    };

    const loadItemMaster = async () => {
      try {
        const data = await fetchItemMaster();
        setItemMasterList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load item master data', error);
      }
    };

    const loadPcbItems = async () => {
      try {
        const data = await fetchPCBItems();
        setPcbItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load PCB items', error);
        setPcbItems([]);
      }
    };

    loadPcbTypes();
    loadItemMaster();
    loadPcbItems();
    
    // If editing an existing work order, load its data
    if (id) {
      const loadWorkOrder = async () => {
        try {
          setLoading(true);
          const data = await fetchWorkOrderById(id);
          if (data) {
            // Format date for input field
            if (data.target_date) {
              data.target_date = new Date(data.target_date).toISOString().split('T')[0];
            }
            if (data.from_date) {
              data.from_date = new Date(data.from_date).toISOString().split('T')[0];
            } else {
              data.from_date = new Date().toISOString().split('T')[0];
            }
            
            // If we have pcb_type_code from the response, set it
            if (data.pcb_type_code) {
              data.pcb_type_code = data.pcb_type_code;
            }
            
            setFormData(data);
          }
        } catch (error) {
          toast.error('Failed to load work order data');
        } finally {
          setLoading(false);
        }
      };
      loadWorkOrder();
    }
  }, [id]);

  // Filter PCB items whenever PCB type changes
  useEffect(() => {
    if (formData.pcb_type_code && pcbItems.length > 0) {
      const filtered = pcbItems.filter(item => 
        item.category === formData.pcb_type_code
      );
      setFilteredPcbItems(filtered);
      
      // Reset selected PCB item if it's not in the filtered list
      if (formData.pcb_item_code) {
        const stillExists = filtered.some(item => item.item_code === formData.pcb_item_code);
        if (!stillExists) {
          setFormData(prev => ({
            ...prev,
            pcb_item_code: ''
          }));
        }
      }
    } else {
      setFilteredPcbItems([]);
    }
  }, [formData.pcb_type_code, pcbItems]);

  // Helper function to get PCB type ID from code
  const getPcbTypeIdFromCode = (code) => {
    const pcbType = pcbTypesList.find(type => type.code === code);
    return pcbType ? pcbType.id : null;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'pcb_type_code') {
      // When pcb_type_code changes, update pcb_type to the corresponding ID
      const pcbTypeId = getPcbTypeIdFromCode(value);
      
      setFormData(prev => {
        // Get the prefix for this PCB type
        const prefix = value === 'YBS' ? '5YB' : value === 'RSM' ? '5RS' : '';
        
        // Update item_code if needed
        const updatedItemCode = prefix && !prev.item_code.startsWith(prefix) ? 
          `${prefix}${prev.item_code.replace(/^(5YB|5RS)/, '')}` : 
          prev.item_code;
        
        return { 
          ...prev, 
          pcb_type_code: value,
          pcb_type: pcbTypeId,  // Set the actual ID for the API
          item_code: updatedItemCode,
          machine_id: '', 
          machine_type: ''
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // If PCB item is selected, update the item_code, description, and product fields
    if (name === 'pcb_item_code' && value) {
      const selectedItem = pcbItems.find(item => item.item_code === value);
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          product: selectedItem.name,
          description: `${selectedItem.name} - ${selectedItem.cable_description}`,
        }));
      }
    }
    
    // If a machine is selected, update the machine_type field
    if (name === 'machine_id' && value) {
      const pcbType = formData.pcb_type_code;
      const selectedMachine = machineOptions[pcbType]?.find(m => m.id === value);
      
      if (selectedMachine) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          machine_type: selectedMachine.name
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Remove fields that aren't part of the WorkOrder model
      const dataToSend = {
        product: formData.product,
        item_code: formData.item_code,
        description: formData.description,
        quantity: formData.quantity,
        from_date: formData.from_date, // Add this line
        target_date: formData.target_date,
        customer_name: formData.customer_name,
        machine_no: formData.machine_no,
        released_by: formData.released_by || 'System',
        remarks: formData.remarks,
        status: formData.status
      };
      
      // If pcb_type is selected (as an ID), include it in the data
      if (formData.pcb_type) {
        dataToSend.pcb_type = formData.pcb_type;
      }
      
      // Ensure we have a description
      if (!dataToSend.description) {
        dataToSend.description = `Work order for ${dataToSend.product} (${dataToSend.item_code})`;
      }
      
      // If machine_id is selected, update machine_no
      if (formData.machine_id && !dataToSend.machine_no) {
        const pcbType = formData.pcb_type_code;
        const selectedMachine = machineOptions[pcbType]?.find(m => m.id === formData.machine_id);
        if (selectedMachine) {
          dataToSend.machine_no = selectedMachine.name;
        }
      }
      
      // Ensure item_code has the correct prefix
      if (formData.pcb_type_code === 'YBS' && !dataToSend.item_code.startsWith('5YB')) {
        dataToSend.item_code = `5YB${dataToSend.item_code.replace(/^(5YB|5RS)/, '')}`;
      } else if (formData.pcb_type_code === 'RSM' && !dataToSend.item_code.startsWith('5RS')) {
        dataToSend.item_code = `5RS${dataToSend.item_code.replace(/^(5YB|5RS)/, '')}`;
      }
      
      // Convert quantity to integer to avoid validation errors
      dataToSend.quantity = parseInt(dataToSend.quantity, 10);
      if (isNaN(dataToSend.quantity) || dataToSend.quantity < 1) {
        dataToSend.quantity = 1;
      }
      
      // Validate all required fields are present
      const requiredFields = ['product', 'item_code', 'description', 'quantity', 'target_date', 'released_by'];
      const missingFields = requiredFields.filter(field => !dataToSend[field]);
      
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      console.log('Final data to send to API:', dataToSend);
      
      // Create or update work order
      if (id) {
        await updateWorkOrder(id, dataToSend);
        toast.success('Work order updated successfully');
      } else {
        const response = await createWorkOrder(dataToSend);
        console.log('API response:', response);
        toast.success('Work order created successfully');
      }
      
      // Navigate back to work orders list
      navigate('/work-orders');
    } catch (error) {
      let errorMessage = `Failed to ${id ? 'update' : 'create'} work order`;
      if (error.response?.data?.errors) {
        // If we have specific validation errors from the server
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');
        errorMessage += `: ${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter item master list by PCB type
  const filteredItems = itemMasterList.filter(item => 
    !formData.pcb_type_code || item.pcb_type === formData.pcb_type_code
  );
  
  // Get available machines based on selected PCB type
  const availableMachines = formData.pcb_type_code ? machineOptions[formData.pcb_type_code] || [] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'Edit Work Order' : 'Create Work Order'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PCB Type Selection */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">PCB Type *</label>
              <select
                name="pcb_type_code"
                value={formData.pcb_type_code}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select PCB Type</option>
                {pcbTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* PCB Item Selection - New dropdown for PCB items */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">PCB Item *</label>
              <select
                name="pcb_item_code"
                value={formData.pcb_item_code}
                onChange={handleChange}
                required
                disabled={!formData.pcb_type_code}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select PCB Item</option>
                {filteredPcbItems.map(item => (
                  <option key={item.item_code} value={item.item_code}>
                    {item.item_code} - {item.name}
                  </option>
                ))}
              </select>
              {!formData.pcb_type_code && (
                <p className="mt-1 text-sm text-gray-500">
                  Select a PCB type first to see available PCB items
                </p>
              )}
            </div>
            
            {/* Product Name */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Product name"
              />
            </div>
            
            {/* Item Code */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`${formData.pcb_type_code === 'YBS' ? '5YB' : formData.pcb_type_code === 'RSM' ? '5RS' : ''}XXXXXX`}
              />
              <p className="mt-1 text-sm text-gray-500">
                Item code should start with 5YB for YBS or 5RS for RSM PCB types
              </p>
            </div>
            
            {/* Quantity */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* From Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Target Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
              <input
                type="date"
                name="target_date"
                value={formData.target_date}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Customer Name */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Customer name"
              />
            </div>
            
            {/* Machine Selection */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
              <select
                name="machine_id"
                value={formData.machine_id}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.pcb_type_code}
              >
                <option value="">-- Select Worker --</option>
                {availableMachines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
              {!formData.pcb_type_code && (
                <p className="mt-1 text-sm text-gray-500">
                  Select a PCB type first to see available Workers
                </p>
              )}
            </div>
            
            {/* Description - Added required field */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description of the work order"
              ></textarea>
            </div>
            
            {/* Remarks (previously Notes) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional remarks"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/work-orders')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : id ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default WorkOrderForm;
import React, { useState, useEffect } from 'react';
import { fetchItemMaster } from '../../api/itemMasterApi';

const WorkOrderForm = ({ workOrder, onSubmit, onCancel }) => {
  const initialData = {
    product: '',
    item_code: '',
    description: '',
    quantity: 1,
    target_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    machine_no: '',
    status: 'Pending',
    ...workOrder
  };

  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [ybsOptions, setYbsOptions] = useState([]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const items = await fetchItemMaster();
        
        // Filter for assembly items
        const assemblyItems = Array.isArray(items) ? items.filter(item => item.assembly) : [];
        
        // YBS items from the database
        const ybsItems = assemblyItems.filter(item => 
          item.item_code.startsWith('5YB') || 
          item.product.includes('YBS') || 
          item.product.includes('RAP')
        );
        
        // If no YBS items found, add the default ones
        if (ybsItems.length === 0) {
          const defaultYbsItems = [
            {
              id: '5YB011056',
              item_code: '5YB011056',
              product: 'YBS ILI Duct Assembly - 24 spindles',
              description: 'YBS ILI DUCT ASSEMBLY - 24 spindles (PITCH - 65 mm)'
            },
            {
              id: '5YB011057',
              item_code: '5YB011057',
              product: 'YBS ILI Duct Assembly - 24 spindles',
              description: 'YBS ILI DUCT ASSEMBLY - 24 spindles (PITCH - 65 mm)'
            },
            {
              id: '5YB011059',
              item_code: '5YB011059',
              product: 'YBS ILI End Duct Assembly - 25 spindles',
              description: 'YBS ILI End DUCT ASSEMBLY - 25 spindles'
            },
            {
              id: '5YB011099',
              item_code: '5YB011099',
              product: 'RAP - ILI Duct Assembly - 23 spindles (PITCH-65 mm)',
              description: 'RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH 65 mm)'
            },
            {
              id: '5YB011100',
              item_code: '5YB011100',
              product: 'RAP - ILI Duct Assembly - 24 spindles (PITCH-65 mm)',
              description: 'RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH 65 mm)'
            },
            {
              id: '5YB011101',
              item_code: '5YB011101',
              product: 'RAP - ILI Duct Assembly - 25 spindles (PITCH-65 mm)',
              description: 'RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH 65 mm)'
            },
            {
              id: '5YB011111',
              item_code: '5YB011111',
              product: 'RAP ILI End Duct Assembly - 23 spindle (PITCH-75 mm)',
              description: 'RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH-75 mm)'
            },
            {
              id: '5YB011112',
              item_code: '5YB011112',
              product: 'RAP ILI End Duct Assembly - 24 spindles (PITCH-75 mm)',
              description: 'RAP ILI End DUCT ASSEMBLY - 24 spindles (PITCH-75 mm)'
            },
            {
              id: '5YB011113',
              item_code: '5YB011113',
              product: 'RAP ILI End Duct Assembly - 25 spindles (PITCH-75 mm)',
              description: 'RAP ILI End DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)'
            }
          ];
          setYbsOptions(defaultYbsItems);
        } else {
          setYbsOptions(ybsItems);
        }
        
        // Set other assembly items
        setItemOptions(assemblyItems.filter(item => !item.item_code.startsWith('5YB') && 
                                             !item.product.includes('YBS') && 
                                             !item.product.includes('RAP')));
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemSelect = (e) => {
    const selectedItemCode = e.target.value;
    
    // Find in YBS options first, then in regular items
    const selectedItem = ybsOptions.find(item => item.item_code === selectedItemCode) || 
                         itemOptions.find(item => item.item_code === selectedItemCode);
    
    if (selectedItem) {
      setFormData({
        ...formData,
        item_code: selectedItem.item_code,
        product: selectedItem.product,
        description: selectedItem.description
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {workOrder ? 'Edit Work Order' : 'Add New Work Order'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">YBS/RAP Machine Type</label>
          <select
            name="ybsItemSelect"
            value={formData.item_code}
            onChange={handleItemSelect}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select YBS/RAP Machine Type</option>
            {ybsOptions.map(item => (
              <option key={item.id || item.item_code} value={item.item_code}>
                {item.item_code} - {item.product}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Assembly Items</label>
          <select
            name="otherItemSelect"
            value={formData.item_code}
            onChange={handleItemSelect}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Other Assembly Item</option>
            {itemOptions.map(item => (
              <option key={item.id || item.item_code} value={item.item_code}>
                {item.item_code} - {item.product}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
          <input
            type="text"
            name="item_code"
            value={formData.item_code}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
          <input
            type="date"
            name="target_date"
            value={formData.target_date}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine No</label>
          <input
            type="text"
            name="machine_no"
            value={formData.machine_no}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {workOrder ? 'Update Work Order' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
};

export default WorkOrderForm;
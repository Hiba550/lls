import React, { useState } from 'react';

const ItemForm = ({ initialData, onSubmit, onCancel }) => {
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
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // Clear error for this field when changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
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
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Serial Number</label>
          <input
            type="number"
            name="sno"
            value={formData.sno}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.sno ? 'border-red-300' : ''
            }`}
          />
          {errors.sno && <p className="mt-1 text-sm text-red-600">{errors.sno}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Part">Part</option>
            <option value="BOM">Bill of Materials</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Product</label>
        <input
          type="text"
          name="product"
          value={formData.product}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Item Code</label>
        <input
          type="text"
          name="item_code"
          value={formData.item_code}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.item_code ? 'border-red-300' : ''
          }`}
        />
        {errors.item_code && <p className="mt-1 text-sm text-red-600">{errors.item_code}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.description ? 'border-red-300' : ''
          }`}
        ></textarea>
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit of Measure</label>
          <input
            type="text"
            name="uom"
            value={formData.uom}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Operator Name</label>
        <input
          type="text"
          name="u_oper_name"
          value={formData.u_oper_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Manufacturing Tasks</label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <input
              id="assembly"
              name="assembly"
              type="checkbox"
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
              id="burn_test"
              name="burn_test"
              type="checkbox"
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
              id="packing"
              name="packing"
              type="checkbox"
              checked={formData.packing}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="packing" className="ml-2 block text-sm text-gray-700">
              Packing
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Weight</label>
        <input
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Revision Information</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          <input
            type="number"
            name="rev_no"
            value={formData.rev_no}
            onChange={handleChange}
            placeholder="Revision Number"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <input
            type="text"
            name="rev_reason"
            value={formData.rev_reason}
            onChange={handleChange}
            placeholder="Revision Reason"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Customer Complaint Info</label>
        <textarea
          name="customer_complaint_info"
          value={formData.customer_complaint_info}
          onChange={handleChange}
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
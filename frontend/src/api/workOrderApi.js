import axios from 'axios';

// Set the API URL with the correct base
const API_URL = '/api';

// Fetch all work orders with the correct endpoint (singular)
export const fetchWorkOrders = async () => {
  try {
    console.log('Fetching work orders from API');
    const response = await axios.get(`${API_URL}/work-order/`);
    console.log('Work orders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching work orders:', error);
    
    // Provide mock data for development
    return [
      {
        id: 1,
        item_code: '5YB011057',
        product: 'YBS-2023',
        quantity: 10,
        target_date: new Date().toISOString(),
        customer_name: 'Acme Corp'
      },
      {
        id: 2,
        item_code: '5YB011113',
        product: 'RAP-2023',
        quantity: 5,
        target_date: new Date().toISOString(),
        customer_name: 'Globex Industries'
      }
    ];
  }
};

// Fetch PCB Types for dropdown selection
export const fetchPCBTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/pcb-types/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching PCB types:', error);
    
    // Provide mock data for development
    return [
      { id: 1, code: 'YBS', name: 'Yarn Breaking System', prefix: '5YB', active: true },
      { id: 2, code: 'RSM', name: 'Roland Sound Module', prefix: '5RS', active: true }
    ];
  }
};

// Fetch a single work order by ID
export const fetchWorkOrderById = async (id) => {
  try {
    // Using axios directly with proper URL
    const response = await axios.get(`${API_URL}/work-order/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching work order with ID ${id}:`, error);
    throw error;
  }
};

// Create a new work order
export const createWorkOrder = async (data) => {
  try {
    console.log('Creating work order with data:', data);
    const response = await axios.post(`${API_URL}/work-order/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating work order:', error);
    
    // Log more detailed error information
    if (error.response) {
      // The server responded with an error status code
      console.error('Server error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    throw error;
  }
};

// Update an existing work order
export const updateWorkOrder = async (id, workOrderData) => {
  try {
    const response = await axios.put(`${API_URL}/work-order/${id}/`, workOrderData);
    return response.data;
  } catch (error) {
    console.error('Error updating work order:', error);
    throw error;
  }
};

// Delete a work order
export const deleteWorkOrder = async (id) => {
  try {
    await axios.delete(`${API_URL}/work-order/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting work order with ID ${id}:`, error);
    throw error;
  }
};
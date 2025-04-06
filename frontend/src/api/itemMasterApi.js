import axios from 'axios';

const API_URL = '/api';

// Mock data for development when API is not available
const MOCK_ITEMS = [
  {
    id: 1,
    item_code: 'PCB-101',
    description: 'Printed Circuit Board',
    type: 'Part',
    uom: 'EA',
    assembly: true,
    burn_test: false,
    packing: true
  },
  {
    id: 2,
    item_code: 'IC-202',
    description: 'Integrated Circuit Chip',
    type: 'Part',
    uom: 'EA',
    assembly: true,
    burn_test: true,
    packing: false
  },
  // Add more mock items as needed
];

// Mock PCB items for development
const MOCK_PCB_ITEMS = [
  {
    id: 1,
    item_code: 'YSB011056',
    name: 'YBS ILI DUCT ASSEMBLY - 24 spindles',
    cable_description: 'YBS POWER & COMMUNICATION CABLE ASSY - 1610mm - RR',
    category: 'YBS',
    spindle_count: 24
  },
  {
    id: 2,
    item_code: 'RSM011075',
    name: '1Master 3Slave 75 mm',
    cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)',
    category: 'RSM',
    pitch: '75mm'
  }
];

// Fetch all items
export const fetchItemMaster = async () => {
  try {
    const response = await axios.get(`${API_URL}/item-master/`);
    console.log('Item master response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // For development, return mock data instead of throwing
    return MOCK_ITEMS;
  }
};

// Fetch a single item by ID
export const fetchItemById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/item-master/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error);
    throw error;
  }
};

// Create a new item
export const createItem = async (itemData) => {
  try {
    // Fix the URL path - remove the duplicate "item-master"
    const response = await axios.post(`${API_URL}/item-master/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Update an existing item
export const updateItem = async (id, itemData) => {
  try {
    // Use the dedicated update_item endpoint with PUT method
    const response = await axios.put(`${API_URL}/item-master/${id}/update_item/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Partially update an item
export const patchItem = async (id, partialData) => {
  try {
    // Use the dedicated update_item endpoint with PATCH method for partial updates
    const response = await axios.patch(`${API_URL}/item-master/${id}/update_item/`, partialData);
    return response.data;
  } catch (error) {
    console.error('Error patching item:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    // Fix the URL path - remove the duplicate "item-master"
    await axios.delete(`${API_URL}/item-master/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error);
    throw error;
  }
};

// Fetch BOM components for a specific item code - update to match your API structure
export const fetchBomComponents = async (itemCode) => {
  try {
    const response = await axios.get(`${API_URL}/item-master/bom/${itemCode}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching BOM components for item ${itemCode}:`, error);
    throw error;
  }
};

// Fetch all PCB items
export const fetchPCBItems = async (category = null) => {
  try {
    let url = `${API_URL}/pcb-items/`;
    if (category) {
      url = `${API_URL}/pcb-items/by_category/?category=${category}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching PCB items:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // For development, return mock data instead of throwing
    return MOCK_PCB_ITEMS;
  }
};

// Fetch a single PCB item by ID
export const fetchPCBItemById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/pcb-items/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching PCB item with ID ${id}:`, error);
    throw error;
  }
};

// Create a new PCB item
export const createPCBItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_URL}/pcb-items/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating PCB item:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Update an existing PCB item
export const updatePCBItem = async (id, itemData) => {
  try {
    const response = await axios.put(`${API_URL}/pcb-items/${id}/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error updating PCB item:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Import multiple PCB items
export const importPCBItems = async (items) => {
  try {
    const response = await axios.post(`${API_URL}/pcb-items/import_data/`, { items });
    return response.data;
  } catch (error) {
    console.error('Error importing PCB items:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};
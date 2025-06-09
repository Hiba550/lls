import axios from 'axios';
import { API_BASE_URL, API_CONFIG, buildApiUrl } from '../utils/apiConfig.js';

// Configure axios to handle cookies (needed for CSRF)
axios.defaults.withCredentials = true;

// Get CSRF token from cookies
const getCsrfToken = () => {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let cookie of cookieArray) {
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
};

// Get auth token from local storage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get headers with CSRF token
const getHeaders = (contentType = 'application/json') => {
  const csrfToken = getCsrfToken();
  return {
    ...getAuthHeader(),
    'Content-Type': contentType,
    'X-CSRFToken': csrfToken,
  };
};

// Use dynamic API base URL instead of hardcoded '/api'
// Remove the version number from the API URL since it's not used in your backend

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
    const response = await axios.get(`${API_BASE_URL}/item-master/`, {
      headers: getHeaders()
    });
    
    // Handle both paginated and non-paginated responses
    if (response.data && typeof response.data === 'object') {
      // If it's a paginated response with 'results' array
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      // If it's a direct array
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // If it's an object but not paginated, return empty array
      else {
        console.warn('Unexpected item master response format:', response.data);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching items:', error);
    
    // Return mock data for development
    console.log('Falling back to mock item master data');
    return MOCK_ITEMS;
  }
};

// Fetch a single item by ID
export const fetchItemById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/${id}/`, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error);
    throw error;
  }
};

// Create a new item
export const createItem = async (data) => {
  try {
    // Log what we're sending for debugging
    console.log('Creating item with data:', Object.fromEntries(data.entries()));
    
    const response = await axios.post(`${API_BASE_URL}/item-master/`, data, {
      headers: getHeaders('multipart/form-data')
    });
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Server responded with:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
};

// Update an existing item
export const updateItem = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/item-master/${id}/`, data, {
      headers: getHeaders('multipart/form-data') // For handling file uploads
    });
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Partially update an item
export const patchItem = async (id, partialData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/items/${id}/`, partialData, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error patching item:', error);
    throw error;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/items/${id}/`, {
      headers: getHeaders()
    });
    return true;
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error);
    throw error;
  }
};

// Fetch BOM components for a specific item code
export const fetchBomComponents = async (itemCode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bom-components/?parent_item__item_code=${itemCode}`, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching BOM components for item ${itemCode}:`, error);
    throw error;
  }
};

// Create a new BOM component
export const createBomComponent = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bom-components/`, data, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating BOM component:', error);
    throw error;
  }
};

// Fetch all PCB items
export const fetchPCBItems = async (category = null) => {
  try {
    let url = `${API_BASE_URL}/pcb-items/`;
    if (category) {
      url = `${API_BASE_URL}/pcb-items/by_category/?category=${category}`;
    }
    
    const response = await axios.get(url, {
      headers: getHeaders()
    });
    
    // Handle both paginated and non-paginated responses
    if (response.data && typeof response.data === 'object') {
      // If it's a paginated response with 'results' array
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      // If it's a direct array
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // If it's an object but not paginated, return empty array
      else {
        console.warn('Unexpected PCB items response format:', response.data);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching PCB items:', error);
    
    // Return mock data if API fails
    console.log('Falling back to mock PCB items data');
    return MOCK_PCB_ITEMS;
  }
};

// Fetch a single PCB item by ID
export const fetchPCBItemById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pcb-items/${id}/`, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching PCB item with ID ${id}:`, error);
    throw error;
  }
};

// Create a new PCB item
export const createPCBItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/pcb-items/`, itemData, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating PCB item:', error);
    throw error;
  }
};

// Update an existing PCB item
export const updatePCBItem = async (id, itemData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/pcb-items/${id}/`, itemData, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating PCB item:', error);
    throw error;
  }
};

// Import multiple PCB items
export const importPCBItems = async (items) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/pcb-items/import_data/`, { items }, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error importing PCB items:', error);
    throw error;
  }
};
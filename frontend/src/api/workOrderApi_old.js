// API functions for work order management (no localStorage dependencies)

const API_BASE_URL = '/api';

class WorkOrderAPI {
  /**
   * Get all work orders
   */
  static async getAllWorkOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }
  }

  /**
   * Get work orders by PCB type
   */
  static async getWorkOrdersByType(pcbType) {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/by_pcb_type/?type=${pcbType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching work orders by type:', error);
      throw error;
    }
  }

  /**
   * Get pending work orders
   */
  static async getPendingWorkOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/?status=Pending`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching pending work orders:', error);
      throw error;
    }
  }

  /**
   * Get completed work orders
   */
  static async getCompletedWorkOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/?status=Completed`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching completed work orders:', error);
      throw error;
    }
  }

  /**
   * Get rework orders
   */
  static async getReworkOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/rework_orders/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching rework orders:', error);
      throw error;
    }
  }

  /**
   * Get a specific work order by ID
   */
  static async getWorkOrder(workOrderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/${workOrderId}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching work order:', error);
      throw error;
    }
  }

  /**
   * Start assembly process for a work order
   */
  static async startAssembly(workOrderId, startedBy = 'Unknown User') {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/${workOrderId}/start_assembly/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          started_by: startedBy
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error starting assembly:', error);
      throw error;
    }
  }

  /**
   * Scan a component for an assembly
   */
  static async scanComponent(workOrderId, componentBarcode, sensorId = null, scannedBy = 'Unknown User') {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/${workOrderId}/scan_component/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component_barcode: componentBarcode,
          sensor_id: sensorId,
          scanned_by: scannedBy
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error scanning component:', error);
      throw error;
    }
  }

  /**
   * Complete assembly with full tracking data
   */
  static async completeAssembly(workOrderId, completionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/${workOrderId}/complete_assembly/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanned_components: completionData.scanned_components || [],
          assembly_barcode: completionData.assembly_barcode,
          completed_by: completionData.completed_by || 'Unknown User',
          start_time: completionData.start_time,
          quality_notes: completionData.quality_notes || ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing assembly:', error);
      throw error;
    }
  }

  /**
   * Create a rework order from an existing work order
   */
  static async createReworkOrder(originalWorkOrderId, reworkData) {
    try {
      const response = await fetch(`${API_BASE_URL}/work-order/${originalWorkOrderId}/create_rework/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: reworkData.quantity || 1,
          notes: reworkData.notes || '',
          released_by: reworkData.released_by || 'REWORK_SYSTEM'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating rework order:', error);
      throw error;
    }
  }

  /**
   * Generate barcode for assembly
   */
  static generateAssemblyBarcode(workOrderId, itemCode) {
    const timestamp = Date.now().toString().substring(8); // Last 5 digits of timestamp
    return `${itemCode}-${workOrderId}-${timestamp}`;
  }

  /**
   * Generate work order barcode
   */
  static generateWorkOrderBarcode(workOrderId, itemCode) {
    return `WO-${itemCode}-${workOrderId}`;
  }
}

// Legacy function exports for backward compatibility
export const fetchWorkOrders = WorkOrderAPI.getAllWorkOrders;
export const fetchWorkOrdersByType = WorkOrderAPI.getWorkOrdersByType;

export default WorkOrderAPI;
      }
    ];
  }
};

// Fetch PCB Types for dropdown selection
export const fetchPCBTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/pcb-types/`);
    
    // Handle both paginated and non-paginated responses
    let pcbTypes = [];
    if (response.data && typeof response.data === 'object') {
      // If it's a paginated response with 'results' array
      if (response.data.results && Array.isArray(response.data.results)) {
        pcbTypes = response.data.results;
      }
      // If it's a direct array
      else if (Array.isArray(response.data)) {
        pcbTypes = response.data;
      }
    }
    
    // Filter to show only YBS and RSM
    return pcbTypes.filter(type => type.code === 'YBS' || type.code === 'RSM');
    
  } catch (error) {
    console.error('Error fetching PCB types:', error);
    
    // Provide mock data for development - only YBS and RSM
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

// Complete one unit of a work order
export const completeWorkOrderUnit = async (id) => {
  try {
    console.log(`Completing one unit for work order ${id}`);
    const response = await axios.post(`${API_URL}/work-order/${id}/complete_unit/`);
    return response.data;
  } catch (error) {
    console.error(`Error completing unit for work order ${id}:`, error);
    throw error;
  }
};

// Update work order completion status and quantity
export const updateWorkOrderCompletion = async (id, completedQuantity, status = null) => {
  try {
    const updateData = { completed_quantity: completedQuantity };
    if (status) {
      updateData.status = status;
    }
    
    console.log(`Updating work order ${id} completion:`, updateData);
    const response = await axios.patch(`${API_URL}/work-order/${id}/`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating work order ${id} completion:`, error);
    throw error;
  }
};

// Create a rework order from a completed work order
export const createReworkOrder = async (originalWorkOrderId, reworkData) => {
  try {
    console.log(`Creating rework order for work order ${originalWorkOrderId}:`, reworkData);
    const response = await axios.post(`${API_URL}/work-order/${originalWorkOrderId}/create_rework/`, reworkData);
    return response.data;
  } catch (error) {
    console.error(`Error creating rework order for work order ${originalWorkOrderId}:`, error);
    throw error;
  }
};

// Create a rework order from a completed assembly
export const createReworkFromCompletedAssembly = async (completedAssemblyId, reworkData) => {
  try {
    console.log(`Creating rework order for completed assembly ${completedAssemblyId}:`, reworkData);
    const requestData = {
      completed_assembly_id: completedAssemblyId,
      ...reworkData
    };
    const response = await axios.post(`${API_URL}/work-order/create_rework_from_completed/`, requestData);
    return response.data;
  } catch (error) {
    console.error(`Error creating rework order for completed assembly ${completedAssemblyId}:`, error);
    throw error;
  }
};

// Fetch all rework orders
export const fetchReworkOrders = async () => {
  try {
    console.log('Fetching rework orders from API');
    const response = await axios.get(`${API_URL}/work-order/rework_orders/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rework orders:', error);
    return [];
  }
};

// Fetch work orders by PCB type
export const fetchWorkOrdersByPCBType = async (pcbType) => {
  try {
    console.log(`Fetching work orders for PCB type: ${pcbType}`);
    const response = await axios.get(`${API_URL}/work-order/by_pcb_type/?type=${pcbType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching work orders for PCB type ${pcbType}:`, error);
    return [];
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
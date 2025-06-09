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

  /**
   * Get PCB Types
   */
  static async getPCBTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/pcb-types/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.results || [];
    } catch (error) {
      console.error('Error fetching PCB types:', error);
      throw error;
    }
  }
}

// Legacy function exports for backward compatibility
export const fetchWorkOrders = WorkOrderAPI.getAllWorkOrders;
export const fetchWorkOrdersByType = WorkOrderAPI.getWorkOrdersByType;
export const fetchWorkOrderById = WorkOrderAPI.getWorkOrder;
export const createReworkOrder = WorkOrderAPI.createReworkOrder;
export const fetchReworkOrders = WorkOrderAPI.getReworkOrders;
export const fetchPCBTypes = WorkOrderAPI.getPCBTypes;
export const fetchWorkOrdersByPCBType = WorkOrderAPI.getWorkOrdersByType;

export default WorkOrderAPI;

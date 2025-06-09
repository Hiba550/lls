// Enhanced Assembly Utilities for API-based work order and assembly management
import { toast } from 'react-toastify';
import { 
  updateWorkOrderCompletion, 
  createReworkFromCompletedAssembly, 
  completeWorkOrderUnit 
} from '../api/workOrderApi.js';

/**
 * Generate consistent work order barcode
 */
export const generateWorkOrderBarcode = () => {
  const prefix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}24${suffix}`;
};

/**
 * Generate assembly barcode based on PCB type
 */
export const generateAssemblyBarcode = (pcbType = 'YBS') => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequential = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const prefix = pcbType === 'RSM' ? '5RS' : '5YB';
  return `${prefix}-${year}${month}${day}-${sequential}`;
};

/**
 * Generate consistent barcode pair with mapping
 */
export const generateConsistentBarcodes = (pcbType = 'YBS') => {
  const workOrderBarcode = generateWorkOrderBarcode();
  const assemblyBarcode = generateAssemblyBarcode(pcbType);
  
  const barcodeMapping = {
    workOrderBarcode,
    assemblyBarcode,
    pcbType,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Current User'
  };
  
  return barcodeMapping;
};

/**
 * Create comprehensive audit log entry (API-based)
 */
export const createAuditLog = async (action, details, additionalData = {}) => {
  const logEntry = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    operator: 'Current User',
    workstation: 'Assembly-01',
    ...additionalData
  };
  
  try {
    // Send audit log to the backend
    const response = await fetch('/api/assembly/audit-logs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
    
    if (response.ok) {
      console.log('Audit log created via API:', logEntry);
    } else {
      console.warn('Failed to save audit log to API, but continuing...');
    }
  } catch (error) {
    console.warn('Failed to create audit log via API:', error);
  }
  
  return logEntry;
};

/**
 * Enhanced assembly completion with API-based work order updates
 */
export const completeAssemblyEnhanced = async (selectedOrder, scannedParts, serialNumber) => {
  try {
    // Generate consistent barcodes
    const barcodes = generateConsistentBarcodes(detectPcbType(selectedOrder));
    const workOrderBarcodeNumber = selectedOrder.barcodeNumber || 
      selectedOrder.workOrderBarcodeNumber || 
      barcodes.workOrderBarcode;
    const assemblyBarcodeNumber = serialNumber || barcodes.assemblyBarcode;
    
    // Prepare comprehensive completion data for API
    const completedAssemblyData = {
      work_order_id: selectedOrder.id,
      product: selectedOrder.product,
      item_code: selectedOrder.item_code,
      serial_number: assemblyBarcodeNumber,
      barcode_number: workOrderBarcodeNumber,
      completed_at: new Date().toISOString(),
      completed_by: 'Current User',
      scanned_components: scannedParts.map(part => ({
        barcode: part.partCode,
        component_name: part.componentName || part.partCode,
        item_code: part.itemCode || part.partCode,
        scan_time: part.scanTime,
        operator: part.operator,
        replaced: part.replaced || false,
        replace_reason: part.replaceReason || null,
        replaced_with: part.replacedWith || null,
        replace_time: part.replaceTime || null,
        sensor_id: part.sensorId || null
      })),
      is_rework: selectedOrder.is_rework || false,
      original_work_order_id: selectedOrder.original_work_order_id || null,
      rework_notes: selectedOrder.rework_notes || '',
      zone: selectedOrder.zone || 'Assembly'
    };
    
    let completionResult = null;
      try {
      // First, create the completed assembly record
      const assemblyResult = await createAssemblyProcess(completedAssemblyData);
      console.log('Assembly record created:', assemblyResult);
      
      // Then update the work order completion
      const updatedWorkOrder = await completeWorkOrderUnit(selectedOrder.id);
      completionResult = updatedWorkOrder;
        
        // Create audit log
        await createAuditLog('ASSEMBLY_COMPLETED', {
          workOrderId: selectedOrder.id,
          workOrderBarcode: workOrderBarcodeNumber,
          assemblyBarcode: assemblyBarcodeNumber,
          componentCount: scannedParts.length,
          completedQuantity: updatedWorkOrder.completed_quantity,
          totalQuantity: updatedWorkOrder.quantity,
          remainingQuantity: updatedWorkOrder.remaining_quantity,
          isFullyCompleted: updatedWorkOrder.is_fully_completed
        });      
      return {
        success: true,
        completedData: completedAssemblyData,
        workOrder: updatedWorkOrder,
        assembly: assemblyResult,
        message: `Assembly completed successfully! Work Order: ${workOrderBarcodeNumber}, Assembly: ${assemblyBarcodeNumber}`
      };
      
    } catch (apiError) {
      console.error('Assembly completion API failed:', apiError);
      throw new Error(`Failed to complete assembly: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error('Enhanced completion failed:', error);
    throw error;
  }
};

/**
 * Detect PCB type from work order data
 */
export const detectPcbType = (order) => {
  // Check pcb_type_code first (serialized field from backend)
  if (order.pcb_type_code) return order.pcb_type_code;
  
  // Check pcb_type field (legacy)
  if (order.pcb_type) return order.pcb_type;
  
  // Check pcb_type_detail.code (nested object)
  if (order.pcb_type_detail?.code) return order.pcb_type_detail.code;
  
  // Fallback to item_code detection
  if (order.item_code) {
    if (order.item_code.includes('YBS') || order.item_code.includes('5YB')) return 'YBS';
    if (order.item_code.includes('RSM') || order.item_code.includes('5RS')) return 'RSM';
  }
  
  // Fallback to product name detection
  if (order.product) {
    if (order.product.includes('YBS')) return 'YBS';
    if (order.product.includes('RSM')) return 'RSM';
  }
  
  return 'YBS'; // Default fallback
};

/**
 * Enhanced rework order creation using API
 */
export const createReworkOrderEnhanced = async (orderToRework, reworkComponents, reworkNotes) => {
  try {
    // Prepare rework data for API
    const reworkData = {
      reason: reworkNotes || 'Rework needed - quality issues detected',
      components: reworkComponents || [],
      rework_notes: reworkNotes,
      quantity: 1,
      released_by: 'REWORK_SYSTEM'
    };
    
    let reworkOrder = null;
    
    // If orderToRework has a completed_assembly_id, use the completed assembly endpoint
    if (orderToRework.completed_assembly_id || orderToRework.assembly_id) {
      const completedAssemblyId = orderToRework.completed_assembly_id || orderToRework.assembly_id;
      reworkOrder = await createReworkFromCompletedAssembly(completedAssemblyId, reworkData);
    } else {
      // Otherwise, create rework from work order directly
      const response = await fetch(`/api/work-order/${orderToRework.id}/create_rework/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reworkData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Rework creation failed: ${response.status} - ${errorText}`);
      }
      
      reworkOrder = await response.json();
    }
    
    // Create audit log
    await createAuditLog('REWORK_CREATED', {
      originalOrderId: orderToRework.id,
      reworkOrderId: reworkOrder.id,
      reworkReason: reworkNotes,
      componentCount: reworkComponents.length,
      reworkType: reworkComponents.length > 0 ? 'COMPONENT_REPLACEMENT' : 'FULL_REWORK'
    });
    
    return {
      success: true,
      reworkOrder,
      message: `Rework order created successfully: ${reworkOrder.item_code}`
    };
    
  } catch (error) {
    console.error('Enhanced rework creation failed:', error);
    throw error;
  }
};

/**
 * Update component barcode with API tracking
 */
export const updateComponentBarcode = async (assemblyId, oldBarcode, newBarcode, reason) => {
  try {
    const response = await fetch('/api/assembly/update-component-barcode/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assembly_id: assemblyId,
        old_barcode: oldBarcode,
        new_barcode: newBarcode,
        reason,
        operator: 'Current User'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      await createAuditLog('COMPONENT_BARCODE_UPDATED', {
        assemblyId,
        oldBarcode,
        newBarcode,
        reason,
        workOrderBarcode: result.work_order_barcode,
        assemblyBarcode: result.assembly_barcode
      });
      
      return {
        success: true,
        result,
        message: `Component barcode updated: ${oldBarcode} → ${newBarcode}`
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Component update failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Component barcode update failed:', error);
    throw error;
  }
};

/**
 * Check if work order should remain pending or move to completed
 */
export const shouldWorkOrderMoveToCompleted = (workOrder, completionResult) => {
  // If we have quantity info from the API, use that
  if (completionResult && completionResult.workOrder) {
    return completionResult.workOrder.status === 'Completed';
  }
  
  // Fallback: check if work order has quantity info
  if (workOrder.quantity && workOrder.completed_quantity !== undefined) {
    return workOrder.completed_quantity >= workOrder.quantity;
  }
  
  // Default behavior: single unit orders move to completed
  return true;
};

/**
 * Update work order status based on completion
 */
export const updateWorkOrderStatus = (workOrder, completionResult) => {
  if (completionResult && completionResult.workOrder) {
    return completionResult.workOrder;
  }
  
  // Fallback for orders without quantity tracking
  return {
    ...workOrder,
    status: 'Completed',
    completed_at: new Date().toISOString()
  };
};

/**
 * Get the next action message for multi-quantity work orders
 */
export const getNextActionMessage = (completionResult) => {
  if (!completionResult || !completionResult.workOrder) {
    return 'Assembly completed successfully!';
  }
  
  const workOrder = completionResult.workOrder;
  
  if (workOrder.status === 'Completed') {
    return `Work order fully completed! All ${workOrder.quantity} units finished.`;
  } else {
    const remaining = workOrder.quantity - workOrder.completed_quantity;
    return `Unit completed successfully! ${remaining} units remaining. Continue with next unit?`;
  }
};

/**
 * Check if user should continue with next unit
 */
export const shouldContinueWithNextUnit = (completionResult) => {
  return completionResult && 
         completionResult.workOrder && 
         completionResult.workOrder.status !== 'Completed' &&
         completionResult.workOrder.completed_quantity < completionResult.workOrder.quantity;
};

/**
 * Get comprehensive assembly logs from API
 */
export const getAssemblyLogs = async (assemblyId = null, limit = 100) => {
  try {
    const params = new URLSearchParams();
    if (assemblyId) params.append('assembly_id', assemblyId);
    if (limit) params.append('limit', limit);
    
    const response = await fetch(`/api/assembly/audit-logs/?${params}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.results || data;
    } else {
      console.warn('Failed to fetch assembly logs from API');
      return [];
    }
  } catch (error) {
    console.error('Failed to get assembly logs:', error);
    return [];
  }
};

/**
 * Export comprehensive assembly data for reporting from API
 */
export const exportAssemblyData = async () => {
  try {
    const response = await fetch('/api/assembly/export-data/');
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.warn('Failed to export assembly data from API');
      return null;
    }
  } catch (error) {
    console.error('Failed to export assembly data:', error);
    return null;
  }
};

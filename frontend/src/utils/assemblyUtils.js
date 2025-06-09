// Enhanced Assembly Utilities for improved barcode management and tracking
import { toast } from 'react-toastify';

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
  
  // Store mapping for consistency tracking
  try {
    const mappings = JSON.parse(localStorage.getItem('barcodeMappings') || '[]');
    mappings.push(barcodeMapping);
    localStorage.setItem('barcodeMappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to store barcode mapping:', error);
  }
  
  return barcodeMapping;
};

/**
 * Create comprehensive audit log entry
 */
export const createAuditLog = (action, details, additionalData = {}) => {
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
    const auditLogs = JSON.parse(localStorage.getItem('assemblyAuditLogs') || '[]');
    auditLogs.push(logEntry);
    
    // Keep only last 5000 logs to prevent storage overflow
    if (auditLogs.length > 5000) {
      auditLogs.splice(0, auditLogs.length - 5000);
    }
    
    localStorage.setItem('assemblyAuditLogs', JSON.stringify(auditLogs));
    console.log('Audit log created:', logEntry);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
  
  return logEntry;
};

/**
 * Enhanced assembly completion with comprehensive tracking
 */
export const completeAssemblyEnhanced = async (selectedOrder, scannedParts, serialNumber) => {
  try {
    // Generate consistent barcodes
    const barcodes = generateConsistentBarcodes(detectPcbType(selectedOrder));
    const workOrderBarcodeNumber = selectedOrder.barcodeNumber || 
      selectedOrder.workOrderBarcodeNumber || 
      barcodes.workOrderBarcode;
    const assemblyBarcodeNumber = serialNumber || barcodes.assemblyBarcode;
    
    // Prepare comprehensive completion data
    const completedData = {
      id: selectedOrder.id,
      workOrder: selectedOrder.id,
      workOrderBarcodeNumber,
      assemblyBarcodeNumber,
      serialNumber: assemblyBarcodeNumber,
      barcodeNumber: workOrderBarcodeNumber,
      product: selectedOrder.product,
      item_code: selectedOrder.item_code,
      pcb_type: detectPcbType(selectedOrder),
      scannedComponents: scannedParts.map(part => ({
        barcode: part.partCode,
        componentName: part.componentName || part.partCode,
        itemCode: part.itemCode || part.partCode,
        scanTime: part.scanTime,
        operator: part.operator,
        replaced: part.replaced || false,
        replaceReason: part.replaceReason || null,
        replacedWith: part.replacedWith || null,
        replaceTime: part.replaceTime || null,
        sensorId: part.sensorId || null
      })),
      parts: scannedParts,
      completedAt: new Date().toISOString(),
      completedBy: 'Current User',
      status: 'Completed',
      is_rework: selectedOrder.is_rework || false,
      original_assembly_id: selectedOrder.original_assembly_id || null,
      reworked: selectedOrder.reworked || false,
      reworked_components: selectedOrder.rework_components || [],
      previous_components: selectedOrder.previous_components || [],
      rework_notes: selectedOrder.rework_notes || '',
      zone: selectedOrder.zone || 'Assembly',
      completion_metadata: {
        totalComponents: scannedParts.length,
        replacedComponents: scannedParts.filter(part => part.replaced).length,
        assemblyDuration: Date.now() - (selectedOrder.startTime || Date.now()),
        qualityChecks: true,
        operator: 'Current User',
        workstation: 'Assembly-01',
        completionTimestamp: new Date().toISOString()
      }
    };
    
    // Try enhanced API first
    let savedToAPI = false;
    try {
      const response = await fetch('/api/assembly/enhanced-completed-assemblies/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedData)
      });
      
      if (response.ok) {
        const result = await response.json();
        savedToAPI = true;
        
        // Update with API response
        if (result.work_order_barcode) {
          completedData.workOrderBarcodeNumber = result.work_order_barcode;
        }
        if (result.assembly_barcode) {
          completedData.assemblyBarcodeNumber = result.assembly_barcode;
        }
      } else {
        throw new Error(`Enhanced API returned ${response.status}`);
      }
    } catch (apiError) {
      console.warn('Enhanced API unavailable, trying fallback:', apiError);
      
      // Fallback to original API
      try {
        const fallbackResponse = await fetch('/api/assembly/completed-assemblies/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completedData)
        });
        
        if (fallbackResponse.ok) {
          savedToAPI = true;
        }
      } catch (fallbackError) {
        console.error('Both APIs failed:', fallbackError);
      }
    }
    
    // Always save to localStorage
    saveToLocalStorage(completedData, 'completedWorkOrders', 'assemblyCompletedOrders');
    
    // Create audit log
    createAuditLog('ASSEMBLY_COMPLETED', {
      workOrderId: selectedOrder.id,
      workOrderBarcode: workOrderBarcodeNumber,
      assemblyBarcode: assemblyBarcodeNumber,
      componentCount: scannedParts.length,
      savedToAPI
    });
    
    return {
      success: true,
      completedData,
      savedToAPI,
      message: savedToAPI 
        ? `Assembly completed successfully! Work Order: ${workOrderBarcodeNumber}, Assembly: ${assemblyBarcodeNumber}` 
        : `Assembly completed locally! Work Order: ${workOrderBarcodeNumber}, Assembly: ${assemblyBarcodeNumber}`
    };
    
  } catch (error) {
    console.error('Enhanced completion failed:', error);
    throw error;
  }
};

/**
 * Enhanced rework order creation
 */
export const createReworkOrderEnhanced = async (orderToRework, reworkComponents, reworkNotes) => {
  try {
    const reworkId = `RW-${orderToRework.id}-${Date.now().toString().substring(8)}`;
    const pcbType = detectPcbType(orderToRework);
    
    // Preserve original barcodes for consistency
    const originalWorkOrderBarcode = orderToRework.barcodeNumber || orderToRework.workOrderBarcodeNumber;
    const originalAssemblyBarcode = orderToRework.serial_number || orderToRework.assemblyBarcodeNumber;
    
    const reworkOrder = {
      id: reworkId,
      original_assembly_id: orderToRework.id,
      product: `${pcbType} Assembly (REWORK)`,
      item_code: orderToRework.item_code,
      quantity: 1,
      priority: 'high',
      status: 'Pending',
      created_at: new Date().toISOString(),
      notes: reworkNotes || 'Rework needed - quality issues detected',
      is_rework: true,
      rework_tag: '🔄 REWORK REQUIRED',
      rework_type: reworkComponents.length > 0 ? 'COMPONENT_REPLACEMENT' : 'FULL_REWORK',
      rework_components: reworkComponents.length > 0 
        ? reworkComponents.map(c => ({
            barcode: c.barcode || c.componentName,
            componentName: c.componentName || c.barcode,
            reason: c.reason || 'Quality issue',
            detectedAt: new Date().toISOString()
          }))
        : [{
            barcode: 'ALL_COMPONENTS',
            componentName: 'All Components',
            reason: 'Full assembly rework required',
            detectedAt: new Date().toISOString()
          }],
      pcb_type: pcbType,
      original_work_order_barcode: originalWorkOrderBarcode,
      original_assembly_barcode: originalAssemblyBarcode,
      barcode_to_use: originalWorkOrderBarcode,
      assembly_barcode_to_use: originalAssemblyBarcode,
      previous_components: orderToRework.scannedComponents || [],
      rework_metadata: {
        reworkInitiatedBy: 'Current User',
        reworkInitiatedAt: new Date().toISOString(),
        originalCompletedAt: orderToRework.completedAt,
        reworkReason: reworkNotes,
        estimatedReworkTime: '30 minutes',
        qualityIssueType: reworkComponents.length > 0 ? 'Component Failure' : 'Assembly Issue'
      },
      ui_indicators: {
        isRework: true,
        reworkBadge: 'REWORK',
        reworkColor: '#f59e0b',
        priorityLevel: 'HIGH'
      },
      zone: orderToRework.zone || 'Assembly',
      target_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Try enhanced API first
    let savedToAPI = false;
    try {
      const response = await fetch('/api/assembly/enhanced-rework-order/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_assembly_id: orderToRework.id,
          item_code: orderToRework.item_code,
          pcb_type: pcbType,
          rework_components: reworkComponents,
          rework_notes: reworkNotes,
          original_work_order_barcode: originalWorkOrderBarcode,
          original_assembly_barcode: originalAssemblyBarcode,
          initiated_by: 'Current User'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        savedToAPI = true;
        
        if (result.rework_order_data) {
          Object.assign(reworkOrder, result.rework_order_data);
        }
      } else {
        throw new Error(`Enhanced API returned ${response.status}`);
      }
    } catch (apiError) {
      console.warn('Enhanced API unavailable, trying fallback:', apiError);
      
      // Fallback to work orders API
      try {
        const fallbackResponse = await fetch('/api/work-orders/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reworkOrder)
        });
        
        if (fallbackResponse.ok) {
          savedToAPI = true;
        }
      } catch (fallbackError) {
        console.error('Both APIs failed:', fallbackError);
      }
    }
    
    // Save to localStorage
    saveToLocalStorage(reworkOrder, 'pendingWorkOrders', 'workOrdersBackup');
    
    // Create audit log
    createAuditLog('REWORK_ORDER_CREATED', {
      originalAssemblyId: orderToRework.id,
      reworkOrderId: reworkId,
      reworkReason: reworkNotes,
      componentsToRework: reworkComponents.length || 'ALL',
      originalWorkOrderBarcode,
      originalAssemblyBarcode,
      savedToAPI
    });
    
    return {
      success: true,
      reworkOrder,
      savedToAPI,
      message: savedToAPI 
        ? `Rework order created successfully! Order ID: ${reworkId}` 
        : `Rework order created locally! Order ID: ${reworkId}`
    };
    
  } catch (error) {
    console.error('Enhanced rework creation failed:', error);
    throw error;
  }
};

/**
 * Update component barcode with consistency tracking
 */
export const updateComponentBarcode = async (assemblyId, oldBarcode, newBarcode, reason) => {
  try {
    let savedToAPI = false;
    
    // Try enhanced API
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
        savedToAPI = true;
        
        createAuditLog('COMPONENT_BARCODE_UPDATED', {
          assemblyId,
          oldBarcode,
          newBarcode,
          reason,
          workOrderBarcode: result.work_order_barcode,
          assemblyBarcode: result.assembly_barcode,
          savedToAPI
        });
        
        return {
          success: true,
          result,
          savedToAPI,
          message: `Component barcode updated: ${oldBarcode} → ${newBarcode}`
        };
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (apiError) {
      console.error('Enhanced API failed:', apiError);
      
      // Update locally
      createAuditLog('COMPONENT_BARCODE_UPDATED', {
        assemblyId,
        oldBarcode,
        newBarcode,
        reason,
        savedToAPI: false
      });
      
      return {
        success: true,
        savedToAPI: false,
        message: `Component barcode updated locally: ${oldBarcode} → ${newBarcode}`
      };
    }
  } catch (error) {
    console.error('Component barcode update failed:', error);
    throw error;
  }
};

/**
 * Helper function to detect PCB type from order
 */
export const detectPcbType = (order) => {
  if (order.pcb_type) return order.pcb_type;
  
  if (order.item_code) {
    if (order.item_code.includes('YBS') || order.item_code.includes('5YB')) return 'YBS';
    if (order.item_code.includes('RSM') || order.item_code.includes('5RS')) return 'RSM';
  }
  
  if (order.product) {
    if (order.product.includes('YBS')) return 'YBS';
    if (order.product.includes('RSM')) return 'RSM';
  }
  
  return null;
};

/**
 * Helper function to save data to multiple localStorage keys
 */
export const saveToLocalStorage = (data, ...keys) => {
  keys.forEach(key => {
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter(item => item.id !== data.id);
      filtered.push(data);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error(`Failed to save to localStorage key ${key}:`, error);
    }
  });
};

/**
 * Get comprehensive assembly logs for audit
 */
export const getAssemblyLogs = (assemblyId = null, limit = 100) => {
  try {
    const logs = JSON.parse(localStorage.getItem('assemblyAuditLogs') || '[]');
    
    let filteredLogs = assemblyId 
      ? logs.filter(log => 
          log.details?.assemblyId === assemblyId || 
          log.details?.workOrderId === assemblyId ||
          log.details?.originalAssemblyId === assemblyId
        )
      : logs;
    
    return filteredLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get assembly logs:', error);
    return [];
  }
};

/**
 * Export comprehensive assembly data for reporting
 */
export const exportAssemblyData = () => {
  try {
    const completedOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
    const auditLogs = JSON.parse(localStorage.getItem('assemblyAuditLogs') || '[]');
    const barcodeMappings = JSON.parse(localStorage.getItem('barcodeMappings') || '[]');
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      completedOrders,
      auditLogs,
      barcodeMappings,
      summary: {
        totalCompleted: completedOrders.length,
        totalLogs: auditLogs.length,
        totalBarcodes: barcodeMappings.length
      }
    };
    
    return exportData;
  } catch (error) {
    console.error('Failed to export assembly data:', error);
    return null;
  }
};

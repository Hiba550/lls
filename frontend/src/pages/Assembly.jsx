import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import WorkOrderAPI from '../api/workOrderApi';
import { fetchItemMaster } from '../api/itemMasterApi';
import { createAssemblyProcess, fetchAssemblyProcesses, updateAssemblyProcessStatus, getCompletedAssemblies } from '../api/assemblyApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import enhanced assembly utilities with multi-quantity support
import { 
  generateConsistentBarcodes,
  generateWorkOrderBarcode,
  generateAssemblyBarcode
} from '../utils/assemblyUtils';

// Enhanced data model for completed assemblies
const completedAssemblySchema = {
  id: String,
  workOrder: String,
  product: String,
  item_code: String,
  serialNumber: String,
  barcodeNumber: String,
  completedAt: Date,
  scannedComponents: Array, // All current components
  is_rework: Boolean,
  reworked: Boolean,
  original_assembly_id: String,
  reworked_components: Array,
  previous_components: Array, // Store original components that were replaced
  rework_notes: String,
  reworked_by: String,
  zone: String
};

const Assembly = () => {  const [scannedData, setScannedData] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedParts, setScannedParts] = useState([]);
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [bom, setBom] = useState([]);
  const [error, setError] = useState(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [replaceReason, setReplaceReason] = useState('');
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('target_date');
  const [sortDesc, setSortDesc] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [machineTypes, setMachineTypes] = useState([]);
  const [pcbTypeFilter, setPcbTypeFilter] = useState('all');
  const [isAssignTypeModalOpen, setIsAssignTypeModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState(null);
  const [assignType, setAssignType] = useState('');
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [orderToRework, setOrderToRework] = useState(null);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [reworkComponents, setReworkComponents] = useState([]);
  const [reworkNotes, setReworkNotes] = useState('');  // New state variables for completed work orders filtering (removed search, keeping only date filter)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completedAssembliesLoading, setCompletedAssembliesLoading] = useState(false);
  const navigate = useNavigate();
  // Improved PCB type detection function
  const detectPcbType = (order) => {
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
    
    return null;
  };
  // Load work orders and assemblies from API only
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
          // Fetch work orders from API using WorkOrderAPI
        const workOrdersData = await WorkOrderAPI.getAllWorkOrders();
        
        // Fetch assembly processes to check completed ones
        const assemblyData = await fetchAssemblyProcesses();
        
        // Process and categorize data
        const pending = [];
        const completed = [];
        
        if (Array.isArray(workOrdersData)) {
          workOrdersData.forEach(order => {
            // Add PCB type detection
            const detectedPcbType = detectPcbType(order);
            const processedOrder = {
              ...order,
              pcb_type: detectedPcbType,
              pcb_type_code: detectedPcbType,
              source: 'api'
            };
            
            // Find if this work order has any completed assembly processes from API
            const hasCompletedAssembly = Array.isArray(assemblyData) && 
              assemblyData.some(assembly => 
                assembly.work_order && 
                assembly.work_order.id === order.id && 
                assembly.status === 'completed'
              );
            
            if (order.status === 'Completed' || hasCompletedAssembly) {
              completed.push({...processedOrder, hasCompletedAssembly: true});
            } else {
              pending.push(processedOrder);
            }
          });
        }
          setWorkOrders(pending);
        // Don't set completed orders here - they should only come from loadCompletedOrders()
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load work orders. Please try again.');        // Fallback to empty array if API fails
        setWorkOrders([]);
        // Don't set completed orders here - they should only come from loadCompletedOrders()
      } finally {
        setLoading(false);
      }
    };
    
    // Load machine types for filtering
    const loadMachineTypes = async () => {
      try {
        const items = await fetchItemMaster();
        if (Array.isArray(items)) {
          // Extract unique machine types
          const types = [...new Set(items.map(item => item.machine_type).filter(Boolean))];
          setMachineTypes(types);
        }
      } catch (err) {
        console.error('Failed to load machine types:', err);
      }
    };
    
    fetchData();
    loadMachineTypes();
  }, []);  // Load completed work orders from API with date filtering only
  const loadCompletedOrders = async (startDateFilter = '', endDateFilter = '') => {
    try {
      setCompletedAssembliesLoading(true);
      
      // Fetch completed work orders from the work-order endpoint (not assembly-process)
      // This will show actual completed work orders (4 total: 3 RSM + 1 YBS) not assemblies (35 total)
      const completedWorkOrders = await WorkOrderAPI.getCompletedWorkOrders();
      
      console.log('Fetched completed work orders:', completedWorkOrders.length, completedWorkOrders);
      
      // Apply date filtering if specified
      let filteredOrders = completedWorkOrders;
      if (startDateFilter || endDateFilter) {
        filteredOrders = completedWorkOrders.filter(order => {
          const completedDate = order.completed_at ? new Date(order.completed_at).toISOString().split('T')[0] : null;
          if (!completedDate) return false;
          
          let passesFilter = true;
          if (startDateFilter && completedDate < startDateFilter) passesFilter = false;
          if (endDateFilter && completedDate > endDateFilter) passesFilter = false;
          
          return passesFilter;
        });
      }
      
      // Convert work order format to display format - compatible with existing UI
      const formattedOrders = filteredOrders.map(workOrder => {
        // Get PCB type from pcb_type_detail or fallback detection
        let detectedPcbType = workOrder.pcb_type_code || workOrder.pcb_type_detail?.code;
        
        if (!detectedPcbType) {
          const itemCodeToCheck = workOrder.item_code || '';
          const productToCheck = workOrder.product || '';
          
          if (itemCodeToCheck.includes('YBS') || itemCodeToCheck.includes('5YB')) {
            detectedPcbType = 'YBS';
          } else if (itemCodeToCheck.includes('RSM') || itemCodeToCheck.includes('5RS')) {
            detectedPcbType = 'RSM';
          } else if (productToCheck.includes('YBS')) {
            detectedPcbType = 'YBS';
          } else if (productToCheck.includes('RSM')) {
            detectedPcbType = 'RSM';
          }
        }
        
        return {
          id: workOrder.id,
          workOrder: workOrder.display_id || workOrder.item_code || `WO-${workOrder.id}`,
          product: workOrder.product || 'Unknown Product',
          item_code: workOrder.item_code || 'Unknown Item',
          serialNumber: workOrder.assembly_barcode || workOrder.work_order_barcode || 'N/A',
          barcodeNumber: workOrder.assembly_barcode || workOrder.work_order_barcode || 'N/A',
          completedAt: workOrder.completed_at || new Date().toISOString(),
          scannedComponents: workOrder.scanned_components || [],
          is_rework: workOrder.is_rework || false,
          reworked: workOrder.is_rework || false,
          rework_notes: workOrder.rework_notes || '',
          pcb_type: detectedPcbType || 'Unknown',
          pcb_type_code: detectedPcbType || 'Unknown',
          zone: workOrder.machine_no || 'Unknown',
          customer_name: workOrder.customer_name || 'Unknown',
          completed_by: workOrder.completed_by || 'Unknown',
          quantity: workOrder.quantity || 1,
          completed_quantity: workOrder.completed_quantity || workOrder.quantity || 1,
          completion_percentage: workOrder.completion_percentage || 100,
          component_count: workOrder.component_count || (workOrder.scanned_components?.length || 0)
        };
      });
      
      console.log('Loaded completed work orders from database:', formattedOrders.length, formattedOrders);
      setCompletedOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading completed work orders from API:', error);
      setCompletedOrders([]);
      toast.error('Failed to load completed work orders');
    } finally {
      setCompletedAssembliesLoading(false);
    }
  };

  useEffect(() => {
    loadCompletedOrders();
  }, []);  // Handle date filter for completed work orders
  const handleFilterCompletedAssemblies = () => {
    loadCompletedOrders(startDate, endDate);
  };

  // Handle clear filters - reset to show all valid completed work orders from database
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    // Load all completed work orders from database (no filters)
    loadCompletedOrders();
  };

  // Update assembly progress when parts are scanned
  useEffect(() => {
    if (bom.length > 0) {
      const progress = (scannedParts.length / bom.length) * 100;
      setAssemblyProgress(progress);
    }
  }, [scannedParts, bom]);

  // Generate serial number based on product, date, and sequential number
  const generateSerialNumber = (product) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // In a real app, you'd fetch the latest sequential number from the database
    const sequentialNumber = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    return `${product.toUpperCase()}-${year}${month}-${sequentialNumber}`;
  };

  const generateBarcodeNumber = () => {
    // Generate an 11-digit random barcode with '2' in 5th position and '4' in 6th position
    const prefix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    // Combine with the required '2' in 5th position and '4' in 6th position
    return prefix + '24' + suffix;
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    // Generate a serial number
    setSerialNumber(generateSerialNumber(order.product));
    
    // Fetch BOM components for this item code
    try {
      const items = await fetchItemMaster();
      console.log('Item master data:', items);
      
      // Filter for the components that belong to this BOM
      // In a real app, you'd have a specific endpoint for getting BOM components
      setBom(Array.isArray(items) ? items.filter(item => item.type === 'Part').slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch BOM components:', err);
      setError('Failed to load BOM components. Please try again.');
      
      // Fallback to empty array if API fails
      setBom([]);
    }
  };

  const handleScan = (data) => {
    // In a real app, you'd validate the scanned part against the BOM
    setScannedData(data);
    
    // If we're replacing a part
    if (currentPartIndex !== null) {
      const updatedParts = [...scannedParts];
      // Mark the old part as replaced and add the new one
      updatedParts[currentPartIndex] = {
        ...updatedParts[currentPartIndex],
        replaced: true,
        replaceReason,
        replacedWith: data,
        replaceTime: new Date().toISOString()
      };
      setScannedParts(updatedParts);
      setCurrentPartIndex(null);
      setReplaceReason('');
      setIsReplaceModalOpen(false);
    } else {
      // Add new scanned part
      setScannedParts([...scannedParts, {
        partCode: data,
        scanTime: new Date().toISOString(),
        operator: 'Current User', // In a real app, this would be the logged-in user
      }]);
    }
  };

  const handleReplacePart = (partIndex) => {
    setCurrentPartIndex(partIndex);
    setIsReplaceModalOpen(true);
  };

  const confirmReplace = () => {
    if (!replaceReason) {
      alert('Please provide a reason for replacement');
      return;
    }
    setIsReplaceModalOpen(false);
    setIsScannerOpen(true);
  };  const handleStartAssembly = async (workOrder) => {
    try {
      setLoading(true);
        // Handle rework orders differently - navigate directly without API calls
      if (workOrder.reworked || workOrder.is_rework || workOrder.id?.toString().startsWith('RW-')) {
        console.log('Starting rework assembly directly for:', workOrder.id);
        
        // For rework orders, use the rework ID as assembly ID and navigate directly
        const assemblyId = workOrder.id; // This is the rework ID like "RW-99-17513"
        const workOrderIdForNavigation = workOrder.original_assembly_id || workOrder.id;
        
        // Get the item code for routing
        const itemCode = workOrder.item_code || 'default';
        const pcbType = detectPcbType(workOrder) || 'YBS';
        
        toast.info(`Starting rework assembly for ${pcbType}...`);
        
        // Navigate to assembly interface for rework
        if (pcbType === 'YBS') {
          navigate(`/assembly/ybs/${itemCode}?assemblyId=${assemblyId}&workOrderId=${workOrderIdForNavigation}&rework=true`);
        } else {
          navigate(`/assembly/rsm/${itemCode}?assemblyId=${assemblyId}&workOrderId=${workOrderIdForNavigation}&rework=true`);
        }
        return;
      }
      
      // For regular (non-rework) work orders, create assembly process via API
      const pcbType = detectPcbType(workOrder) || 'YBS';
      toast.info(`Creating ${pcbType} assembly process...`);
        // For regular work orders, use the work order ID directly
      const workOrderId = workOrder.id;
      
      // Debug logging
      console.log('Starting assembly for work order:', workOrder);
      console.log('Detected workOrderId:', workOrderId);
      console.log('PCB Type:', pcbType);
      
      // Validate that workOrderId is not null or undefined
      if (!workOrderId) {
        console.error('WorkOrderId is null or undefined!', { workOrder, workOrderId });
        toast.error('Cannot start assembly: Work Order ID is missing');
        return;
      }
      
      // Validate that this is a valid database work order ID (not a local/rework ID)
      if (typeof workOrderId === 'string' && (
        workOrderId.startsWith('RW-') || 
        workOrderId.startsWith('local-') ||
        workOrderId.includes('rework')
      )) {
        console.error('Invalid work order ID for API call:', workOrderId);
        toast.error('Cannot create assembly process: Invalid work order ID. This appears to be a local or rework order.');
        return;
      }
      
      // Debug logging
      console.log('Starting assembly for work order:', workOrder);
      console.log('Detected workOrderId:', workOrderId);
      console.log('PCB Type:', pcbType);
      
      // Validate that workOrderId is not null or undefined
      if (!workOrderId) {
        console.error('WorkOrderId is null or undefined!', { workOrder, workOrderId });
        toast.error('Cannot start assembly: Work Order ID is missing');
        return;
      }
      
      // Create a new assembly process
      const assemblyData = {
        work_order: workOrderId,
        created_by: 'Current User', 
        status: 'pending',
        pcb_type: pcbType
      };
      const newAssembly = await createAssemblyProcess(assemblyData);
      
      if (newAssembly && newAssembly.id) {
        toast.success(`Assembly process created! Serial number: ${newAssembly.serial_number || 'Created'}`);
          // Get the item code for routing - use a default if not available
        const itemCode = workOrder.item_code || 'default';
        
        // For YBS PCBs, navigate to YBS assembly page (lowercase route)
        if (pcbType === 'YBS') {
          navigate(`/assembly/ybs/${itemCode}?assemblyId=${newAssembly.id}&workOrderId=${workOrderId}`);
        } 
        // For RSM PCBs, navigate to RSM assembly page
        else {
          navigate(`/assembly/rsm/${itemCode}?assemblyId=${newAssembly.id}&workOrderId=${workOrderId}`);
        }
      } else {
        throw new Error('Failed to create assembly: Invalid response');
      }
    } catch (err) {
      console.error('Failed to create assembly process:', err);
      toast.error('Failed to create assembly process. Please try again.');
    } finally {
      setLoading(false);
    }
  };  // Enhanced completion function with full database backend support
  const completeAssembly = async () => {
    try {
      setLoading(true);
      
      // Generate barcodes using utility functions
      const pcbType = detectPcbType(selectedOrder);
      const workOrderBarcode = selectedOrder.work_order_barcode || generateWorkOrderBarcode();
      const assemblyBarcode = serialNumber || generateAssemblyBarcode(pcbType);
      
      // Prepare completion data
      const completionData = {
        scanned_components: scannedParts.map(part => ({
          barcode: part.partCode,
          component_name: part.componentName || part.partCode,
          scanned_at: part.scanTime || new Date().toISOString(),
          scanned_by: 'Current User'
        })),
        assembly_barcode: assemblyBarcode,
        completed_by: 'Current User',
        start_time: selectedOrder.assembly_start_time,
        quality_notes: ''
      };
      
      // Use WorkOrderAPI to complete assembly
      const updatedWorkOrder = await WorkOrderAPI.completeAssembly(selectedOrder.id, completionData);
      
      // Update assembly process status in API
      if (selectedOrder.assemblyProcessId) {
        try {
          await updateAssemblyProcessStatus(selectedOrder.assemblyProcessId, 'completed');
        } catch (err) {
          console.error('Failed to update assembly process status:', err);
        }
      }
      
      // Update local state based on whether work order is fully completed
      const isFullyCompleted = updatedWorkOrder.status === 'Completed';
      
      if (isFullyCompleted) {
        // Work order is fully completed - move to completed list
        const updatedPending = workOrders.filter(order => order.id !== selectedOrder.id);
        
        setWorkOrders(updatedPending);
          // Refresh completed orders from API to get latest data
        loadCompletedOrders();
        
        // Reset form state completely
        setSelectedOrder(null);
        setScannedParts([]);
        setSerialNumber('');
        setIsCompleteModalOpen(false);
          // Show completion message
        toast.success(`Assembly completed successfully! Work Order: ${workOrderBarcode}, Assembly: ${assemblyBarcode}`);
        
      } else {
        // Work order has more units to complete - update but keep in pending
        const updatedPending = workOrders.map(order => 
          order.id === selectedOrder.id ? updatedWorkOrder : order
        );
        
        setWorkOrders(updatedPending);
        
        // Reset only the scanned parts and serial number for next unit
        setScannedParts([]);
        setSerialNumber('');
        
        // Keep the order selected for next unit
        setSelectedOrder(updatedWorkOrder);
        
        // Close the modal but show continue message
        setIsCompleteModalOpen(false);
        
        // Show continue message
        const remaining = updatedWorkOrder.quantity - updatedWorkOrder.completed_quantity;
        toast.success(`Unit ${updatedWorkOrder.completed_quantity} of ${updatedWorkOrder.quantity} completed!`, {
          duration: 8000,
          style: {
            background: '#10B981',
            color: 'white'
          }
        });
        
        // Show instruction for next unit
        setTimeout(() => {
          toast.info(`Ready for unit ${updatedWorkOrder.completed_quantity + 1} of ${updatedWorkOrder.quantity}. ${remaining} units remaining.`, {
            duration: 5000,
            style: {
              background: '#3B82F6',
              color: 'white'
            }
          });
        }, 2000);
      }
      
    } catch (err) {
      console.error('Failed to complete assembly:', err);
      toast.error(`Failed to complete assembly: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle assigning PCB type to a work order
  const handleAssignPcbType = (order) => {
    setOrderToAssign(order);
    setAssignType(detectPcbType(order) || '');
    setIsAssignTypeModalOpen(true);
  };

  // Function to confirm PCB type assignment
  const confirmPcbTypeAssignment = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd make an API call to update the work order
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the work order in the local state
      const updatedWorkOrders = workOrders.map(order => {
        if (order.id === orderToAssign.id) {
          return {
            ...order,
            pcb_type: assignType,
            // Update item_code prefix if it doesn't match the assigned type
            item_code: assignType === 'YBS' && !order.item_code.includes('YBS') && !order.item_code.includes('5YB') 
              ? `YBS-${order.item_code}`
              : assignType === 'RSM' && !order.item_code.includes('RSM')
              ? `RSM-${order.item_code}`
              : order.item_code
          };
        }
        return order;
      });
      
      setWorkOrders(updatedWorkOrders);
      setIsAssignTypeModalOpen(false);
      toast.success(`Work order assigned as ${assignType} PCB type`);
    } catch (error) {
      console.error('Failed to assign PCB type:', error);
      toast.error('Failed to assign PCB type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced component barcode update function
  const updateComponentBarcode = async (assemblyId, oldBarcode, newBarcode, reason) => {
    try {
      setLoading(true);
      
      // Try enhanced API endpoint first
      let savedToAPI = false;
      try {
        const response = await fetch('/api/assembly/update-component-barcode/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assembly_id: assemblyId,
            old_barcode: oldBarcode,
            new_barcode: newBarcode,
            reason: reason,
            operator: 'Current User'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          savedToAPI = true;
          console.log('Component barcode updated via enhanced API:', result);
            toast.success(`Component barcode updated: ${oldBarcode} → ${newBarcode}`);
          
          // Refresh completed orders from API to get latest data
          loadCompletedOrders();
          
        } else {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
      } catch (apiError) {
        console.error('Enhanced API failed:', apiError);
        toast.error('Failed to update component barcode. Please try again.');
        return; // Don't proceed with local fallback
      }      
      // Log the component update via API
      try {
        await fetch('/api/assembly/component-update-logs/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'COMPONENT_BARCODE_UPDATED',
            assemblyId: assemblyId,
            oldBarcode: oldBarcode,
            newBarcode: newBarcode,
            reason: reason,
            timestamp: new Date().toISOString(),
            operator: 'Current User',
            savedToAPI: savedToAPI
          })
        });
      } catch (logError) {
        console.warn('Failed to save update log:', logError);
      }
      
    } catch (error) {
      console.error('Error updating component barcode:', error);
      toast.error(`Failed to update component barcode: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Enhanced logging utility for comprehensive audit trail via API
  const createAuditLog = async (action, details, additionalData = {}) => {
    const logEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
      operator: 'Current User',
      workstation: 'Assembly-01',
      ...additionalData
    };
    
    try {
      await fetch('/api/assembly/audit-logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
      console.log('Audit log created via API:', logEntry);
    } catch (error) {
      console.warn('Failed to create audit log via API:', error);
    }
  };
  // Enhanced barcode generation with API-based consistency tracking
  const generateConsistentBarcodes = async (pcbType = 'YBS') => {
    const workOrderBarcode = generateBarcodeNumber();
    const assemblyBarcode = generateSerialNumber(`${pcbType} Assembly`);
    
    // Store barcode mapping via API
    const barcodeMapping = {
      workOrderBarcode: workOrderBarcode,
      assemblyBarcode: assemblyBarcode,
      pcbType: pcbType,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Current User'
    };
    
    try {
      await fetch('/api/assembly/barcode-mappings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barcodeMapping)
      });
    } catch (error) {
      console.error('Failed to store barcode mapping:', error);
    }
    
    return barcodeMapping;
  };

  // Enhanced work order status management
  const updateWorkOrderStatus = async (workOrderId, newStatus, additionalData = {}) => {
    try {
      const statusUpdate = {
        workOrderId: workOrderId,
        newStatus: newStatus,
        previousStatus: workOrders.find(order => order.id === workOrderId)?.status || 'Unknown',
        timestamp: new Date().toISOString(),
        updatedBy: 'Current User',
        ...additionalData
      };
      
      // Create audit log for status change
      createAuditLog('WORK_ORDER_STATUS_UPDATED', statusUpdate);
      
      // Update local state
      const updatedWorkOrders = workOrders.map(order => {
        if (order.id === workOrderId) {
          return {
            ...order,
            status: newStatus,
            lastStatusUpdate: statusUpdate.timestamp,
            statusHistory: [...(order.statusHistory || []), statusUpdate]
          };
        }
        return order;
      });
      
      setWorkOrders(updatedWorkOrders);
      
      // Try to update via API
      try {
        const response = await fetch(`/api/work-orders/${workOrderId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
          console.log('Work order status updated in API successfully');
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Failed to update work order status in API:', apiError);
      }
      
    } catch (error) {
      console.error('Error updating work order status:', error);
      toast.error(`Failed to update work order status: ${error.message}`);
    }
  };

  // Filter work orders by PCB type and search term - improved categorization
  const filterWorkOrders = (orders) => {
    return orders.filter(order => {
      // Apply PCB type filtering
      const orderPcbType = detectPcbType(order);
      
      const matchesPcbType = pcbTypeFilter === 'all' ? true : 
                            pcbTypeFilter === orderPcbType;
      
      // Apply search term filtering
      const matchesSearch = searchTerm ? 
        (order.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.machine_type?.toLowerCase().includes(searchTerm.toLowerCase())) 
        : true;
      
      return matchesPcbType && matchesSearch;
    });
  };

  // Sort filtered work orders
  const sortWorkOrders = (orders) => {
    return [...orders].sort((a, b) => {
      if (!a[sortBy] && !b[sortBy]) return 0;
      if (!a[sortBy]) return 1;
      if (!b[sortBy]) return -1;
      
      const order = sortDesc ? -1 : 1;
      if (sortBy === 'target_date') {
        return order * (new Date(a[sortBy]) - new Date(b[sortBy]));
      }
      
      if (typeof a[sortBy] === 'string') {
        return order * a[sortBy].localeCompare(b[sortBy]);
      }
      
      return order * (a[sortBy] - b[sortBy]);
    });
  };
    const filteredPendingOrders = filterWorkOrders(workOrders);
  const sortedPendingOrders = sortWorkOrders(filteredPendingOrders);  // Completed orders are already filtered by the API (only assemblies with existing work orders)
  // No additional client-side filtering needed - use data directly from API
  console.log('Total completed orders from database:', completedOrders.length);
  
  const sortedCompletedOrders = sortWorkOrders(completedOrders);
  
  // Categorize by PCB type with improved detection
  const ysbOrders = filteredPendingOrders.filter(order => detectPcbType(order) === 'YBS');
  const rsmOrders = filteredPendingOrders.filter(order => detectPcbType(order) === 'RSM');
  
  // Unassigned orders (neither YBS nor RSM)
  const unassignedOrders = filteredPendingOrders.filter(order => detectPcbType(order) === null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
  };

  // Function to handle viewing details of a completed assembly
  const handleViewDetails = (order) => {
    // Instead of navigating to a different page, show the details modal
    setSelectedCompletedOrder(order);
    setIsDetailsModalOpen(true);
  };

  // Function to handle rework of a completed order
  const handleReworkOrder = (order) => {
    setOrderToRework(order);
    setIsReworkModalOpen(true);
  };
  // Function to remove an assembly from completed orders when it's being reworked
  const removeFromCompletedOrders = async (assemblyId) => {
    try {
      // Mark as reworked in backend
      await updateAssemblyProcess(assemblyId, {
        reworked: true,
        rework_notes: 'Sent for rework'
      });
      
      // Refresh completed orders from API to get latest data
      loadCompletedOrders();
      
      toast.info('Assembly removed from completed orders and sent for rework');
    } catch (error) {
      console.error('Error updating completed orders:', error);
    }
  };
  // Enhanced rework order creation using WorkOrderAPI
  const createReworkOrder = async () => {
    try {
      setLoading(true);
      
      // Prepare rework data
      const reworkData = {
        quantity: 1,
        notes: reworkNotes || 'Rework needed - quality issues detected',
        released_by: 'Current User'
      };
      
      // Use WorkOrderAPI to create rework order
      const reworkOrder = await WorkOrderAPI.createReworkOrder(orderToRework.workOrder || orderToRework.id, reworkData);
      
      console.log('Rework order created:', reworkOrder);
      
      // Add the new rework order to pending orders
      const updatedReworkOrder = {
        ...reworkOrder,
        pcb_type: detectPcbType(reworkOrder),
        displayId: `RW-${String(reworkOrder.id).padStart(6, '0')}`,
        source: 'api'
      };
      
      setWorkOrders(prev => [updatedReworkOrder, ...prev]);
      
      // Remove the original assembly from completed orders
      await removeFromCompletedOrders(orderToRework.id);
      
      // Reset state
      setIsReworkModalOpen(false);
      setOrderToRework(null);
      setReworkComponents([]);
      setReworkNotes('');
      
      toast.success(`Rework order created successfully! ID: ${updatedReworkOrder.displayId}`);
      
    } catch (error) {
      console.error('Error creating rework order:', error);
      toast.error('Failed to create rework order. Please try again.');
    } finally {
      setLoading(false);
    }
  };  // Load JsBarcode if needed for barcode display
  useEffect(() => {
    if (isDetailsModalOpen && selectedCompletedOrder?.serial_number || selectedCompletedOrder?.barcodeNumber) {
      const barcodeValue = selectedCompletedOrder.serial_number || selectedCompletedOrder.barcodeNumber;
      
      // Check if JsBarcode is loaded
      if (window.JsBarcode) {
        setTimeout(() => {
          try {
            window.JsBarcode("#barcode-display", barcodeValue, {
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 16,
              margin: 10
            });
          } catch (e) {
            console.error('Failed to render barcode:', e);
          }
        }, 100);
      } else {
        // Load JsBarcode
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
        script.onload = () => {
          setTimeout(() => {
            try {
              window.JsBarcode("#barcode-display", barcodeValue, {
                format: "CODE128",
                lineColor: "#000",
                width: 2, 
                height: 60,
                displayValue: true,
                fontSize: 16,
                margin: 10
              });
            } catch (e) {
              console.error('Failed to render barcode:', e);
            }
          }, 100);
        };
        document.head.appendChild(script);
      }
    }
  }, [isDetailsModalOpen, selectedCompletedOrder]);

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-4"
      >
        <h2 className="text-2xl font-bold text-gray-800">PCB Assembly Manager</h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="flex justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending Work Orders
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed Work Orders
            </button>
          </div>
          
          {activeTab === 'pending' && (
            <div className="flex space-x-2">
              <button
                onClick={() => setPcbTypeFilter('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  pcbTypeFilter === 'all' 
                    ? 'bg-gray-200 text-gray-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPcbTypeFilter('YBS')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  pcbTypeFilter === 'YBS' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                YBS
              </button>
              <button
                onClick={() => setPcbTypeFilter('RSM')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  pcbTypeFilter === 'RSM' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                RSM
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by product, item code, machine type or customer"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {machineTypes.map(type => (
              <button
                key={type}
                onClick={() => setSearchTerm(type)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        {activeTab === 'pending' ? (
          <div>
            {/* Unassigned PCB orders - only show if there are any */}
            {unassignedOrders.length > 0 && (
              <div className="mb-8">
                <h4 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">
                  Unassigned PCB Assemblies
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Machine Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unassignedOrders.map((order, index) => (
                        <motion.tr 
                          key={order.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.product}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.item_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.machine_type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.target_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleAssignPcbType(order)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors"
                            >
                              Assign PCB Type
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          
            {/* YBS PCB Assemblies - only show if filter is all or YBS */}
            {(pcbTypeFilter === 'all' || pcbTypeFilter === 'YBS') && (
              <div className="mb-8">
                <h4 className="text-md font-semibold mb-3 text-blue-700 border-b pb-2">
                  YBS PCB Assemblies
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Machine Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ysbOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No YBS work orders available
                          </td>
                        </tr>
                      ) : (
                        ysbOrders.map((order, index) => (
                          <motion.tr 
                            key={order.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-blue-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.product}
                              {order.is_rework && (
                                <div className="mt-1 flex items-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    Rework
                                  </span>
                                  {order.original_barcode && (
                                    <span className="ml-2 text-xs text-gray-500 font-mono">
                                      Original: {order.original_barcode}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.item_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.machine_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.target_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 justify-end">
                              <button 
                                onClick={() => handleStartAssembly(order)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                              >
                                Start YBS Assembly
                              </button>
                              <button
                                onClick={() => handleAssignPcbType(order)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                                title="Change PCB Type"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* RSM PCB Assemblies - only show if filter is all or RSM */}
            {(pcbTypeFilter === 'all' || pcbTypeFilter === 'RSM') && (
              <div className="mb-8">
                <h4 className="text-md font-semibold mb-3 text-green-700 border-b pb-2">
                  RSM PCB Assemblies
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Machine Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rsmOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No RSM work orders available
                          </td>
                        </tr>
                      ) : (
                        rsmOrders.map((order, index) => (
                          <motion.tr 
                            key={order.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-green-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order.product}
                              {order.is_rework && (
                                <div className="mt-1 flex items-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    Rework
                                  </span>
                                  {order.original_barcode && (
                                    <span className="ml-2 text-xs text-gray-500 font-mono">
                                      Original: {order.original_barcode}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.item_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.machine_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.target_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2 justify-end">
                              <button 
                                onClick={() => handleStartAssembly(order)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                              >
                                Start RSM Assembly
                              </button>
                              <button
                                onClick={() => handleAssignPcbType(order)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                                title="Change PCB Type"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Pending Orders */}
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">
                All Pending Orders
              </h4>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Machine Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes/Information
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPendingOrders.map((order, idx) => (
                      <motion.tr
                        key={order.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.product}
                          {order.is_rework && (
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Rework
                              </span>
                              {order.original_barcode && (
                                <span className="ml-2 text-xs text-gray-500 font-mono">
                                  Original: {order.original_barcode}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.item_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.machine_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.target_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                          {order.is_rework ? (
                            <div>                              <span className="font-medium text-amber-700">Rework Components:</span>
                              <ul className="list-disc ml-4 mt-1 text-xs">
                                {order.rework_components && order.rework_components.map((comp, i) => (
                                  <li key={i} className="text-amber-800">
                                    {typeof comp === 'object' ? 
                                      (comp.componentName || comp.barcode || 'Unknown Component') : 
                                      comp
                                    }
                                  </li>
                                ))}
                                {(!order.rework_components || order.rework_components.length === 0) && 
                                  <li className="text-amber-800">Full assembly rework</li>
                                }
                              </ul>
                              {order.notes && <p className="mt-1 italic text-xs">{order.notes}</p>}
                            </div>
                          ) : (
                            order.notes || '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleStartAssembly(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                          >
                            Start Assembly
                          </button>                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Completed Work Orders */
          <div>            <h4 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">
              Completed Work Orders
            </h4>
              {/* Date Filter Controls for Completed Work Orders */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleFilterCompletedAssemblies}
                  disabled={completedAssembliesLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  {completedAssembliesLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Filtering...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Apply Filter
                    </>
                  )}
                </button>
                <button
                  onClick={handleClearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>            </div>
            
            <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial/Barcode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PCB Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCompletedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No completed assemblies available
                    </td>
                  </tr>
                ) : (
                  sortedCompletedOrders.map((order, index) => (
                    <motion.tr 
                      key={order.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`hover:bg-gray-50 ${order.reworked ? 'bg-amber-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.product}
                        {order.reworked && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Reworked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.item_code}
                      </td>                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.serialNumber || order.barcodeNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          detectPcbType(order) === 'YBS' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {detectPcbType(order) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                        {order.reworked && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Reworked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleReworkOrder(order)}
                            className="text-orange-600 hover:text-orange-900 bg-orange-50 px-2 py-1 rounded"
                          >
                            Rework
                          </button>
                        </div>
                      </td>
                    </motion.tr>                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </motion.div>

      {/* PCB Type Assignment Modal */}
      <ConfirmationModal
        isOpen={isAssignTypeModalOpen}
        onClose={() => setIsAssignTypeModalOpen(false)}
        onConfirm={confirmPcbTypeAssignment}
        title="Assign PCB Type"
        message={`Select PCB type for work order: ${orderToAssign?.product || ''} (${orderToAssign?.item_code || ''})`}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">PCB Type</label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
              <input
                id="ybs-type"
                name="pcb-type"
                type="radio"
                value="YBS"
                checked={assignType === 'YBS'}
                onChange={() => setAssignType('YBS')}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="ybs-type" className="ml-2 block text-sm text-gray-700">
                YBS PCB
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="rsm-type"
                name="pcb-type"
                type="radio"
                value="RSM"
                checked={assignType === 'RSM'}
                onChange={() => setAssignType('RSM')}
                className="h-4 w-4 text-green-600 border-gray-300"
              />
              <label htmlFor="rsm-type" className="ml-2 block text-sm text-gray-700">
                RSM PCB
              </label>
            </div>
          </div>
        </div>
      </ConfirmationModal>

      <ConfirmationModal 
        isOpen={isCompleteModalOpen} 
        onClose={() => setIsCompleteModalOpen(false)} 
        onConfirm={completeAssembly}
        title="Complete Assembly"
        message="Are you sure you want to complete this assembly?"
      />

      {/* Assembly Details Modal */}
      {selectedCompletedOrder && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${isDetailsModalOpen ? '' : 'hidden'}`}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Assembly Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Product</p>
                      <p className="text-sm text-gray-900">{selectedCompletedOrder.product}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Item Code</p>
                      <p className="text-sm text-gray-900">{selectedCompletedOrder.item_code}</p>
                    </div>                    <div>
                      <p className="text-sm font-medium text-gray-500">Serial/Barcode Number</p>
                      <p className="text-sm text-gray-900">{selectedCompletedOrder.serialNumber || selectedCompletedOrder.barcodeNumber || 'N/A'}</p>
                    </div>
                    {(selectedCompletedOrder.serialNumber || selectedCompletedOrder.barcodeNumber) && (
                      <div className="col-span-2 mt-3 text-center">
                        <svg id="barcode-display"></svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">PCB Type</p>
                      <p className="text-sm text-gray-900">{detectPcbType(selectedCompletedOrder) || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completion Date</p>                      <p className="text-sm text-gray-900">
                        {selectedCompletedOrder.completedAt ? new Date(selectedCompletedOrder.completedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                        {selectedCompletedOrder.reworked && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Reworked
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {!selectedCompletedOrder.scannedComponents || selectedCompletedOrder.scannedComponents.length === 0 ? (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Assembly Components</h4>
                    <div className="max-h-60 overflow-y-auto">
                      {selectedCompletedOrder.serial_number && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3">
                          <div className="flex items-center text-yellow-800">
                            <div className="flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm">
                                Limited component information is available for this assembly.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Type</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              Product
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {selectedCompletedOrder.product}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              Item Code
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {selectedCompletedOrder.item_code}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              Serial/Barcode
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {selectedCompletedOrder.serial_number || selectedCompletedOrder.barcodeNumber || 'N/A'}
                            </td>
                          </tr>
                          {selectedCompletedOrder.reworked && (
                            <tr className="bg-amber-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-amber-700">
                                Rework Status
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-amber-700 font-medium">
                                This item was reworked
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Scanned Components</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCompletedOrder.scannedComponents.map((component, idx) => (
                            <tr key={idx} className={component.replaced ? 'bg-red-50' : ''}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {component.componentName || 'Unknown'} 
                                {component.replaced && (
                                  <span className="ml-1 text-xs text-red-500">(Replaced)</span>
                                )}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {component.itemCode}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {component.barcode}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedCompletedOrder.reworked && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Rework Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initial</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reworked by</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rework reason</th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCompletedOrder.previous_components && 
                            selectedCompletedOrder.previous_components.map((comp, idx) => {
                              // Find the matching new component (if available)
                              const newComp = selectedCompletedOrder.scannedComponents.find(
                                c => c.componentName === comp.componentName || 
                                     c.itemCode === comp.itemCode
                              );
                              
                              return (
                                <tr key={idx} className="bg-amber-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{comp.itemCode}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{comp.componentName}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">{comp.barcode}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-900">{newComp?.barcode || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {selectedCompletedOrder.reworked_by || 'System User'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {selectedCompletedOrder.rework_notes || 'Not specified'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {comp.zone || selectedCompletedOrder.zone || 'Testing'}
                                  </td>
                                </tr>
                              );
                            })
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleReworkOrder(selectedCompletedOrder);
                    }}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Rework This Assembly
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rework Modal */}
      {orderToRework && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${isReworkModalOpen ? '' : 'hidden'}`}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Create Rework Order</h3>
                  <button
                    type="button"
                    onClick={() => setIsReworkModalOpen(false)}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-700">
                    Creating rework order for <strong>{orderToRework.product}</strong> (Item Code: {orderToRework.item_code})
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Select Components for Rework</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {orderToRework.scannedComponents && orderToRework.scannedComponents.length > 0 ? (
                      orderToRework.scannedComponents.map((component, idx) => (
                        <div key={idx} className="flex items-center mb-2">
                          <input
                            id={`component-${idx}`}
                            name={`component-${idx}`}
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReworkComponents(prev => {
                                if (checked) {
                                  return [...prev, component];
                                } else {
                                  return prev.filter(c => c.barcode !== component.barcode);
                                }
                              });
                            }}
                          />
                          <label htmlFor={`component-${idx}`} className="ml-2 block text-sm text-gray-900">
                            {component.componentName} ({component.itemCode})
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 text-sm text-gray-500 italic">
                        No detailed component information available. General rework will be created.
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="rework-notes" className="block text-sm font-medium text-gray-700">
                      Rework Notes
                    </label>
                    <textarea
                      id="rework-notes"
                      name="rework-notes"
                      rows="3"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter notes for the rework order..."
                      value={reworkNotes}
                      onChange={(e) => setReworkNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsReworkModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"                    onClick={createReworkOrder}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Create Rework Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Assembly;
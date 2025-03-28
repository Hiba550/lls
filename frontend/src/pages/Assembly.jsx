import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { fetchWorkOrders } from '../api/workOrderApi';
import { fetchItemMaster } from '../api/itemMasterApi';
import { createAssemblyProcess, fetchAssemblyProcesses, updateAssemblyProcessStatus } from '../api/assemblyApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Assembly = () => {
  const [scannedData, setScannedData] = useState(null);
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
  const navigate = useNavigate();

  // Improved PCB type detection function
  const detectPcbType = (order) => {
    // Look for explicit PCB type first
    if (order.pcb_type) {
      return order.pcb_type;
    }
    
    // Check item code for indicators
    if (order.item_code) {
      if (order.item_code.includes('YSB') || order.item_code.includes('5YB')) {
        return 'YSB';
      }
      if (order.item_code.includes('RSM')) {
        return 'RSM';
      }
    }
    
    // Check product name for indicators
    if (order.product) {
      if (order.product.includes('YBS') || order.product.includes('YSB')) {
        return 'YSB';
      }
      if (order.product.includes('RSM')) {
        return 'RSM';
      }
    }
    
    // No clear type could be determined
    return null;
  };

  // Load work orders and assemblies from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch work orders
        const workOrdersData = await fetchWorkOrders();
        console.log('Work orders data:', workOrdersData);
        
        // Fetch assembly processes to check completed ones
        const assemblyData = await fetchAssemblyProcesses();
        console.log('Assembly data:', assemblyData);
        
        // Process and categorize data
        const pending = [];
        const completed = [];
        
        if (Array.isArray(workOrdersData)) {
          workOrdersData.forEach(order => {
            // Find if this work order has any completed assembly processes
            const hasCompletedAssembly = Array.isArray(assemblyData) && 
              assemblyData.some(assembly => 
                assembly.work_order && 
                assembly.work_order.id === order.id && 
                assembly.status === 'completed'
              );
            
            if (order.status === 'Completed' || hasCompletedAssembly) {
              completed.push({...order, hasCompletedAssembly});
            } else {
              pending.push(order);
            }
          });
        }
        
        console.log('Pending orders:', pending);
        console.log('Completed orders:', completed);
        
        setWorkOrders(pending);
        setCompletedOrders(completed);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load work orders. Please try again.');
        // Fallback to empty array if API fails
        setWorkOrders([]);
        setCompletedOrders([]);
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
  }, []);

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
  };

  const handleStartAssembly = async (workOrder) => {
    try {
      setLoading(true);
      
      // Determine PCB type from the work order using our helper
      const pcbType = detectPcbType(workOrder) || 'YSB';
      toast.info(`Creating ${pcbType} assembly process...`);
      
      // Create a new assembly process
      const assemblyData = {
        work_order: workOrder.id,
        created_by: 'Current User', 
        status: 'pending',
        pcb_type: pcbType
      };
      
      const newAssembly = await createAssemblyProcess(assemblyData);
      
      if (newAssembly && newAssembly.id) {
        toast.success(`Assembly process created! Serial number: ${newAssembly.serial_number || 'Created'}`);
        
        // Get the item code for routing - use a default if not available
        const itemCode = workOrder.item_code || 'default';
        
        // For YSB PCBs, navigate to YSB assembly page
        if (pcbType === 'YSB') {
          navigate(`/assembly/ysb/${itemCode}?assemblyId=${newAssembly.id}&workOrderId=${workOrder.id}`);
        } 
        // For RSM PCBs, navigate to RSM assembly page
        else {
          navigate(`/assembly/rsm/${itemCode}?assemblyId=${newAssembly.id}&workOrderId=${workOrder.id}`);
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
  };

  const completeAssembly = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd send the completed assembly data to the server
      const completedData = {
        workOrder: selectedOrder.id,
        serialNumber,
        parts: scannedParts,
        completedAt: new Date().toISOString()
      };
      
      // Update the assembly process status to completed
      if (selectedOrder.assemblyId) {
        await updateAssemblyProcessStatus(selectedOrder.assemblyId, 'completed');
      }
      
      // Move order from pending to completed
      const updatedPending = workOrders.filter(order => order.id !== selectedOrder.id);
      const updatedOrder = {...selectedOrder, status: 'Completed'};
      
      setWorkOrders(updatedPending);
      setCompletedOrders([...completedOrders, updatedOrder]);
      
      // Reset the form after completion
      setSelectedOrder(null);
      setScannedParts([]);
      setSerialNumber('');
      setIsCompleteModalOpen(false);
      
      // Show success message
      toast.success('Assembly completed successfully!');
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Failed to complete assembly:', err);
      toast.error('Failed to complete assembly. Please try again.');
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
            item_code: assignType === 'YSB' && !order.item_code.includes('YSB') && !order.item_code.includes('5YB') 
              ? `YSB-${order.item_code}`
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
  const sortedPendingOrders = sortWorkOrders(filteredPendingOrders);
  
  const filteredCompletedOrders = filterWorkOrders(completedOrders);
  const sortedCompletedOrders = sortWorkOrders(filteredCompletedOrders);
  
  // Categorize by PCB type with improved detection
  const ysbOrders = filteredPendingOrders.filter(order => detectPcbType(order) === 'YSB');
  const rsmOrders = filteredPendingOrders.filter(order => detectPcbType(order) === 'RSM');
  
  // Unassigned orders (neither YSB nor RSM)
  const unassignedOrders = filteredPendingOrders.filter(order => detectPcbType(order) === null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(false);
    }
  };

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
                onClick={() => setPcbTypeFilter('YSB')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  pcbTypeFilter === 'YSB' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                YSB
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
          
            {/* YSB PCB Assemblies - only show if filter is all or YSB */}
            {(pcbTypeFilter === 'all' || pcbTypeFilter === 'YSB') && (
              <div className="mb-8">
                <h4 className="text-md font-semibold mb-3 text-blue-700 border-b pb-2">
                  YSB PCB Assemblies
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
                            No YSB work orders available
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
                                Start YSB Assembly
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
          </div>
        ) : (
          /* Completed Work Orders */
          <div className="overflow-x-auto">
            <h4 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">
              Completed Assemblies
            </h4>
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
                    Serial Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PCB Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View Details
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
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.item_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.serial_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          detectPcbType(order) === 'YSB' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {detectPcbType(order) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.completed_at ? new Date(order.completed_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/assembly/details/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
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
                id="ysb-type"
                name="pcb-type"
                type="radio"
                value="YSB"
                checked={assignType === 'YSB'}
                onChange={() => setAssignType('YSB')}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="ysb-type" className="ml-2 block text-sm text-gray-700">
                YSB PCB
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
    </div>
  );
};

export default Assembly;
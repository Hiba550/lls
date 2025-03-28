import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { fetchWorkOrders } from '../api/workOrderApi';
import { fetchAssemblyProcesses } from '../api/assemblyApi';
import { fetchPCBItems } from '../api/itemMasterApi';

const RSMAssemblyManager = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [inProgressAssemblies, setInProgressAssemblies] = useState([]);
  const [pcbItems, setPcbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selectedPcbItemCode, setSelectedPcbItemCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Fetch data without causing infinite loops
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch RSM PCB items
        try {
          const pcbItemsData = await fetchPCBItems('RSM');
          setPcbItems(Array.isArray(pcbItemsData) ? pcbItemsData : []);
          
          // If no PCB items returned, create some defaults
          if (!pcbItemsData || pcbItemsData.length === 0) {
            setPcbItems([
              {
                id: 1,
                item_code: 'RSM011075',
                name: '1Master 3Slave 75 mm',
                cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)',
                category: 'RSM',
                pitch: '75mm'
              },
              {
                id: 2,
                item_code: 'RSM011076',
                name: '3Slave 75 mm',
                cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)',
                category: 'RSM',
                pitch: '75mm'
              },
              {
                id: 3,
                item_code: 'RSM011027',
                name: '1M 6S 70 mm',
                cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- - RR',
                category: 'RSM',
                pitch: '70mm'
              }
            ]);
          }
        } catch (pcbError) {
          console.warn('Could not fetch PCB items', pcbError);
          // Add some default RSM items for demo
          setPcbItems([
            {
              id: 1,
              item_code: 'RSM011075',
              name: '1Master 3Slave 75 mm',
              cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)',
              category: 'RSM',
              pitch: '75mm'
            },
            {
              id: 2,
              item_code: 'RSM011076',
              name: '3Slave 75 mm',
              cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)',
              category: 'RSM',
              pitch: '75mm'
            }
          ]);
        }
        
        // Fetch all work orders
        try {
          const allWorkOrders = await fetchWorkOrders();
          console.log('Work orders response:', allWorkOrders);
          
          // Filter for RSM work orders
          const rsmWorkOrders = Array.isArray(allWorkOrders) 
            ? allWorkOrders.filter(order => 
                (order.pcb_type === 'RSM') || 
                (order.product && order.product.includes('RSM')) || 
                (order.item_code && (
                  order.item_code.includes('5RS') || 
                  order.item_code.includes('RSM')
                ))
              )
            : [];
          
          // If no work orders, create mock data for demonstration
          if (rsmWorkOrders.length === 0) {
            rsmWorkOrders.push({
              id: 'demo-2',
              item_code: '5RS011075',
              pcb_item_code: 'RSM011075',
              pcb_type: 'RSM',
              product: 'RSM Cable Assembly',
              quantity: 5,
              status: 'Pending',
              target_date: new Date().toISOString()
            });
          }
          
          setWorkOrders(rsmWorkOrders);
        } catch (woError) {
          console.error('Failed to fetch work orders:', woError);
          // Create mock data for demonstration
          setWorkOrders([{
            id: 'demo-2',
            item_code: '5RS011075',
            pcb_item_code: 'RSM011075',
            pcb_type: 'RSM',
            product: 'RSM Cable Assembly',
            quantity: 5,
            status: 'Pending',
            target_date: new Date().toISOString()
          }]);
        }
        
        // Try to fetch assembly processes
        try {
          const allAssemblies = await fetchAssemblyProcesses();
          
          const pendingAssemblies = Array.isArray(allAssemblies)
            ? allAssemblies.filter(assembly => 
                (assembly.status === 'pending' || assembly.status === 'in_progress') &&
                (
                  assembly.work_order?.pcb_type === 'RSM' ||
                  (assembly.work_order?.item_code && (
                    assembly.work_order.item_code.includes('5RS') ||
                    assembly.work_order.item_code.includes('RSM')
                  ))
                )
              )
            : [];
          
          setInProgressAssemblies(pendingAssemblies);
        } catch (assemblyError) {
          console.warn('Could not fetch assembly processes', assemblyError);
          // Continue without assembly processes - we'll show an empty list
          setInProgressAssemblies([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load assembly data. Please try again.');
        
        // Set mock data for demonstration purposes
        setPcbItems([
          {
            id: 1,
            item_code: 'RSM011075',
            name: '1Master 3Slave 75 mm',
            cable_description: 'RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)',
            category: 'RSM',
            pitch: '75mm'
          }
        ]);
        
        setWorkOrders([{
          id: 'demo-2',
          item_code: '5RS011075',
          pcb_item_code: 'RSM011075',
          pcb_type: 'RSM',
          product: 'RSM Cable Assembly',
          quantity: 5,
          status: 'Pending',
          target_date: new Date().toISOString()
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Empty dependency array means it only runs once
  
  // Handle starting a new assembly
  const handleStartAssembly = async (workOrder) => {
    try {
      setCreating(true);
      toast.info('Preparing assembly process...');
      
      // Get PCB item code from work order or selected value
      const pcbItemCode = workOrder.pcb_item_code || selectedPcbItemCode;
      
      // Validate PCB item code
      if (!pcbItemCode) {
        toast.error('Please select a PCB item to continue');
        setCreating(false);
        return;
      }
      
      console.log('Creating assembly for work order:', workOrder, 'PCB item code:', pcbItemCode);
      
      // Save to localStorage for persistence
      localStorage.setItem('currentRSMWorkOrderId', workOrder.id);
      localStorage.setItem('currentRSMItemCode', pcbItemCode);
      
      // Navigate to the corresponding assembly page with work order ID
      toast.success(`Assembly process prepared successfully!`);
      navigate(`/assembly/rsm/${pcbItemCode}?workOrderId=${workOrder.id}`);
    } catch (err) {
      console.error('Error preparing assembly process:', err);
      toast.error('Failed to prepare assembly. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Get PCB item name by code
  const getPcbItemName = (code) => {
    const item = pcbItems.find(item => item.item_code === code);
    return item ? item.name : code;
  };
  
  // Filter items based on search query
  const filteredPcbItems = pcbItems.filter(item => {
    if (!searchQuery) return true;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      item.item_code.toLowerCase().includes(lowerCaseQuery) ||
      item.name.toLowerCase().includes(lowerCaseQuery) ||
      item.cable_description.toLowerCase().includes(lowerCaseQuery) ||
      (item.pitch && item.pitch.toLowerCase().includes(lowerCaseQuery))
    );
  });

  // Render UI based on loading state
  if (loading && !inProgressAssemblies.length && !pcbItems.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-sm text-red-600">Continuing with demo data.</p>
            </div>
          </div>
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-gray-800">RSM Assembly Management</h1>
        <Link 
          to="/assembly" 
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to All Assemblies
        </Link>
      </motion.div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by part number, description or pitch..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* PCB Items Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="bg-green-600 px-4 py-3">
          <h3 className="text-white font-semibold text-lg">Select RSM PCB Item for Assembly</h3>
        </div>
        
        <div className="p-4">
          {filteredPcbItems.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <p className="text-gray-500">No matching assembly items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPcbItems.map((pcbItem) => (
                <div 
                  key={pcbItem.item_code} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPcbItemCode === pcbItem.item_code 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPcbItemCode(pcbItem.item_code)}
                >
                  <div className="font-medium text-green-800">{pcbItem.item_code}</div>
                  <div className="mt-1 text-sm text-gray-600">{pcbItem.name}</div>
                  <div className="mt-2 text-xs text-gray-500">{pcbItem.cable_description}</div>
                  {pcbItem.pitch && (
                    <div className="mt-1 inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                      Pitch: {pcbItem.pitch}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Display in-progress assemblies if any */}
      {inProgressAssemblies.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="bg-blue-600 px-4 py-3">
            <h3 className="text-white font-semibold text-lg">Continue In-Progress Assemblies</h3>
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inProgressAssemblies.map((assembly) => {
                    // Get the PCB item code from the work order, assembly data, or use default
                    const pcbItemCode = 
                      assembly.work_order?.pcb_item_code || 
                      assembly.part_code || 
                      assembly.work_order?.item_code?.replace(/^5RS/, 'RSM') || 
                      'RSM011075';
                    
                    return (
                      <tr key={assembly.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            #{assembly.work_order?.id || assembly.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{pcbItemCode}</div>
                          <div className="text-xs text-gray-500">
                            {getPcbItemName(pcbItemCode)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                            assembly.status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assembly.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(assembly.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/assembly/rsm/${pcbItemCode}?workOrderId=${assembly.work_order?.id || assembly.id}`}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            Continue
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Work orders section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="bg-green-600 px-4 py-3">
          <h3 className="text-white font-semibold text-lg">Start New Assembly</h3>
        </div>
        
        <div className="p-4">
          {workOrders.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No RSM work orders available.</p>
              <Link 
                to="/work-orders" 
                className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Work Order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCB Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.product}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.pcb_item_code ? (
                          <div>
                            <div className="text-sm text-gray-900">{order.pcb_item_code}</div>
                            <div className="text-xs text-gray-500">{getPcbItemName(order.pcb_item_code)}</div>
                          </div>
                        ) : (
                          <select
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                            value={selectedPcbItemCode}
                            onChange={(e) => setSelectedPcbItemCode(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Select PCB Item</option>
                            {pcbItems.map((item) => (
                              <option key={item.item_code} value={item.item_code}>
                                {item.item_code} - {item.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.target_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleStartAssembly(order)}
                          className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={creating || (!order.pcb_item_code && !selectedPcbItemCode)}
                        >
                          {creating ? 'Starting...' : 'Start Assembly'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RSMAssemblyManager;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { fetchWorkOrders } from '../api/workOrderApi';
import { fetchAssemblyProcesses } from '../api/assemblyApi';
import { fetchPCBItems } from '../api/itemMasterApi';

const YSBAssemblyManager = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [inProgressAssemblies, setInProgressAssemblies] = useState([]);
  const [pcbItems, setPcbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Fetch data without causing infinite loops
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch YBS PCB items
        try {
          const pcbItemsData = await fetchPCBItems('YSB');
          setPcbItems(Array.isArray(pcbItemsData) ? pcbItemsData : []);
        } catch (pcbError) {
          console.warn('Could not fetch PCB items', pcbError);
          setPcbItems([]);
        }
        
        // Fetch all work orders
        const allWorkOrders = await fetchWorkOrders();
        console.log('Work orders response:', allWorkOrders);
        
        // Filter for YBS work orders
        const ybsWorkOrders = Array.isArray(allWorkOrders) 
          ? allWorkOrders.filter(order => 
              (order.pcb_type === 'YSB') || 
              (order.product && (order.product.includes('YBS') || order.product.includes('RAP'))) || 
              (order.item_code && (
                order.item_code.includes('5YB') || 
                order.item_code.includes('YSB')
              ))
            )
          : [];
        
        // If no work orders, create mock data for demonstration
        if (ybsWorkOrders.length === 0) {
          ybsWorkOrders.push({
            id: 'demo-1',
            item_code: '5YB011057',
            pcb_item_code: 'YSB011057',
            pcb_type: 'YSB',
            product: 'YBS Cable Assembly',
            quantity: 10,
            status: 'Pending',
            target_date: new Date().toISOString()
          });
        }
        
        // Try to fetch assembly processes
        try {
          const allAssemblies = await fetchAssemblyProcesses();
          
          const pendingAssemblies = Array.isArray(allAssemblies)
            ? allAssemblies.filter(assembly => 
                (assembly.status === 'pending' || assembly.status === 'in_progress') &&
                (
                  assembly.work_order?.pcb_type === 'YSB' ||
                  (assembly.work_order?.item_code && (
                    assembly.work_order.item_code.includes('5YB') ||
                    assembly.work_order.item_code.includes('YSB')
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
        
        setWorkOrders(ybsWorkOrders);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load assembly data. Please try again.');
        
        // Create demo data even on error to allow using the app
        setWorkOrders([{
          id: 'demo-1',
          item_code: '5YB011057',
          pcb_item_code: 'YSB011057',
          pcb_type: 'YSB',
          product: 'YBS Cable Assembly',
          quantity: 10,
          status: 'Pending',
          target_date: new Date().toISOString()
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Get PCB item name by code
  const getPcbItemName = (code) => {
    const item = pcbItems.find(item => item.item_code === code);
    return item ? item.name : code;
  };
  
  // Redirect to main assembly dashboard with information message
  const redirectToMainDashboard = () => {
    navigate(`/assembly`);
    toast.info("Please use the main Assembly Dashboard to create or manage assemblies");
  };

  // Render UI based on loading and error states
  if (loading && !inProgressAssemblies.length && !workOrders.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader w-12 h-12"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-danger mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800 dark:text-danger-200">{error}</h3>
              <p className="mt-1 text-sm text-danger-700 dark:text-danger-300">
                Continuing with demo data.
              </p>
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
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">YBS Cable Assembly Information</h2>
        <Link 
          to="/assembly" 
          className="btn-outline"
        >
          Back to Assembly Dashboard
        </Link>
      </motion.div>

      {/* PCB Items Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400">YBS PCB Items</h3>
        </div>
        
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          {pcbItems.map((pcbItem) => (
            <div 
              key={pcbItem.item_code}
              className="p-4 border rounded-lg border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-800"
            >
              <div className="font-medium text-blue-800 dark:text-blue-300">{pcbItem.item_code}</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{pcbItem.name}</div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{pcbItem.cable_description}</div>
              {pcbItem.spindle_count && (
                <div className="mt-1 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  {pcbItem.spindle_count} spindles
                </div>
              )}
              {pcbItem.pitch && (
                <div className="mt-1 ml-2 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  Pitch: {pcbItem.pitch}
                </div>
              )}
            </div>
          ))}
          
          {pcbItems.length === 0 && (
            <div className="col-span-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
              <p>No PCB items available. Please add PCB items to the database.</p>
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
          className="card"
        >
          <div className="card-header">
            <h3 className="text-xl font-semibold text-primary-700 dark:text-primary-400">In-Progress YBS Assemblies</h3>
          </div>
          
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Work Order</th>
                    <th>Item Code</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {inProgressAssemblies.map((assembly) => {
                    // Get the PCB item code from the work order, assembly data, or use default
                    const pcbItemCode = 
                      assembly.work_order?.pcb_item_code || 
                      assembly.part_code || 
                      assembly.work_order?.item_code?.replace(/^5YB/, 'YSB') || 
                      'YSB011057';
                    
                    return (
                      <tr key={assembly.id} className="table-row">
                        <td className="font-medium text-neutral-800 dark:text-neutral-200">
                          #{assembly.work_order?.id || assembly.id}
                        </td>
                        <td>
                          {pcbItemCode}
                          <div className="text-xs text-gray-500">
                            {getPcbItemName(pcbItemCode)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            assembly.status === 'pending' ? 'badge-primary' : 'badge-warning'
                          }`}>
                            {assembly.status}
                          </span>
                        </td>
                        <td>
                          {new Date(assembly.created_at).toLocaleString()}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={redirectToMainDashboard}
                            className="btn-primary py-1 px-3 text-sm"
                          >
                            View in Dashboard
                          </button>
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
        className="card"
      >
        <div className="card-header">
          <h3 className="text-xl font-semibold text-success-700 dark:text-success-400">Available YBS Work Orders</h3>
        </div>
        
        <div className="card-body">
          {workOrders.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
              <p>No YBS work orders available.</p>
              <button 
                onClick={() => navigate('/work-orders')}
                className="btn-primary mt-4 inline-block"
              >
                View Work Orders
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Work Order</th>
                    <th>Product</th>
                    <th>PCB Item</th>
                    <th>Quantity</th>
                    <th>Target Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {workOrders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="font-medium text-neutral-800 dark:text-neutral-200">
                        #{order.id}
                      </td>
                      <td>{order.product}</td>
                      <td>{order.pcb_item_code || 'N/A'}</td>
                      <td>{order.quantity}</td>
                      <td>
                        {new Date(order.target_date).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={redirectToMainDashboard}
                          className="btn-info py-1 px-3 text-sm"
                        >
                          View in Dashboard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Information Only View</h3>
                <div className="mt-2 text-sm text-blue-600">
                  <p>This page is for inspection only. Please use the <button onClick={redirectToMainDashboard} className="underline font-medium">main Assembly Dashboard</button> to create and manage assemblies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default YSBAssemblyManager;
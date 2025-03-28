import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchWorkOrders } from '../../api/workOrderApi';
import { fetchAssemblyProcesses, createAssemblyProcess } from '../../api/assemblyApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// This component will manage YSB assemblies
const YSBAssembly = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [inProgressAssemblies, setInProgressAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const params = useParams();

  // Fetch work orders and assemblies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all work orders
        const allWorkOrders = await fetchWorkOrders();
        
        // Filter for YBS/RAP work orders
        const ybsWorkOrders = Array.isArray(allWorkOrders) 
          ? allWorkOrders.filter(order => 
              (order.product && (order.product.includes('YBS') || order.product.includes('RAP'))) || 
              (order.item_code && order.item_code.includes('5YB'))
            )
          : [];
        
        // Fetch pending assembly processes
        const allAssemblies = await fetchAssemblyProcesses();
        
        const pendingAssemblies = Array.isArray(allAssemblies)
          ? allAssemblies.filter(assembly => 
              assembly.status === 'pending' || assembly.status === 'in_progress'
            )
          : [];
        
        setWorkOrders(ybsWorkOrders);
        setInProgressAssemblies(pendingAssemblies);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load assembly data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle creating a new assembly
  const handleStartAssembly = async (workOrder) => {
    try {
      setLoading(true);
      toast.info('Creating assembly process...');
      
      const assemblyData = {
        work_order: workOrder.id,
        created_by: 'Current User',
        status: 'pending'
      };
      
      const newAssembly = await createAssemblyProcess(assemblyData);
      
      if (newAssembly && newAssembly.id) {
        toast.success(`Assembly process created!`);
        
        // Determine which HTML page to use based on the item_code
        const itemCode = workOrder.item_code || '5YB011057'; // Default if no item code
        
        // Navigate to the assembly view
        navigate(`${itemCode}?id=${newAssembly.id}`);
      } else {
        throw new Error('Failed to create assembly');
      }
    } catch (err) {
      console.error('Failed to create assembly process:', err);
      toast.error('Failed to create assembly process: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-bold text-gray-800">YBS Cable Assembly Manager</h2>
        <button 
          onClick={() => navigate('/assembly')} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          Back to All Assemblies
        </button>
      </motion.div>
      
      {/* Display in-progress assemblies if any */}
      {inProgressAssemblies.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4 text-blue-700">Continue In-Progress Assemblies</h3>
          
          {/* Table for in-progress assemblies */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inProgressAssemblies.map((assembly) => {
                  // Get the item code from the work order or use default
                  const assemblyItemCode = assembly.work_order?.item_code || '5YB011057';
                  
                  return (
                    <tr key={assembly.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assembly.serial_number || `Assembly #${assembly.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assembly.status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assembly.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assembly.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`${assemblyItemCode}?id=${assembly.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                        >
                          Continue
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      
      {/* Work orders section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold mb-4 text-green-700">Start New Assembly</h3>
        
        {workOrders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No YBS work orders available.</p>
            <button 
              onClick={() => navigate('/work-orders')} 
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Create Work Order
            </button>
          </div>
        ) : (
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
                {workOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.item_code}
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
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                        disabled={loading}
                      >
                        {loading ? 'Starting...' : 'Start Assembly'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default YSBAssembly;
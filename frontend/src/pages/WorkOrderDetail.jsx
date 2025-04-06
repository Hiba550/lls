import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchWorkOrderById, updateWorkOrder } from '../api/workOrderApi';

const WorkOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('');
  
  // Machine options based on PCB type (YBS and RSM)
  const machineOptions = {
    YBS: [
      { id: 'ybs-m1', name: 'YBS Machine 1' },
      { id: 'ybs-m2', name: 'YBS Machine 2' },
      { id: 'ybs-m3', name: 'YBS Machine 3' }
    ],
    RSM: [
      { id: 'rsm-m1', name: 'RSM Machine 1' },
      { id: 'rsm-m2', name: 'RSM Machine 2' },
      { id: 'rsm-m3', name: 'RSM Machine 3' }
    ]
  };

  // Fetch work order details
  useEffect(() => {
    const getWorkOrder = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkOrderById(id);
        setWorkOrder(data);
        if (data.machine_no) {
          // Find the machine ID based on the machine_no from backend
          const pcbType = getPcbType(data.item_code);
          const machines = pcbType ? machineOptions[pcbType] : [];
          const machine = machines.find(m => m.name === data.machine_no);
          if (machine) {
            setSelectedMachine(machine.id);
          } else {
            setSelectedMachine('');
          }
        }
      } catch (err) {
        console.error('Error fetching work order:', err);
        setError('Failed to load work order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getWorkOrder();
    }
  }, [id]);

  // Determine PCB type from item code
  const getPcbType = (itemCode) => {
    if (!itemCode) return null;
    if (itemCode.includes('5YB') || itemCode.includes('YBS')) return 'YBS';
    if (itemCode.includes('5RS') || itemCode.includes('RSM')) return 'RSM';
    return null;
  };

  // Handle machine assignment
  const handleAssignMachine = async () => {
    try {
      if (!selectedMachine) {
        toast.warning('Please select a machine first');
        return;
      }
      
      const pcbType = getPcbType(workOrder.item_code);
      const selectedMachineObj = machineOptions[pcbType]?.find(m => m.id === selectedMachine);
      
      await updateWorkOrder(id, { 
        ...workOrder,
        machine_id: selectedMachine,
        machine_no: selectedMachineObj ? selectedMachineObj.name : null
      });
      
      // Update the local state with the new machine
      setWorkOrder({
        ...workOrder,
        machine_no: selectedMachineObj ? selectedMachineObj.name : null
      });
      
      toast.success('Machine assigned successfully');
    } catch (err) {
      console.error('Error assigning machine:', err);
      toast.error('Failed to assign machine');
    }
  };

  // Update work order status
  const handleStatusChange = async (newStatus) => {
    try {
      // Match the status format used in the backend model
      const backendStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      
      await updateWorkOrder(id, { 
        ...workOrder,
        status: backendStatus
      });
      
      setWorkOrder({
        ...workOrder,
        status: backendStatus
      });
      
      toast.success(`Work order ${newStatus}`);
      
      if (newStatus === 'completed') {
        setTimeout(() => {
          navigate('/work-orders');
        }, 1500);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Work order not found</p>
        <Link to="/work-orders" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Work Orders
        </Link>
      </div>
    );
  }

  const pcbType = workOrder.pcb_type || getPcbType(workOrder.item_code);
  const availableMachines = pcbType ? machineOptions[pcbType] : [];

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Work Order: {workOrder.item_code}
          </h2>
          <div className="flex space-x-2">
            <Link
              to={`/work-orders/edit/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </Link>
            <button
              onClick={() => navigate('/work-orders')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Work Order Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Item Code:</span>
                <span className="font-medium">{workOrder.item_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{workOrder.product || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">PCB Type:</span>
                <span className="font-medium">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pcbType === 'YBS' 
                      ? 'bg-blue-100 text-blue-800' 
                      : pcbType === 'RSM' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pcbType || 'Unknown'}
                  </span>
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{workOrder.quantity || '0'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Target Date:</span>
                <span className="font-medium">
                  {workOrder.target_date ? new Date(workOrder.target_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{workOrder.customer_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Machine:</span>
                <span className="font-medium">{workOrder.machine_no || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Released By:</span>
                <span className="font-medium">{workOrder.released_by || 'System'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  workOrder.status === 'Completed' 
                    ? 'bg-green-100 text-green-800' 
                    : workOrder.status === 'In Progress' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {workOrder.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Machine Assignment</h3>
            <div className="space-y-4">
              <div className="mb-4">
                <label htmlFor="machine" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Machine
                </label>
                <div className="flex space-x-2">
                  <select
                    id="machine"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                  >
                    <option value="">-- Select Machine --</option>
                    {availableMachines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignMachine}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={!selectedMachine}
                  >
                    Assign
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-2">Update Status</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusChange('in progress')}
                    className={`px-4 py-2 ${
                      workOrder.status === 'In Progress'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    } rounded hover:bg-blue-700 hover:text-white`}
                    disabled={workOrder.status === 'Completed'}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className={`px-4 py-2 ${
                      workOrder.status === 'Completed'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    } rounded hover:bg-green-700 hover:text-white`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {workOrder.status === 'Completed' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-700">
                      This work order has been completed.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <h4 className="text-md font-medium mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {workOrder.description || 'No description available.'}
                </p>
              </div>
              
              {workOrder.remarks && (
  <div className="border-t pt-4 mt-4">
    <h4 className="text-md font-medium mb-2">Remarks</h4>
    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
      {workOrder.remarks}
    </p>
  </div>
)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetail;
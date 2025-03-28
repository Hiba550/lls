import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAssemblyProcesses } from '../api/assemblyApi';

const RSMAssemblyView = () => {
  const { itemCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assemblyData, setAssemblyData] = useState(null);
  
  // Get parameters from query string
  const searchParams = new URLSearchParams(location.search);
  const workOrderId = searchParams.get('workOrderId');
  const assemblyId = searchParams.get('assemblyId') || searchParams.get('id'); // Check for both assemblyId and id
  
  useEffect(() => {
    const fetchAssemblyData = async () => {
      try {
        // Validate that we have required parameters
        if (!itemCode) {
          setError('No item code provided');
          setLoading(false);
          return;
        }
        
        if (!assemblyId) {
          setError('No assembly ID provided');
          setLoading(false);
          return;
        }

        // Log information to help with debugging
        console.log('Loading RSM Assembly with:', {
          itemCode,
          assemblyId,
          workOrderId
        });
        
        // Fetch assembly data from API
        const assemblies = await fetchAssemblyProcesses();
        const assembly = assemblies.find(a => a.id.toString() === assemblyId.toString());
        
        if (!assembly) {
          throw new Error(`Assembly with ID ${assemblyId} not found`);
        }
        
        setAssemblyData(assembly);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load assembly data:', err);
        setError(`Failed to load assembly data: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchAssemblyData();
  }, [itemCode, assemblyId, workOrderId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3">Loading assembly details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/assembly/rsm')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Return to RSM PCB Inspection
        </button>
      </div>
    );
  }
  
  const redirectToMainDashboard = () => {
    navigate('/assembly');
    toast.info("Please use the main Assembly Dashboard to manage assemblies");
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">RSM Assembly Details</h2>
          <p className="text-gray-600">Item Code: {itemCode}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/assembly/rsm')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Back to RSM PCB Inspection
          </button>
          <button 
            onClick={redirectToMainDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Go to Assembly Dashboard
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-green-50 text-green-700 border border-green-100 rounded-md">
        <div className="flex items-center">
          <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>This page is for inspection only. To manage assemblies, please use the main Assembly Dashboard.</span>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Assembly Information</h3>
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-700">Serial Number:</td>
                  <td className="py-2">{assemblyData?.serial_number || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-700">Status:</td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      assemblyData?.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : assemblyData?.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assemblyData?.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-700">Created By:</td>
                  <td className="py-2">{assemblyData?.created_by || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-700">Created Date:</td>
                  <td className="py-2">{assemblyData?.created_at ? new Date(assemblyData.created_at).toLocaleString() : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-gray-700">Work Order:</td>
                  <td className="py-2">#{workOrderId || assemblyData?.work_order?.id || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Assembly Progress</h3>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${assemblyData?.status === 'completed' ? 100 : assemblyData?.status === 'in_progress' ? 50 : 10}%` }}
              ></div>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <div className="text-xl font-semibold">{assemblyData?.scanned_parts?.length || 0}</div>
                  <div className="text-xs text-gray-500">Parts Scanned</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <div className="text-xl font-semibold">{assemblyData?.current_sensor_index || 1}</div>
                  <div className="text-xs text-gray-500">Current Sensor</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <div className="text-xl font-semibold text-green-600">{assemblyData?.status === 'completed' ? '100%' : assemblyData?.status === 'in_progress' ? '50%' : '10%'}</div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scanned Parts</h3>
          <button 
            className="text-green-600 hover:text-green-800"
            onClick={redirectToMainDashboard}
          >
            Manage in Assembly Dashboard →
          </button>
        </div>
        
        {assemblyData?.scanned_parts?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assemblyData.scanned_parts.map((part, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.part_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.component_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.created_at ? new Date(part.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.operator || 'System'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No parts scanned yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default RSMAssemblyView;
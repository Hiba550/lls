import api from './apiClient';

// API Endpoints - Updated to match backend structure
const ENDPOINTS = {
  ASSEMBLIES: '/api/assemblies/',
  ASSEMBLY: (id) => `/api/assemblies/${id}/`,
  ASSEMBLY_PROCESSES: '/api/assembly-process/', // Fixed to have correct single '/api/' prefix
  ASSEMBLY_PROCESS: (id) => `/api/assembly-process/${id}/`, // Fixed to have correct single '/api/' prefix
  ASSEMBLY_COMPONENTS: (assemblyId) => `/api/assemblies/${assemblyId}/components/`,
  ASSEMBLY_VERIFICATION: (assemblyId) => `/api/assemblies/${assemblyId}/verify/`,
  ASSEMBLY_BY_TYPE: (type) => `/api/assemblies/type/${type}/`,
};

/**
 * Fetch all assemblies
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of assemblies
 */
export const fetchAssemblies = async (params = {}) => {
  return api.get(ENDPOINTS.ASSEMBLIES, params);
};

/**
 * Fetch a specific assembly by ID
 * @param {string|number} id - Assembly ID
 * @returns {Promise<Object>} - Assembly data
 */
export const fetchAssemblyById = async (id) => {
  return api.get(ENDPOINTS.ASSEMBLY(id));
};

/**
 * Create a new assembly
 * @param {Object} assemblyData - Assembly data
 * @returns {Promise<Object>} - Created assembly
 */
export const createAssembly = async (assemblyData) => {
  return api.post(ENDPOINTS.ASSEMBLIES, assemblyData);
};

/**
 * Update an assembly
 * @param {string|number} id - Assembly ID
 * @param {Object} assemblyData - Updated assembly data
 * @returns {Promise<Object>} - Updated assembly
 */
export const updateAssembly = async (id, assemblyData) => {
  return api.put(ENDPOINTS.ASSEMBLY(id), assemblyData);
};

/**
 * Delete an assembly
 * @param {string|number} id - Assembly ID
 * @returns {Promise<void>}
 */
export const deleteAssembly = async (id) => {
  return api.delete(ENDPOINTS.ASSEMBLY(id));
};

/**
 * Fetch assemblies by type (e.g., 'YBS', 'RSM')
 * @param {string} type - Assembly type
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of assemblies of specified type
 */
export const fetchAssembliesByType = async (type, params = {}) => {
  return api.get(ENDPOINTS.ASSEMBLY_BY_TYPE(type), params);
};

/**
 * Get components for a specific assembly
 * @param {string|number} assemblyId - Assembly ID
 * @returns {Promise<Array>} - List of assembly components
 */
export const fetchAssemblyComponents = async (assemblyId) => {
  return api.get(ENDPOINTS.ASSEMBLY_COMPONENTS(assemblyId));
};

/**
 * Verify an assembly (e.g., BOM check, QA verification)
 * @param {string|number} assemblyId - Assembly ID
 * @param {Object} verificationData - Verification data
 * @returns {Promise<Object>} - Verification result
 */
export const verifyAssembly = async (assemblyId, verificationData) => {
  return api.post(ENDPOINTS.ASSEMBLY_VERIFICATION(assemblyId), verificationData);
};

/**
 * Fetch all assembly processes
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of assembly processes
 */
export const fetchAssemblyProcesses = async (params = {}) => {
  try {
    return await api.get(ENDPOINTS.ASSEMBLY_PROCESSES, params);
  } catch (error) {
    // If the API fails, return an empty array to prevent UI errors
    if (error.response && error.response.status === 404) {
      console.warn('Assembly processes API endpoint not found. Returning empty array.');
      return [];
    }
    throw error;
  }
};

/**
 * Create a new assembly process
 * @param {Object} processData - Assembly process data
 * @returns {Promise<Object>} - Created assembly process
 */
export const createAssemblyProcess = async (processData) => {
  try {
    console.log('Creating assembly process with data:', processData);
    const response = await api.post(ENDPOINTS.ASSEMBLY_PROCESSES, processData);
    console.log('Assembly process created successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to create assembly process:', error);
    console.error('Request data was:', processData);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Update an assembly process
 * @param {string|number} id - Assembly process ID
 * @param {Object} processData - Updated process data
 * @returns {Promise<Object>} - Updated assembly process
 */
export const updateAssemblyProcess = async (id, processData) => {
  return api.put(ENDPOINTS.ASSEMBLY_PROCESS(id), processData);
};

/**
 * Update assembly process status
 * @param {string|number} id - Assembly process ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated assembly process
 */
export const updateAssemblyProcessStatus = async (id, status) => {
  return api.patch(ENDPOINTS.ASSEMBLY_PROCESS(id), { status });
};

/**
 * Save completed assembly data to the database
 * @param {Object} assemblyData - Completed assembly data
 * @returns {Promise<Object>} - Response from the database
 */
export const saveCompletedAssemblyToDatabase = async (assemblyData) => {
  try {
    const response = await fetch('/api/assembly-process/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assembly_id: assemblyData.id,
        barcode_number: assemblyData.barcodeNumber,
        assembly_type: assemblyData.assemblyType,
        completed_at: assemblyData.completedAt,
        components: assemblyData.scannedComponents.map(comp => ({
          component_name: comp.componentName,
          item_code: comp.itemCode,
          barcode: comp.barcode
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save completed assembly: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
};

/**
 * Fetch completed assemblies with optional filtering
 * Fetches from assembly-process endpoint with status=completed to include both RSM and YBS
 * @param {string} queryParams - URL query parameters for filtering
 * @returns {Promise<Object>} - List of completed assemblies
 */
export const getCompletedAssemblies = async (queryParams = '') => {
  try {
    // Build URL with status=completed filter and additional query params
    const statusParam = 'status=completed';
    const fullParams = queryParams ? `${statusParam}&${queryParams}` : statusParam;
    const url = `/api/assembly-process/?${fullParams}`;
    
    console.log('Fetching completed assemblies from:', url);
    const response = await api.get(url);
    
    // Log the response to help with debugging
    console.log('Completed assemblies response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching completed assemblies:', error);
    throw error;
  }
};

/**
 * Create a rework order
 * @param {Object} reworkData - Rework order data
 * @returns {Promise<Object>} - Created rework order
 */
export const createReworkOrder = async (reworkData) => {
  try {
    const response = await api.post('/api/assembly/rework/', reworkData);
    return response;
  } catch (error) {
    console.error('Error creating rework order:', error);
    throw error;
  }
};

/**
 * Complete an assembly
 * @param {string|number} id - Assembly ID
 * @param {Object} data - Completion data
 * @returns {Promise<Object>} - Completion result
 */
export const completeAssembly = async (id, data) => {
  try {
    const response = await api.post(`/api/assembly-process/${id}/complete/`, data);
    return response;
  } catch (error) {
    console.error('Error completing assembly:', error);
    throw error;
  }
};

/**
 * Get assembly component details
 * @param {string|number} assemblyId - Assembly ID
 * @returns {Promise<Array>} - List of component details
 */
export const getAssemblyComponentDetails = async (assemblyId) => {
  try {
    const response = await api.get(`/api/assembly-process/${assemblyId}/components/`);
    return response;
  } catch (error) {
    console.error('Error fetching component details:', error);
    throw error;
  }
};

/**
 * Create rework assembly process
 * @param {Object} reworkData - Data for rework assembly
 * @returns {Promise<Object>} - Created rework assembly process
 */
export const createReworkAssembly = async (reworkData) => {
  try {
    const response = await api.post('/api/assembly-process/rework/', {
      original_assembly_id: reworkData.originalAssemblyId,
      barcode_number: reworkData.barcodeNumber, // Use original barcode
      components_to_rework: reworkData.componentsToRework,
      rework_notes: reworkData.reworkNotes,
      reworked_by: reworkData.reworkedBy || 'Current User'
    });
    return response;
  } catch (error) {
    console.error('Error creating rework assembly:', error);
    throw error;
  }
};

/**
 * Update component in an assembly
 * @param {string|number} assemblyId - Assembly ID
 * @param {string|number} componentId - Component ID to update
 * @param {Object} componentData - Updated component data
 * @returns {Promise<Object>} - Updated component
 */
export const updateAssemblyComponent = async (assemblyId, componentId, componentData) => {
  try {
    const response = await api.patch(
      `/api/assembly-process/${assemblyId}/components/${componentId}/`, 
      componentData
    );
    return response;
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
};

/**
 * Mark component as changed in rework
 * @param {string|number} assemblyId - Assembly ID
 * @param {string|number} componentId - Component ID
 * @param {Object} data - Change data with new barcode
 * @returns {Promise<Object>} - Updated component
 */
export const markComponentChanged = async (assemblyId, componentId, data) => {
  try {
    const response = await api.post(
      `/api/assembly-process/${assemblyId}/components/${componentId}/change/`, 
      {
        new_barcode: data.newBarcode,
        change_reason: data.reason,
        changed_by: data.changedBy || 'Current User',
        previous_barcode: data.previousBarcode
      }
    );
    return response;
  } catch (error) {
    console.error('Error marking component as changed:', error);
    throw error;
  }
};

// Export all functions
const assemblyApi = {
  fetchAssemblies,
  fetchAssemblyById,
  createAssembly,
  updateAssembly,
  deleteAssembly,
  fetchAssembliesByType,
  fetchAssemblyComponents,
  verifyAssembly,
  fetchAssemblyProcesses,
  createAssemblyProcess,
  updateAssemblyProcess,
  updateAssemblyProcessStatus,
  saveCompletedAssemblyToDatabase,
  getCompletedAssemblies,
  createReworkOrder,
  completeAssembly,
  getAssemblyComponentDetails,
  createReworkAssembly,
  updateAssemblyComponent,
  markComponentChanged,
};

export default assemblyApi;
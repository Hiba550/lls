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
 * Fetch assemblies by type (e.g., 'YSB', 'RSM')
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
    return await api.post(ENDPOINTS.ASSEMBLY_PROCESSES, processData);
  } catch (error) {
    // Error handling logic...
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

// Export all functions
export default {
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
};
import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('authToken');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Get CSRF token from cookie if available
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
      
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh for 401 errors (if refresh token exists)
    if (error.response?.status === 401 && !originalRequest._retry && localStorage.getItem('refreshToken')) {
      originalRequest._retry = true;
      
      try {
        // Try to get a new token using the refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
        
        // If successful, update the stored token
        if (response.data.access) {
          localStorage.setItem('authToken', response.data.access);
          
          // Update the failed request's Authorization header and retry it
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        // Only show this message once (not for every failed request)
        toast.error('Your session has expired. Please log in again.', {
          toastId: 'session-expired',
        });
        
        window.location.href = '/login';
      }
    }
    
    // Handle various error types
    if (error.response) {
      // Server responded with non-2xx status
      console.error(`API Error (${error.response.status}):`, error.response.data);
      
      // Handle specific status codes
      switch (error.response.status) {
        case 400: // Bad request
          // Usually validation errors
          return Promise.reject({
            ...error, 
            friendlyMessage: 'The request was invalid. Please check your input.'
          });
        case 403: // Forbidden
          return Promise.reject({
            ...error,
            friendlyMessage: 'You do not have permission to perform this action.'
          });
        case 404: // Not found
          return Promise.reject({
            ...error,
            friendlyMessage: 'The requested resource was not found.'
          });
        case 500: // Server error
        case 502: // Bad gateway
        case 503: // Service unavailable
          return Promise.reject({
            ...error,
            friendlyMessage: 'We are experiencing server issues. Please try again later.'
          });
        default:
          return Promise.reject(error);
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('Network Error:', error.request);
      return Promise.reject({
        ...error,
        friendlyMessage: 'Unable to connect to the server. Please check your internet connection.'
      });
    } else {
      // Error in setting up the request
      console.error('Request Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Wrapper methods for API calls
const apiClient = {
  /**
   * Perform GET request
   * @param {string} url - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async get(url, params = {}, options = {}) {
    try {
      return await api.get(url, { params, ...options });
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Perform POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async post(url, data = {}, options = {}) {
    try {
      return await api.post(url, data, options);
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Perform PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async put(url, data = {}, options = {}) {
    try {
      return await api.put(url, data, options);
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Perform PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async patch(url, data = {}, options = {}) {
    try {
      return await api.patch(url, data, options);
    } catch (error) {
      console.error(`PATCH ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Perform DELETE request
   * @param {string} url - API endpoint
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async delete(url, options = {}) {
    try {
      return await api.delete(url, options);
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Upload file(s) using multipart/form-data
   * @param {string} url - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {Function} onProgress - Progress callback
   * @param {Object} options - Additional axios options
   * @returns {Promise} - API response
   */
  async upload(url, formData, onProgress = null, options = {}) {
    try {
      return await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined,
        ...options
      });
    } catch (error) {
      console.error(`UPLOAD to ${url} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Download a file
   * @param {string} url - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Blob response
   */
  async download(url, params = {}, options = {}) {
    try {
      const response = await api.get(url, {
        params,
        responseType: 'blob',
        ...options
      });
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers?.['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      console.error(`DOWNLOAD from ${url} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Set or update the auth token 
   * @param {string} token - JWT or other auth token
   */
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export default apiClient;
/**
 * Dynamic API Configuration
 * 
 * This utility automatically detects the API base URL based on the current environment,
 * making the app work universally across different domains and ports.
 */

// Function to detect the API base URL dynamically
const getApiBaseUrl = () => {
  // In development with Vite proxy, use relative URLs
  if (import.meta.env.DEV && import.meta.env.VITE_USE_PROXY !== 'false') {
    return '/api';
  }
  
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect based on current location
  const { protocol, hostname, port } = window.location;
  
  // Default backend port is typically 8000 for Django
  const backendPort = import.meta.env.VITE_BACKEND_PORT || '8000';
  
  // If we're on the same host as the backend (e.g., same machine), use it
  // Otherwise, fall back to the proxy or relative URLs
  if (port === backendPort) {
    // We're already on the backend port
    return `${protocol}//${hostname}:${port}/api`;
  } else {
    // We're on a different port (frontend), try to construct backend URL
    const backendUrl = `${protocol}//${hostname}:${backendPort}/api`;
    
    // Test if backend is accessible (this would normally be done at app startup)
    return backendUrl;
  }
};

// Global API configuration
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
};

// Export the base URL for direct use
export const API_BASE_URL = API_CONFIG.baseURL;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure base URL doesn't end with slash and endpoint doesn't start with slash
  const baseUrl = API_CONFIG.baseURL.endsWith('/') 
    ? API_CONFIG.baseURL.slice(0, -1) 
    : API_CONFIG.baseURL;
    
  return `${baseUrl}/${cleanEndpoint}`;
};

// Environment detection
export const isProduction = () => import.meta.env.PROD;
export const isDevelopment = () => import.meta.env.DEV;

// Debug function to log current configuration
export const logApiConfig = () => {
  console.log('🔧 API Configuration:', {
    baseURL: API_CONFIG.baseURL,
    environment: isDevelopment() ? 'development' : 'production',
    windowLocation: window.location.href,
    viteDev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_BASE_URL,
    viteBackendPort: import.meta.env.VITE_BACKEND_PORT,
  });
};

// Test function to check API connectivity
export const testApiConnectivity = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/work-order/`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    if (response.ok) {
      console.log('✅ API connectivity test passed');
      return true;
    } else {
      console.warn('⚠️ API connectivity test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connectivity test error:', error);
    return false;
  }
};

export default API_CONFIG;

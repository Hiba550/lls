// Determine the base API URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    // Return production API URL
    return '/api';
  }
  
  // For development, check if proxy is configured
  // If using Vite's proxy, just use relative path '/api'
  // Otherwise, use full URL for direct connection to backend
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// In both API service files:
import { API_BASE_URL } from '../config/apiConfig';

// And replace the API_URL constant with:
const API_URL = API_BASE_URL;
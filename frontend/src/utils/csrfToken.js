// Utility to get CSRF token from cookies
export const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Add this to src/index.js or App.js (before rendering the app)
import axios from 'axios';

// Initialize CSRF token by making a GET request to the Django backend
const initializeCsrf = async () => {
  try {
    // Make a GET request to an endpoint that sets the CSRF cookie
    await axios.get('/api/csrf/', { withCredentials: true });
    console.log('CSRF token initialized');
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
};

// Call this function when the app initializes
initializeCsrf();
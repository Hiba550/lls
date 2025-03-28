import axios from 'axios';

export const testBackendConnection = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/work-order/test-connection/');
    console.log('Connection test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Connection test failed:', error);
    return { status: 'error', message: error.message };
  }
};
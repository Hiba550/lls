import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'; // Import CSS for redundancy

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <AppRoutes />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            theme="colored"
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
          />
        </div>
        
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
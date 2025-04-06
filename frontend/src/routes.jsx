import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Main pages
import Assembly from './pages/Assembly';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WorkOrders from './pages/WorkOrders';
import WorkOrderForm from './pages/WorkOrderForm';
import WorkOrderManagement from './pages/WorkOrderManagement';
import UserProfile from './pages/UserProfile'; // Add this import

// Assembly pages
import YBSAssemblyManager from './pages/YBSAssemblyManager';
import YBSAssemblyView from './components/YBSAssemblyView';
import RSMAssemblyManager from './pages/RSMAssemblyManager';
import RSMAssemblyView from './pages/RSMAssemblyView';

// Loading spinner for suspense fallback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="loader w-12 h-12"></div>
  </div>
);

// Protected Route component that requires authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to the login page but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

// Component to handle iframe with query parameters
function YBSAssemblyIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [iframeUrl, setIframeUrl] = useState('');
  
  useEffect(() => {
    // Build URL with query parameters
    setIframeUrl(`/src/pages/YBS/5YB011057.html${location.search}`);
  }, [location.search]);

  return (
    <div className="relative h-full">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-neutral-50 dark:bg-neutral-900">
          <div className="loader-container">
            <div className="loader"></div>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading YBS Assembly Interface...</p>
          </div>
        </div>
      )}
      
      {iframeUrl && (
        <iframe 
          src={iframeUrl}
          className="w-full h-[calc(100vh-var(--header-height))] border-0"
          onLoad={() => setIsLoading(false)}
          title="YBS Assembly Process"
        />
      )}
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Main Layout with Sidebar and Navbar */}
        <Route path="/" element={<Layout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Assembly Routes */}
          <Route path="assembly">
            <Route index element={<Assembly />} />
            <Route path="YBS">
              <Route index element={<YBSAssemblyManager />} />
              <Route path=":itemCode" element={<YBSAssemblyView />} />
            </Route>
            <Route path="rsm">
              <Route index element={<RSMAssemblyManager />} />
              <Route path=":itemCode" element={<RSMAssemblyView />} />
            </Route>
          </Route>
          
          {/* Inventory Routes */}
          <Route path="inventory">
            <Route index element={<Inventory />} />
            <Route path="parts" element={<Inventory type="parts" />} />
            <Route path="components" element={<Inventory type="components" />} />
            <Route path="stock" element={<Inventory type="stock" />} />
          </Route>
          
          {/* Work Orders Routes */}
          <Route path="work-orders">
            <Route index element={<WorkOrders />} />
            <Route path="create" element={<WorkOrderForm />} />
            <Route path="edit/:id" element={<WorkOrderForm />} />
            <Route path="manage" element={<WorkOrderManagement />} />
          </Route>
          
          {/* Reports Routes */}
          <Route path="reports">
            <Route index element={<Reports />} />
            <Route path="production" element={<Reports type="production" />} />
            <Route path="quality" element={<Reports type="quality" />} />
            <Route path="efficiency" element={<Reports type="efficiency" />} />
          </Route>
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
          
          {/* Search Results */}
          <Route path="search" element={<WorkOrders isSearchResults={true} />} />

          {/* User Profile */}
          <Route path="profile" element={<UserProfile />} />
          
          {/* Fallback for unmatched routes in the main layout */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      
      {/* Redirect legacy paths */}
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      
      {/* Global fallback for completely unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
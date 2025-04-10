import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminRoute component
 * Protects routes that should only be accessible by administrators
 * Redirects to unauthorized page if user is not an admin
 */
const AdminRoute = ({ children }) => {
  const { hasRole, isAuthenticated, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Verifying admin access...</span>
      </div>
    );
  }

  // Redirect to unauthorized page if not authenticated or not an admin
  if (!isAuthenticated || !hasRole('admin')) {
    console.warn('Access denied: User does not have admin privileges');
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authenticated and has admin role, render the protected content
  return children;
};

export default AdminRoute;
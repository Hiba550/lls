import React from 'react';
import { motion } from 'framer-motion';
import UserManagementComponent from '../components/UserManagement';

const UserManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management System
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage users, roles, and permissions for the assembly management system.
              </p>
            </div>
            
            <div className="p-6">
              <UserManagementComponent />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserManagement;
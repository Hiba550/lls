import React from 'react';
import { Link } from 'react-router-dom';

const AssemblyList = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Assembly Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* YBS Assembly Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-blue-600 px-4 py-3">
            <h2 className="text-white text-lg font-semibold">YBS Assembly</h2>
          </div>
          <div className="p-5">
            <p className="text-gray-600 mb-4">
              Manage and track YBS (Yarn Break System) circuit board assembly processes.
            </p>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sensor verification</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Component tracking</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Interactive assembly visualization</span>
            </div>
            <Link
              to="/assembly/ybs"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Open YBS Assembly
            </Link>
          </div>
        </div>

        {/* RSM Assembly Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-green-600 px-4 py-3">
            <h2 className="text-white text-lg font-semibold">RSM Assembly</h2>
          </div>
          <div className="p-5">
            <p className="text-gray-600 mb-4">
              Manage and track RSM (RAP Sensor Module) circuit board assembly processes.
            </p>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Component verification</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Board-to-board connections</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Interactive assembly visualization</span>
            </div>
            <Link
              to="/assembly/rsm"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Open RSM Assembly
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblyList;
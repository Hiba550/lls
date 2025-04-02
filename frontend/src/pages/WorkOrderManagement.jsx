import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Work Order related components
import WorkOrders from './WorkOrders';
import WorkOrderForm from './WorkOrderForm';
import WorkOrderDetail from './WorkOrderDetail';
import YSBAssemblyManager from './YSBAssemblyManager';
import RSMAssemblyManager from './RSMAssemblyManager';

const WorkOrderManagement = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
  <Route path="/" element={<WorkOrders />} />
  <Route path="/create" element={<WorkOrderForm />} />
  <Route path="/:id" element={<WorkOrderDetail />} />
  <Route path="/:id/edit" element={<WorkOrderForm />} />
  <Route path="/ysb/*" element={<YSBAssemblyManager />} />
  <Route path="/rsm/*" element={<RSMAssemblyManager />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
    </div>
  );
};

export default WorkOrderManagement;
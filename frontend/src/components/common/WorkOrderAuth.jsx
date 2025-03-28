import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchWorkOrderById } from '../../api/workOrderApi';

const WorkOrderAuth = ({ 
  children, 
  workOrderId, 
  pcbType,
  pcbItemCode,
  redirectPath,
  onValidated 
}) => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);

  useEffect(() => {
    const validateWorkOrder = async () => {
      if (!workOrderId) {
        toast.error('No work order ID provided');
        navigate(redirectPath || '/work-orders');
        return;
      }

      try {
        setIsValidating(true);
        const workOrderData = await fetchWorkOrderById(workOrderId);
        
        if (!workOrderData) {
          toast.error(`Work order #${workOrderId} not found`);
          navigate(redirectPath || '/work-orders');
          return;
        }

        // Check if work order is valid for this PCB type
        if (pcbType && workOrderData.pcb_type !== pcbType) {
          toast.error(`Work order #${workOrderId} is for ${workOrderData.pcb_type}, not ${pcbType}`);
          navigate(redirectPath || '/work-orders');
          return;
        }

        // Check if work order is for this specific PCB item code
        if (pcbItemCode && workOrderData.pcb_item_code !== pcbItemCode) {
          toast.error(`Work order #${workOrderId} is not assigned to this PCB item code`);
          navigate(redirectPath || '/work-orders');
          return;
        }

        // Check if work order is still in progress
        if (workOrderData.status === 'Completed' || workOrderData.status === 'Cancelled') {
          toast.warning(`Work order #${workOrderId} is already ${workOrderData.status.toLowerCase()}`);
          navigate(redirectPath || '/work-orders');
          return;
        }

        // All checks passed
        setWorkOrder(workOrderData);
        setIsAuthorized(true);
        
        // Call the onValidated callback if provided
        if (onValidated) {
          onValidated(workOrderData);
        }
      } catch (error) {
        console.error('Error validating work order:', error);
        toast.error('Failed to validate work order');
        navigate(redirectPath || '/work-orders');
      } finally {
        setIsValidating(false);
      }
    };

    validateWorkOrder();
  }, [workOrderId, pcbType, pcbItemCode, redirectPath, navigate, onValidated]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Validating work order...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Navigate is handled in the effect
  }

  // Inject the validated work order data into children
  return React.cloneElement(children, { workOrder });
};

export default WorkOrderAuth;
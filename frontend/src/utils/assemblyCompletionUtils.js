// Enhanced Assembly Completion Utility
// Handles work order quantity management, barcode generation, and database logging

/**
 * Generate consistent 11-digit barcode with proper format
 * RSM: positions 5-6 = "12"
 * YBS: positions 5-6 = "23" 
 */
function generateAssemblyBarcode(assemblyType = 'RSM') {
    let barcodeDigits = [];
    
    // Generate first 4 random digits
    for (let i = 0; i < 4; i++) {
        barcodeDigits.push(Math.floor(Math.random() * 10));
    }
    
    // Add fixed digits at positions 5 and 6 based on assembly type
    if (assemblyType === 'RSM') {
        barcodeDigits.push(1); // 5th position
        barcodeDigits.push(2); // 6th position
    } else { // YBS
        barcodeDigits.push(2); // 5th position
        barcodeDigits.push(3); // 6th position
    }
    
    // Generate remaining 5 random digits
    for (let i = 0; i < 5; i++) {
        barcodeDigits.push(Math.floor(Math.random() * 10));
    }
    
    return barcodeDigits.join('');
}

/**
 * Enhanced completion handler with proper quantity management
 */
async function completeAssemblyWithQuantityManagement(assemblyData) {
    try {
        const workOrderId = getUrlParameter("workOrderId");
        const assemblyId = assemblyData.assemblyId;
        
        console.log('Starting assembly completion:', { assemblyId, workOrderId, assemblyData });
        
        // 1. Save assembly completion to database
        const dbSaveResult = await saveAssemblyToDatabase(assemblyData);
        
        // 2. Handle work order quantity management
        const quantityResult = handleWorkOrderQuantity(workOrderId, assemblyData);
        
        // 3. Store in localStorage for immediate UI updates
        storeCompletedAssemblyLocally(assemblyData);
        
        // 4. Show completion screen or next assembly screen
        if (quantityResult.hasNextAssembly) {
            showNextAssemblyScreen(quantityResult.workOrder);
        } else {
            showFinalCompletionScreen(assemblyData);
        }
        
        return {
            success: true,
            dbSaved: dbSaveResult.success,
            nextAssembly: quantityResult.hasNextAssembly,
            workOrder: quantityResult.workOrder
        };
        
    } catch (error) {
        console.error('Assembly completion failed:', error);
        throw error;
    }
}

/**
 * Handle work order quantity logic
 */
function handleWorkOrderQuantity(workOrderId, assemblyData) {
    try {
        // Get pending work orders
        const pendingWorkOrders = JSON.parse(localStorage.getItem('pendingWorkOrders') || '[]');
        const completedWorkOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
        
        console.log('Managing quantity for work order:', workOrderId);
        console.log('Pending work orders:', pendingWorkOrders);
        
        // Find the work order
        const workOrderIndex = pendingWorkOrders.findIndex(order => 
            order.id.toString() === workOrderId?.toString() ||
            order.id.toString() === assemblyData.assemblyId?.toString()
        );
        
        if (workOrderIndex === -1) {
            console.warn('Work order not found in pending list:', workOrderId);
            return { hasNextAssembly: false, workOrder: null };
        }
        
        const workOrder = pendingWorkOrders[workOrderIndex];
        console.log('Found work order:', workOrder);
        
        // Initialize completed quantity if not exists
        if (!workOrder.completed_quantity) {
            workOrder.completed_quantity = 0;
        }
        
        // Increment completed quantity
        workOrder.completed_quantity += 1;
        workOrder.remaining_quantity = workOrder.quantity - workOrder.completed_quantity;
        
        console.log(`Work order ${workOrder.id}: ${workOrder.completed_quantity}/${workOrder.quantity} completed`);
        
        // Check if work order is fully completed
        if (workOrder.completed_quantity >= workOrder.quantity) {
            // Remove from pending and add to completed
            const completedWorkOrder = pendingWorkOrders.splice(workOrderIndex, 1)[0];
            completedWorkOrder.status = 'Completed';
            completedWorkOrder.completed_at = new Date().toISOString();
            
            // Add to completed orders
            completedWorkOrders.push(completedWorkOrder);
            
            console.log(`Work order ${workOrder.id} fully completed`);
            
            // Save changes
            localStorage.setItem('pendingWorkOrders', JSON.stringify(pendingWorkOrders));
            localStorage.setItem('assemblyCompletedOrders', JSON.stringify(completedWorkOrders));
            
            return { hasNextAssembly: false, workOrder: completedWorkOrder };
        } else {
            // Still has remaining quantity - update status and save
            workOrder.status = 'In Progress';
            
            // Save changes
            localStorage.setItem('pendingWorkOrders', JSON.stringify(pendingWorkOrders));
            
            console.log(`Work order ${workOrder.id} has ${workOrder.remaining_quantity} remaining assemblies`);
            
            return { hasNextAssembly: true, workOrder: workOrder };
        }
        
    } catch (error) {
        console.error('Error handling work order quantity:', error);
        return { hasNextAssembly: false, workOrder: null };
    }
}

/**
 * Save assembly completion to database with all component details
 */
async function saveAssemblyToDatabase(assemblyData) {
    try {
        console.log('Saving assembly to database:', assemblyData);
        
        // Prepare database payload
        const dbPayload = {
            assembly_id: assemblyData.assemblyId,
            work_order_id: getUrlParameter("workOrderId"),
            barcode_number: assemblyData.barcodeNumber,
            assembly_type: assemblyData.assemblyType,
            status: 'completed',
            completed_at: assemblyData.completedAt,
            operator: 'Current User',
            components: assemblyData.scannedComponents,
            metadata: {
                scanned_components: assemblyData.scannedComponents,
                total_components: assemblyData.scannedComponents.length,
                assembly_duration: assemblyData.assemblyDuration || 0,
                completion_timestamp: new Date().toISOString()
            }
        };
        
        // Save to assembly-process endpoint
        const assemblyResponse = await fetch(`/api/assembly-process/${assemblyData.assemblyId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbPayload)
        });
        
        if (!assemblyResponse.ok) {
            throw new Error(`Assembly update failed: ${assemblyResponse.status}`);
        }
        
        // Also create a completed assembly record
        const completedResponse = await fetch('/api/assembly-process/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbPayload)
        }).catch(error => {
            console.warn('Completed assembly record creation failed:', error);
            return { ok: false };
        });
        
        console.log('Assembly saved to database successfully');
        
        return {
            success: true,
            assemblyUpdated: assemblyResponse.ok,
            completedRecordCreated: completedResponse.ok
        };
        
    } catch (error) {
        console.error('Database save failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Store completed assembly in localStorage
 */
function storeCompletedAssemblyLocally(assemblyData) {
    try {
        // Get existing completed orders
        const completedOrders = JSON.parse(localStorage.getItem('completedWorkOrders') || '[]');
        const assemblyCompletedOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
        
        // Create completed assembly record
        const completedAssembly = {
            id: assemblyData.assemblyId,
            work_order_id: getUrlParameter("workOrderId"),
            status: 'Completed',
            product: `${assemblyData.assemblyType} Assembly`,
            item_code: assemblyData.itemCode || window.location.pathname.split('/').pop().replace('.html', ''),
            serial_number: assemblyData.barcodeNumber,
            barcode_number: assemblyData.barcodeNumber,
            pcb_type: assemblyData.assemblyType,
            completed_at: assemblyData.completedAt,
            hasCompletedAssembly: true,
            scannedComponents: assemblyData.scannedComponents,
            componentMapping: assemblyData.scannedComponents.reduce((map, comp) => {
                map[comp.componentName] = comp.barcode;
                return map;
            }, {}),
            reworked: assemblyData.reworked || false,
            reworkedComponents: assemblyData.reworkedComponents || []
        };
        
        // Add to both storage locations
        completedOrders.push(completedAssembly);
        assemblyCompletedOrders.push(completedAssembly);
        
        // Save back to localStorage
        localStorage.setItem('completedWorkOrders', JSON.stringify(completedOrders));
        localStorage.setItem('assemblyCompletedOrders', JSON.stringify(assemblyCompletedOrders));
        
        console.log('Assembly stored locally successfully:', completedAssembly);
        
    } catch (error) {
        console.error('Local storage failed:', error);
    }
}

/**
 * Show next assembly screen for multi-quantity work orders
 */
function showNextAssemblyScreen(workOrder) {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
            <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
                <h2 style="color: #0369a1; margin-bottom: 1rem; font-size: 1.5rem;">✅ Assembly Complete!</h2>
                <p style="color: #075985; margin-bottom: 1rem;">
                    Assembly completed successfully. Starting next assembly...
                </p>
                <div style="background: white; padding: 1rem; border-radius: 0.375rem; margin: 1rem 0;">
                    <strong>Progress: ${workOrder.completed_quantity}/${workOrder.quantity} assemblies completed</strong>
                </div>
            </div>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: #92400e; margin-bottom: 1rem;">Next Assembly Ready</h3>
                <p style="color: #78350f; margin-bottom: 1rem;">
                    ${workOrder.remaining_quantity} more assemblies remaining for this work order.
                </p>
                <button onclick="startNextAssembly()" 
                        style="background: #059669; color: white; padding: 0.75rem 1.5rem; border: none; 
                               border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin: 0.5rem;">
                    Start Next Assembly
                </button>
                <button onclick="window.location.href='/assembly'" 
                        style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; 
                               border-radius: 0.375rem; cursor: pointer; margin: 0.5rem;">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
}

/**
 * Start next assembly in sequence
 */
function startNextAssembly() {
    // Clear any cached assembly data
    const assemblyId = getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;
    if (assemblyId) {
        localStorage.removeItem(`assembly_${assemblyId}`);
    }
    
    // Reload the page to start fresh
    window.location.reload();
}

/**
 * Show final completion screen when all assemblies are done
 */
function showFinalCompletionScreen(assemblyData) {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    
    // Generate component details
    const componentDetails = assemblyData.scannedComponents.map(comp => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 500;">${comp.componentName}:</span>
            <span style="font-family: monospace; color: #059669;">${comp.barcode}</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; max-width: 800px; margin: 0 auto;">
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
                <h2 style="color: #15803d; margin-bottom: 1rem; font-size: 2rem;">🎉 Work Order Complete!</h2>
                <p style="color: #166534; margin-bottom: 1rem; font-size: 1.1rem;">
                    All assemblies have been completed successfully.
                </p>
            </div>
            
            <div style="background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem; text-align: left;">
                <h3 style="margin-bottom: 1rem; color: #374151;">Assembly Barcode</h3>
                <div style="background: #f9fafb; padding: 1rem; border-radius: 0.375rem; text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #059669; margin-bottom: 0.5rem;">
                        ${assemblyData.barcodeNumber}
                    </div>
                    <canvas id="assemblyBarcode" style="margin: 0.5rem 0;"></canvas>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #374151;">Scanned Components:</h4>
                    <div style="background: #f9fafb; border-radius: 0.375rem; overflow: hidden;">
                        ${componentDetails}
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="window.location.href='/assembly'" 
                        style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; 
                               border-radius: 0.375rem; cursor: pointer; font-weight: 600;">
                    Return to Assembly Dashboard
                </button>
                <button onclick="window.location.href='/work-orders'" 
                        style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; 
                               border-radius: 0.375rem; cursor: pointer;">
                    View Work Orders
                </button>
            </div>
        </div>
    `;
    
    // Render barcode if JsBarcode is available
    if (window.JsBarcode) {
        setTimeout(() => {
            const canvas = document.getElementById('assemblyBarcode');
            if (canvas) {
                JsBarcode(canvas, assemblyData.barcodeNumber, {
                    format: 'CODE128',
                    displayValue: true,
                    width: 2,
                    height: 50,
                    margin: 10
                });
            }
        }, 100);
    }
}

// Make functions globally available
window.completeAssemblyWithQuantityManagement = completeAssemblyWithQuantityManagement;
window.generateAssemblyBarcode = generateAssemblyBarcode;
window.startNextAssembly = startNextAssembly;

/**
 * RSM Backend Operations Manager
 * Handles all backend operations for RSM assembly including:
 * - Assembly completion and status updates
 * - Quantity management and work order updates
 * - Barcode generation and storage
 * - Rework scenario handling
 * - Data persistence and API communication
 * 
 * This module separates backend logic from frontend UI logic
 * Version: 1.0
 */

class RSMBackendManager {
    constructor(apiUrl = '/api') {
        this.API_URL = apiUrl;
        this.apiConnected = false;
        this.sessionId = this.getSessionId();
    }

    /**
     * Complete the assembly process - main backend operation
     */
    async completeAssembly(assemblyData) {
        try {
            console.log('🎯 Backend: Starting assembly completion...', assemblyData);
            
            // Validate required data
            if (!this.validateAssemblyData(assemblyData)) {
                throw new Error('Invalid assembly data provided');
            }
            
            const { assemblyId, componentMapping, currentRSMType, workOrderId, config } = assemblyData;
            
            // Generate assembly barcode
            const assemblyBarcode = await this.generateAssemblyBarcode(currentRSMType, assemblyId);
            console.log(`📊 Generated assembly barcode: ${assemblyBarcode}`);
            
            // Prepare component data
            const scannedComponents = this.prepareComponentData(componentMapping);
              // Update assembly status in database
            await this.updateAssemblyStatus(assemblyId, assemblyBarcode, scannedComponents, currentRSMType);
            
            // Send completion data to work order API (this is the key missing piece!)
            await this.completeWorkOrderAssembly(workOrderId, assemblyBarcode, scannedComponents);
            
            // Handle work order quantity management
            const workOrderResult = await this.handleWorkOrderCompletion(workOrderId);
            
            // Prepare completion data structure
            const completionData = this.prepareCompletionData({
                assemblyId,
                currentRSMType,
                config,
                assemblyBarcode,
                scannedComponents,
                workOrderId
            });
            
            // Store completed assembly data
            await this.storeCompletedAssembly(completionData);
            
            // Move from pending to completed
            this.moveWorkOrderToCompleted(assemblyId);
            
            // Log completion action
            this.logAssemblyAction('assembly_completed', {
                assemblyId,
                workOrderId,
                rsmType: currentRSMType,
                barcode: assemblyBarcode,
                componentCount: scannedComponents.length
            });
            
            console.log('✅ Backend: Assembly completed successfully!');
            
            return {
                success: true,
                assemblyBarcode,
                completionData,
                workOrderResult,
                message: 'Assembly completed successfully'
            };
            
        } catch (error) {
            console.error('❌ Backend: Error completing assembly:', error);
            
            this.logAssemblyAction('assembly_completion_error', {
                error: error.message,
                assemblyId: assemblyData.assemblyId
            });
            
            return {
                success: false,
                error: error.message,
                message: `Error completing assembly: ${error.message}`
            };
        }
    }

    /**
     * Validate assembly data before processing
     */
    validateAssemblyData(assemblyData) {
        const required = ['assemblyId', 'componentMapping', 'currentRSMType'];
        
        for (const field of required) {
            if (!assemblyData[field]) {
                console.error(`❌ Missing required field: ${field}`);
                return false;
            }
        }
        
        // Validate that all components are scanned
        const allScanned = Object.values(assemblyData.componentMapping).every(comp => comp.scanned);
        if (!allScanned) {
            console.error('❌ Not all components are scanned');
            return false;
        }
        
        return true;
    }    /**
     * Generate assembly barcode based on RSM type and assembly ID
     */
    async generateAssemblyBarcode(rsmType, assemblyId) {
        // RSM barcodes should be 11 digits with the RSM code in positions 5-6
        // Format: NNNN[RSM_CODE]NNNNN (where N = random digits)
        
        // Generate 4 random digits for the start
        const startDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // Fetch the RSM code from item master
        let rsmCode = '12'; // Default fallback
        
        try {
            const itemMasterResponse = await fetch(`${this.API_URL}/item-master/?search=${rsmType}`);
            if (itemMasterResponse.ok) {
                const itemMasterData = await itemMasterResponse.json();
                if (itemMasterData && itemMasterData.length > 0 && itemMasterData[0].code) {
                    rsmCode = itemMasterData[0].code;
                    console.log(`🏷️  Backend: Fetched RSM code "${rsmCode}" for ${rsmType} from item master`);
                } else {
                    console.warn(`⚠️  Backend: No code found in item master for ${rsmType}, using default: ${rsmCode}`);
                }
            } else {
                console.warn(`⚠️  Backend: Failed to fetch item master for ${rsmType}, using default code: ${rsmCode}`);
            }
        } catch (error) {
            console.error(`❌ Backend: Error fetching RSM code for ${rsmType}:`, error);
            console.log(`🏷️  Backend: Using default RSM code: ${rsmCode}`);
        }
        
        // Ensure the code is exactly 2 digits for barcode positions 5-6
        if (rsmCode.length === 1) {
            rsmCode = '0' + rsmCode; // Pad single digit with leading zero
        } else if (rsmCode.length > 2) {
            rsmCode = rsmCode.substring(0, 2); // Take first 2 characters
        }
        
        // Generate 5 random digits for the end
        const endDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        
        // Combine to create 11-digit RSM barcode: NNNN[RSM_CODE]NNNNN
        const barcode = `${startDigits}${rsmCode}${endDigits}`;
        
        console.log(`🏷️  Backend: Generated RSM barcode: ${barcode} (Format: NNNN${rsmCode}NNNNN)`);
        
        return barcode;
    }

    /**
     * Prepare component data for storage and API calls
     */
    prepareComponentData(componentMapping) {
        return Object.values(componentMapping)
            .filter(comp => comp.scanned)
            .map(comp => ({
                component_id: comp.index || comp.sequence,
                name: comp.name,
                componentName: comp.name,
                item_code: comp.itemCode,
                itemCode: comp.itemCode,
                barcode: comp.scannedBarcode,
                scannedBarcode: comp.scannedBarcode,
                scan_time: new Date().toISOString(),
                sequence: comp.sequence,
                code: comp.code || 'N/A'
            }));
    }

    /**
     * Update assembly process status in database
     */
    async updateAssemblyStatus(assemblyId, assemblyBarcode, scannedComponents, rsmType) {
        try {
            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    barcode_number: assemblyBarcode,
                    metadata: {
                        scanned_components: scannedComponents,
                        rsm_type: rsmType
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update assembly status: ${response.statusText}`);
            }
            
            console.log('✅ Backend: Assembly status updated in database');
            return await response.json();
              } catch (error) {
            console.warn('⚠️ Backend: Failed to update assembly status:', error);
            // Don't throw - allow completion to continue offline
            return null;
        }
    }

    /**
     * Complete work order assembly with full completion data
     */
    async completeWorkOrderAssembly(workOrderId, assemblyBarcode, scannedComponents) {
        if (!workOrderId) {
            console.log('ℹ️ Backend: No work order ID provided, skipping work order assembly completion');
            return null;
        }

        try {
            const completionData = {
                assembly_barcode: assemblyBarcode,
                scanned_components: scannedComponents,
                completed_by: this.getCurrentUserId(),
                start_time: new Date().toISOString(),
                quality_notes: 'Completed via RSM Assembly Interface'
            };

            console.log('🎯 Backend: Sending completion data to work order API:', completionData);

            const response = await fetch(`${this.API_URL}/work-order/${workOrderId}/complete_assembly/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(completionData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to complete work order assembly: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Backend: Work order assembly completed successfully in database');
            return result;
            
        } catch (error) {
            console.error('❌ Backend: Failed to complete work order assembly:', error);
            // Don't throw - allow completion to continue offline
            return null;
        }
    }    /**
     * Handle work order completion and quantity management
     * Note: The quantity update is handled by the complete_assembly endpoint,
     * so this method just fetches the updated work order status.
     */
    async handleWorkOrderCompletion(workOrderId) {
        if (!workOrderId) {
            console.log('ℹ️ Backend: No work order ID provided, skipping work order update');
            return { success: true, message: 'No work order to update' };
        }
        
        try {
            // Get updated work order details after completion
            const workOrderResponse = await fetch(`${this.API_URL}/work-order/${workOrderId}/`);
            if (!workOrderResponse.ok) {
                throw new Error('Failed to fetch work order details');
            }
            
            const workOrder = await workOrderResponse.json();
            const isFullyCompleted = workOrder.completed_quantity >= workOrder.quantity;
            
            console.log('📊 Backend: Work order status after completion:', {
                completed: workOrder.completed_quantity || 0,
                total: workOrder.quantity,
                status: workOrder.status,
                isFullyCompleted
            });
            
            return {
                success: true,
                workOrder,
                newCompletedQuantity: workOrder.completed_quantity,
                isFullyCompleted,
                remainingQuantity: workOrder.quantity - workOrder.completed_quantity,
                message: `Work order status: ${workOrder.completed_quantity}/${workOrder.quantity} completed`
            };
            
        } catch (error) {
            console.warn('⚠️ Backend: Failed to fetch work order status:', error);
            return {
                success: false,
                error: error.message,
                message: `Warning: Could not fetch work order status - ${error.message}`
            };
        }
    }

    /**
     * Prepare completion data structure with all necessary fields
     */    prepareCompletionData({ assemblyId, currentRSMType, config, assemblyBarcode, scannedComponents, workOrderId }) {
        // Check if this is from a rework order by checking URL parameters or assembly data
        const urlParams = new URLSearchParams(window.location.search);
        const isRework = urlParams.get('isRework') === 'true' || 
                        urlParams.get('rework') === 'true' ||
                        (assemblyId && assemblyId.toString().startsWith('RW-')) ||
                        localStorage.getItem('currentRSMIsRework') === 'true';
        
        const completionData = {
            id: assemblyId,
            assemblyId: assemblyId,
            assemblyType: 'RSM',
            product: config?.name || `RSM Assembly - ${currentRSMType}`,
            itemCode: currentRSMType,
            item_code: currentRSMType,
            barcodeNumber: assemblyBarcode,
            barcode_number: assemblyBarcode,
            serial_number: assemblyBarcode,
            completedAt: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            scannedComponents: scannedComponents,
            workOrderId: workOrderId,
            work_order_id: workOrderId,
            pcb_type: 'RSM',
            status: 'Completed',
            operator: this.getCurrentUserId(),
            rsmType: currentRSMType,
            componentCount: scannedComponents.length,
            sessionId: this.sessionId
        };
        
        // Add rework flags if this is a rework order
        if (isRework) {
            completionData.is_rework = true;
            completionData.reworked = true;
            completionData.rework_completed = true;
            completionData.rework_completion_date = new Date().toISOString();
        }
        
        return completionData;
    }    /**
     * Store completed assembly data in database (primary) and localStorage (fallback)
     */
    async storeCompletedAssembly(completionData) {
        try {
            console.log('💾 Backend: Starting to store completed assembly:', completionData);
            
            // Primary storage: Send to API database
            const apiResult = await this.sendToAPI(completionData);
            
            // Secondary storage: Store in localStorage for UI compatibility
            // This ensures the UI can still display completed assemblies immediately
            this.storeInLocalStorage(completionData);
            
            if (apiResult) {
                console.log('✅ Backend: Assembly data stored successfully in database and localStorage');
                return { success: true, message: 'Assembly data stored in database', apiResult };
            } else {
                console.log('⚠️ Backend: Assembly data stored in localStorage only (API unavailable)');
                return { success: true, message: 'Assembly data stored locally only', fallback: true };
            }
            
        } catch (error) {
            console.error('❌ Backend: Failed to store completed assembly:', error);
            // Even if API fails, we still have localStorage as fallback
            this.storeInLocalStorage(completionData);
            return { success: true, error: error.message, message: 'Assembly stored locally only due to API error' };
        }
    }

    /**
     * Store completed assembly in localStorage with proper structure
     */
    storeInLocalStorage(completionData) {
        // Get existing completed assemblies from multiple localStorage keys
        const completedAssemblies = JSON.parse(localStorage.getItem('completedWorkOrders') || '[]');
        const assemblyCompletedOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
        const completedAssembliesMain = JSON.parse(localStorage.getItem('completedAssemblies') || '[]');
        
        // Create completed entry with proper structure for the UI
        const completedEntry = {
            ...completionData,
            hasCompletedAssembly: true,
            reworked: false,
            metadata: {
                rsm_type: completionData.rsmType,
                component_count: completionData.scannedComponents.length,
                api_connected: this.apiConnected,
                completed_via: 'RSM Assembly Interface',
                completion_timestamp: new Date().toISOString()
            }
        };
        
        // Remove any existing entries with same ID from all arrays
        const filteredCompleted = completedAssemblies.filter(item => 
            item.id !== completionData.id && item.assemblyId !== completionData.id
        );
        const filteredAssemblyCompleted = assemblyCompletedOrders.filter(item => 
            item.id !== completionData.id && item.assemblyId !== completionData.id
        );
        const filteredMainCompleted = completedAssembliesMain.filter(item => 
            item.id !== completionData.id && item.assemblyId !== completionData.id
        );
        
        // Add new entry to all storage locations
        filteredCompleted.push(completedEntry);
        filteredAssemblyCompleted.push(completedEntry);
        filteredMainCompleted.push(completedEntry);
        
        // Keep only last 100 entries to prevent storage overflow
        this.trimArrayToSize(filteredCompleted, 100);
        this.trimArrayToSize(filteredAssemblyCompleted, 100);
        this.trimArrayToSize(filteredMainCompleted, 100);
        
        // Save to all localStorage locations
        localStorage.setItem('completedWorkOrders', JSON.stringify(filteredCompleted));
        localStorage.setItem('assemblyCompletedOrders', JSON.stringify(filteredAssemblyCompleted));
        localStorage.setItem('completedAssemblies', JSON.stringify(filteredMainCompleted));
        
        console.log('💾 Backend: Assembly data stored in localStorage');
    }    /**
     * Send completed assembly to API
     */
    async sendToAPI(completionData) {
        if (!this.apiConnected) {
            console.log('ℹ️ Backend: API not connected, skipping API storage');
            return;
        }
        
        try {
            // Transform completion data to match CompletedAssembly model structure
            const apiData = {
                work_order: completionData.workOrderId || '',
                product: completionData.product || '',
                item_code: completionData.itemCode || completionData.item_code || '',
                serial_number: completionData.assemblyBarcode || completionData.barcodeNumber || '',
                barcode_number: completionData.assemblyBarcode || completionData.barcodeNumber || '',
                completed_at: completionData.completedAt || completionData.completed_at,
                is_rework: completionData.is_rework || false,
                reworked: completionData.reworked || false,
                original_assembly_id: completionData.original_assembly_id || null,
                zone: 'RSM Assembly Station',
                scanned_components: completionData.scannedComponents || []
            };
            
            console.log('🎯 Backend: Sending completion data to API:', apiData);
            
            const response = await fetch(`${this.API_URL}/completed-assemblies/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(apiData)
            });
                    
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend: Assembly data sent to API successfully:', result);
                return result;
            } else {
                const errorText = await response.text();
                console.error(`❌ Backend: API storage failed with ${response.status}: ${errorText}`);
                throw new Error(`API storage failed: ${response.status} - ${errorText}`);
            }
            
        } catch (error) {
            console.error('❌ Backend: Failed to send to API:', error);
            // Don't throw error - allow process to continue with localStorage
            return null;
        }
    }

    /**
     * Move work order from pending to completed list
     */
    moveWorkOrderToCompleted(assemblyId) {
        try {
            // Get pending work orders
            const pendingOrders = JSON.parse(localStorage.getItem('workOrders') || '[]');
            
            // Find and remove the completed work order from pending
            const orderIndex = pendingOrders.findIndex(order => 
                order.id == assemblyId || order.assemblyId == assemblyId
            );
            
            if (orderIndex !== -1) {
                const completedOrder = pendingOrders.splice(orderIndex, 1)[0];
                localStorage.setItem('workOrders', JSON.stringify(pendingOrders));
                
                console.log('📋 Backend: Work order moved from pending to completed');
                
                this.logAssemblyAction('work_order_moved', {
                    assemblyId,
                    from: 'pending',
                    to: 'completed'
                });
                
                return { success: true, completedOrder };
            } else {
                console.warn('⚠️ Backend: Work order not found in pending list');
                return { success: false, message: 'Work order not found in pending list' };
            }
            
        } catch (error) {
            console.warn('⚠️ Backend: Failed to move work order:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle rework scenario - move assembly back to pending with rework tag
     */
    async handleRework(assemblyId, reworkReason = 'Quality issue') {
        try {
            console.log('🔄 Backend: Starting rework process for assembly:', assemblyId);
            
            // Get completed assembly data
            const completedAssemblies = JSON.parse(localStorage.getItem('completedAssemblies') || '[]');
            const assemblyIndex = completedAssemblies.findIndex(item => 
                item.id === assemblyId || item.assemblyId === assemblyId
            );
            
            if (assemblyIndex === -1) {
                throw new Error('Assembly not found in completed list');
            }
            
            const assembly = completedAssemblies[assemblyIndex];
              // Remove from completed list
            completedAssemblies.splice(assemblyIndex, 1);
            localStorage.setItem('completedAssemblies', JSON.stringify(completedAssemblies));
            
            // Create rework entry for pending list
            const reworkEntry = {
                ...assembly,
                status: 'Pending',
                is_rework: true,
                reworked: true,
                rework_reason: reworkReason,
                rework_date: new Date().toISOString(),
                original_completion_date: assembly.completedAt,
                rework_count: (assembly.rework_count || 0) + 1,
                rework_tag: '🔄 REWORK REQUIRED'
            };
            
            // Add to multiple possible pending work order lists to ensure visibility
            const pendingKeys = ['workOrders', 'pendingWorkOrders', 'pendingAssemblies'];
            
            pendingKeys.forEach(key => {
                const orders = JSON.parse(localStorage.getItem(key) || '[]');
                
                // Check if already exists to avoid duplicates
                const existsIndex = orders.findIndex(order => 
                    (order.id === assemblyId || order.assemblyId === assemblyId)
                );
                
                if (existsIndex === -1) {
                    orders.push(reworkEntry);
                    localStorage.setItem(key, JSON.stringify(orders));
                    console.log(`✅ Backend: Added rework entry to ${key}`);
                } else {
                    console.log(`ℹ️ Backend: Rework entry already exists in ${key}`);
                }
            });
              // Update API if connected
            if (this.apiConnected) {
                try {
                    // Create a new work order entry in the API for the reworked assembly
                    const reworkWorkOrderData = {
                        item_code: assembly.itemCode || assembly.item_code,
                        product: `${assembly.product || 'RSM Assembly'} (Rework)`,
                        pcb_type: 'RSM',
                        pcb_item_code: assembly.itemCode || assembly.item_code,
                        quantity: 1,
                        status: 'Pending',
                        description: `Rework assembly: ${reworkReason}`,
                        released_by: 'RSM System - Rework',
                        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                        rework_reference: assemblyId,
                        rework_reason: reworkReason,
                        rework_date: new Date().toISOString()
                    };

                    const createResponse = await fetch(`${this.API_URL}/work-order/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCookie('csrftoken')
                        },
                        body: JSON.stringify(reworkWorkOrderData)
                    });

                    if (createResponse.ok) {
                        const newWorkOrder = await createResponse.json();
                        console.log('✅ Backend: Rework work order created in API:', newWorkOrder.id);
                        
                        // Update the rework entry with the new work order ID
                        reworkEntry.api_work_order_id = newWorkOrder.id;
                        
                        // Update localStorage with the API ID
                        pendingKeys.forEach(key => {
                            const orders = JSON.parse(localStorage.getItem(key) || '[]');
                            const entry = orders.find(order => 
                                (order.id === assemblyId || order.assemblyId === assemblyId)
                            );
                            if (entry) {
                                entry.api_work_order_id = newWorkOrder.id;
                                localStorage.setItem(key, JSON.stringify(orders));
                            }
                        });
                        
                    } else {
                        console.warn('⚠️ Backend: Failed to create rework work order in API');
                    }
                } catch (apiError) {
                    console.warn('⚠️ Backend: Error creating rework work order in API:', apiError);
                }
            }
            
            // Also attempt the legacy rework API update
            await this.updateReworkInAPI(assemblyId, reworkReason);
            
            // Log rework action
            this.logAssemblyAction('assembly_rework', {
                assemblyId,
                reworkReason,
                reworkCount: reworkEntry.rework_count
            });
            
            console.log('✅ Backend: Assembly moved to rework successfully');
            
            return {
                success: true,
                reworkEntry,
                message: 'Assembly moved to rework successfully'
            };
            
        } catch (error) {
            console.error('❌ Backend: Error handling rework:', error);
            return {
                success: false,
                error: error.message,
                message: `Error handling rework: ${error.message}`
            };
        }
    }    /**
     * Update rework status in API
     */
    async updateReworkInAPI(assemblyId, reworkReason) {
        if (!this.apiConnected) return;
        
        try {
            // Find the work order ID from the assembly
            const assembly = JSON.parse(localStorage.getItem('completedAssemblies') || '[]')
                .find(item => item.id === assemblyId || item.assemblyId === assemblyId);
            
            if (!assembly || !assembly.workOrderId) {
                console.warn('⚠️ Backend: No work order ID found for rework');
                return;
            }
            
            // Create rework order using the work order API
            const response = await fetch(`${this.API_URL}/work-order/${assembly.workOrderId}/create_rework/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    quantity: 1,
                    notes: reworkReason,
                    released_by: 'RSM System'
                })
            });
            
            if (response.ok) {
                const reworkOrder = await response.json();
                console.log('✅ Backend: Rework order created:', reworkOrder);
                return reworkOrder;
            } else {
                console.warn('⚠️ Backend: Failed to create rework order:', response.status);
            }
            
        } catch (error) {
            console.warn('⚠️ Backend: Error creating rework order:', error);
        }
    }

    /**
     * Log all assembly actions for comprehensive reporting
     */
    logAssemblyAction(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            data: data,
            userId: this.getCurrentUserId(),
            sessionId: this.sessionId
        };
        
        // Store in localStorage for local persistence
        this.storeAssemblyLog(logEntry);
        
        // Send to API if connected
        this.sendLogToAPI(logEntry);
        
        console.log('📝 Backend: Assembly Action Logged:', logEntry);
    }

    /**
     * Store assembly log entry in localStorage
     */
    storeAssemblyLog(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('rsmAssemblyLogs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 1000 entries to prevent storage overflow
            this.trimArrayToSize(logs, 1000);
            
            localStorage.setItem('rsmAssemblyLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('❌ Backend: Failed to store assembly log:', error);
        }
    }

    /**
     * Send log entry to API for centralized tracking
     */
    async sendLogToAPI(logEntry) {
        if (!this.apiConnected) return;
        
        try {
            const response = await fetch(`${this.API_URL}/assembly-logs/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(logEntry)
            });
            
            // Don't throw errors for API logging failures - just log silently
            if (!response.ok) {
                console.warn(`Backend: Log API returned ${response.status}, but continuing normally`);
            }
        } catch (error) {
            // Silently fail API logging - don't disrupt assembly process
            console.warn('Backend: Failed to send log to API (non-critical):', error.message);
        }
    }

    /**
     * Get current user ID (implement based on your authentication system)
     */
    getCurrentUserId() {
        return localStorage.getItem('userId') || 'anonymous';
    }

    /**
     * Get session ID for tracking
     */
    getSessionId() {
        let sessionId = localStorage.getItem('rsmSessionId');
        if (!sessionId) {
            sessionId = 'rsm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rsmSessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Get cookie value by name (for CSRF tokens)
     */
    getCookie(name) {
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
    }

    /**
     * Utility: Trim array to specified size by removing oldest entries
     */
    trimArrayToSize(array, maxSize) {
        if (array.length > maxSize) {
            array.splice(0, array.length - maxSize);
        }
    }

    /**
     * Set API connection status
     */
    setApiConnection(connected) {
        this.apiConnected = connected;
        console.log(`🔗 Backend: API connection status set to ${connected}`);
    }    /**
     * Test API connection
     */
    async testApiConnection() {
        try {
            const response = await fetch(`${this.API_URL}/test-connection/`, {
                method: 'GET',
                timeout: 5000
            });
            
            this.apiConnected = response.ok;
            console.log(`🔗 Backend: API connection test ${this.apiConnected ? 'passed' : 'failed'}`);
            return this.apiConnected;
            
        } catch (error) {
            this.apiConnected = false;
            console.log('🔗 Backend: API connection test failed:', error.message);
            return false;
        }
    }
    
    /**
     * Fetch work orders from API and update local storage
     */
    async fetchWorkOrdersFromAPI(pcbType = 'RSM') {
        if (!this.apiConnected) {
            console.warn('⚠️ Backend: API not connected, falling back to localStorage');
            return this.getWorkOrdersFromStorage();
        }
        
        try {
            const response = await fetch(`${this.API_URL}/work-order/by_pcb_type/?type=${pcbType}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });
            
            if (response.ok) {
                const workOrders = await response.json();
                
                // Separate pending and completed orders
                const pendingOrders = workOrders.filter(wo => wo.status === 'Pending' || wo.status === 'In Progress');
                const completedOrders = workOrders.filter(wo => wo.status === 'Completed');
                
                // Update localStorage with fresh data
                localStorage.setItem('workOrders', JSON.stringify(pendingOrders));
                localStorage.setItem('completedAssemblies', JSON.stringify(completedOrders));
                
                console.log(`✅ Backend: Fetched ${workOrders.length} work orders from API (${pendingOrders.length} pending, ${completedOrders.length} completed)`);
                
                return {
                    pending: pendingOrders,
                    completed: completedOrders,
                    total: workOrders.length
                };
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Backend: Failed to fetch work orders from API:', error);
            return this.getWorkOrdersFromStorage();
        }
    }
    
    /**
     * Get work orders from localStorage as fallback
     */
    getWorkOrdersFromStorage() {
        const pending = JSON.parse(localStorage.getItem('workOrders') || '[]');
        const completed = JSON.parse(localStorage.getItem('completedAssemblies') || '[]');
        
        return {
            pending,
            completed,
            total: pending.length + completed.length
        };
    }
    
    /**
     * Refresh work orders data from API
     */
    async refreshWorkOrders(pcbType = 'RSM') {
        console.log('🔄 Backend: Refreshing work orders from API...');
        return await this.fetchWorkOrdersFromAPI(pcbType);
    }

    // ...existing code...
}

// Make RSMBackendManager globally available for browser usage
if (typeof window !== 'undefined') {
    window.RSMBackendManager = RSMBackendManager;
    console.log('🚀 RSMBackendManager loaded and available globally');
} else if (typeof global !== 'undefined') {
    global.RSMBackendManager = RSMBackendManager;
}

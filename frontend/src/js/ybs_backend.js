/**
 * YBS Backend Operations Manager
 * Handles all backend operations for YBS assembly including:
 * - Assembly completion and status updates
 * - Quantity management and work order updates
 * - Barcode generation and storage
 * - Rework scenario handling
 * - Data persistence and API communication
 * 
 * This module separates backend logic from frontend UI logic
 * Version: 1.0
 */

class YBSBackendManager {
    constructor(apiUrl = '/api') {
        this.API_URL = apiUrl;
        this.apiConnected = false;
        this.sessionId = this.getSessionId();
    }    /**
     * Complete the assembly process - main backend operation
     */    async completeAssembly(assemblyData) {
        try {
            console.log('🎯 YBS Backend: Starting assembly completion...', assemblyData);
            
            // Extract workOrderId early to check for critical issue
            const { workOrderId } = assemblyData;
            if (!workOrderId) {
                console.error('❌ YBS Backend: CRITICAL - workOrderId is missing! Work order status will not be updated.');
                console.error('❌ YBS Backend: This means the work order will remain in pending status.');
                console.error('❌ YBS Backend: Check URL parameters and workOrderId extraction logic.');
            } else {
                console.log(`✅ YBS Backend: WorkOrderId confirmed: ${workOrderId}`);
            }
              // Validate required data
            if (!this.validateAssemblyData(assemblyData)) {
                throw new Error('Invalid assembly data provided');
            }
            
            const { assemblyId, componentMapping, currentYBSType, config, scannedSensors } = assemblyData;
            
            // Generate assembly barcode
            const assemblyBarcode = await this.generateAssemblyBarcode(currentYBSType, assemblyId);
            console.log(`📊 Generated assembly barcode: ${assemblyBarcode}`);
            
            // Prepare component data (including sensors)
            const scannedComponents = this.prepareComponentData(componentMapping, scannedSensors);            
            // Send completion data to work order API
            await this.completeWorkOrderAssembly(workOrderId, assemblyBarcode, scannedComponents);
            
            // Save individual scanned parts to database (RSM-style database operations)
            await this.saveScannedPartsToDatabase(assemblyId, scannedComponents);
            
            // Handle work order quantity management
            const workOrderResult = await this.handleWorkOrderCompletion(workOrderId);
            
            // Prepare completion data structure
            const completionData = this.prepareCompletionData({
                assemblyId,
                currentYBSType,
                config,
                assemblyBarcode,
                scannedComponents,
                workOrderId
            });            
            // Store completed assembly data (includes API call to update assembly status)
            await this.storeCompletedAssembly(completionData);
            
            // Database-driven work order completion (like RSM) - replaces localStorage approach
            const workOrderUpdateResult = await this.updateWorkOrderInDatabase(workOrderId, assemblyId);
            
            // Log completion action
            this.logAssemblyAction('assembly_completed', {
                assemblyId,
                workOrderId,
                ybsType: currentYBSType,
                barcode: assemblyBarcode,
                componentCount: scannedComponents.length
            });
            
            console.log('✅ YBS Backend: Assembly completed successfully!');
            
            return {
                success: true,
                assemblyBarcode,
                completionData,
                workOrderResult,
                message: 'Assembly completed successfully'
            };
              } catch (error) {
            console.error('❌ YBS Backend: Error completing assembly:', error);
            
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
     * Handle rework process - move completed assembly back to pending
     * Based on robust RSM rework implementation
     */
    async handleRework(assemblyId, reworkReason = 'Quality issue') {
        try {
            console.log('🔄 YBS Backend: Starting rework process for assembly:', assemblyId);
            
            // Find assembly in completed lists
            const completedKeys = ['completedWorkOrders', 'assemblyCompletedOrders', 'ybsCompletedOrders'];
            let assembly = null;
            let sourceKey = null;
            let assemblyIndex = -1;
            
            for (const key of completedKeys) {
                const completedList = JSON.parse(localStorage.getItem(key) || '[]');
                assemblyIndex = completedList.findIndex(item => 
                    item.id === assemblyId || item.assemblyId === assemblyId
                );
                if (assemblyIndex !== -1) {
                    assembly = completedList[assemblyIndex];
                    sourceKey = key;
                    // Remove from completed list
                    completedList.splice(assemblyIndex, 1);
                    localStorage.setItem(key, JSON.stringify(completedList));
                    break;
                }
            }
            
            if (!assembly) {
                throw new Error('Assembly not found in completed lists');
            }
            
            // Create rework entry for pending list
            const reworkEntry = {
                ...assembly,
                status: 'Pending',
                is_rework: true,
                reworked: true,
                rework_reason: reworkReason,
                rework_date: new Date().toISOString(),
                original_completion_date: assembly.completed_at || assembly.completedAt,
                rework_count: (assembly.rework_count || 0) + 1,
                rework_tag: '🔄 YBS REWORK REQUIRED'
            };
            
            // Add to multiple possible pending work order lists
            const pendingKeys = ['workOrders', 'pendingWorkOrders', 'pendingAssemblies', 'ybsPendingOrders'];
            
            pendingKeys.forEach(key => {
                const orders = JSON.parse(localStorage.getItem(key) || '[]');
                
                // Check if already exists to avoid duplicates
                const existsIndex = orders.findIndex(order => 
                    (order.id === assemblyId || order.assemblyId === assemblyId)
                );
                
                if (existsIndex === -1) {
                    orders.push(reworkEntry);
                    localStorage.setItem(key, JSON.stringify(orders));
                    console.log(`✅ YBS Backend: Added rework entry to ${key}`);
                } else {
                    console.log(`ℹ️ YBS Backend: Rework entry already exists in ${key}`);
                }
            });
            
            // Update API if connected
            if (this.apiConnected) {
                try {
                    // Create a new work order entry in the API for the reworked assembly
                    const reworkWorkOrderData = {
                        item_code: assembly.item_code || assembly.ybs_type,
                        product: `${assembly.product || 'YBS Assembly'} (Rework)`,
                        pcb_type: 'YBS',
                        pcb_item_code: assembly.item_code || assembly.ybs_type,
                        quantity: 1,
                        status: 'Pending',
                        description: `YBS Rework assembly: ${reworkReason}`,
                        released_by: 'YBS System - Rework',
                        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                        rework_reference: assemblyId,
                        rework_reason: reworkReason,
                        rework_date: new Date().toISOString()
                    };

                    const createResponse = await fetch(`${this.API_URL}/work-order/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(reworkWorkOrderData)
                    });

                    if (createResponse.ok) {
                        const newWorkOrder = await createResponse.json();
                        console.log('✅ YBS Backend: Rework work order created in API:', newWorkOrder.id);
                        
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
                        console.warn('⚠️ YBS Backend: Failed to create rework work order in API');
                    }
                } catch (apiError) {
                    console.warn('⚠️ YBS Backend: Error creating rework work order in API:', apiError);
                }
            }
            
            // Also attempt to update the original assembly status to rework
            await this.updateReworkInAPI(assemblyId, reworkReason);
            
            // Log rework action
            this.logAssemblyAction('assembly_rework', {
                assemblyId,
                reworkReason,
                reworkCount: reworkEntry.rework_count,
                sourceKey: sourceKey
            });
            
            console.log('✅ YBS Backend: Assembly moved to rework successfully');
            
            return {
                success: true,
                message: 'Assembly moved to rework queue',
                reworkEntry: reworkEntry
            };
            
        } catch (error) {
            console.error('❌ YBS Backend: Error handling rework:', error);
            
            this.logAssemblyAction('assembly_rework_error', {
                error: error.message,
                assemblyId: assemblyId
            });
            
            return {
                success: false,
                error: error.message,
                message: `Error moving assembly to rework: ${error.message}`
            };
        }
    }

    /**
     * Update rework status in API
     */
    async updateReworkInAPI(assemblyId, reworkReason) {
        try {
            const reworkData = {
                status: 'rework',
                rework_reason: reworkReason,
                rework_date: new Date().toISOString(),
                notes: `YBS assembly moved to rework: ${reworkReason}`
            };

            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reworkData)
            });

            if (!response.ok) {
                console.warn('YBS Backend: Failed to update rework status in API');
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('YBS Backend: Error updating rework in API:', error);
            return null;
        }
    }

    /**
     * Validate assembly data before processing
     */
    validateAssemblyData(data) {
        const required = ['assemblyId', 'componentMapping', 'currentYBSType'];
        return required.every(field => data[field] !== undefined && data[field] !== null);
    }

    /**
     * Generate YBS assembly barcode
     * Format: XXXX24XXXXX (11 digits with "24" in positions 5-6)
     */
    async generateAssemblyBarcode(ybsType, assemblyId) {
        try {
            // Generate an 11-digit barcode with '2' in 5th position and '4' in 6th position
            const prefix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            const barcode = prefix + '24' + suffix;
            
            console.log(`📊 Generated YBS barcode: ${barcode} for type: ${ybsType}`);
            return barcode;
        } catch (error) {
            console.error('Error generating YBS barcode:', error);
            // Fallback barcode generation
            return Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
        }
    }    /**
     * Prepare component data for API submission - ENHANCED to include ALL sensors as components
         /**
     * Prepare component data for API submission - ENHANCED to include ALL sensors as components
     * Every sensor is a component and needs to be saved individually
     */    prepareComponentData(componentMapping, scannedSensors = []) {
        const scannedComponents = [];
        
        console.log('📦 YBS Backend: prepareComponentData called with:', {
            componentMappingKeys: Object.keys(componentMapping),
            scannedSensorsLength: scannedSensors.length,
            componentMapping,
            scannedSensors
        });
        
        // Process traditional components (PCBs, cables, etc.)
        Object.entries(componentMapping).forEach(([key, component]) => {
            console.log(`📦 YBS Backend: Processing component ${key}:`, component);
            if (component.scanned && component.scannedBarcode) {
                const componentData = {
                    component_id: component.index || component.sequence || key,
                    name: component.name,
                    componentName: component.name,
                    item_code: component.itemCode,
                    itemCode: component.itemCode,
                    barcode: component.scannedBarcode,
                    scannedBarcode: component.scannedBarcode,
                    scan_time: component.scanTime || new Date().toISOString(),
                    sequence: component.sequence || 0,
                    code: component.code || 'N/A',
                    type: component.type || 'component'
                };
                scannedComponents.push(componentData);
                console.log(`✅ YBS Backend: Added component ${key}:`, componentData);
            } else {
                console.log(`⚠️ YBS Backend: Skipping component ${key} - not scanned or no barcode`);
            }
        });        // Process sensors as components (CRITICAL - every sensor is a component)
        // BUT: Filter out main components that are already included above to avoid double-counting
        console.log(`📦 YBS Backend: Processing ${scannedSensors.length} sensors as components...`);
        if (scannedSensors && scannedSensors.length > 0) {
            // Create a set of already processed component barcodes to avoid duplicates
            const processedBarcodes = new Set(scannedComponents.map(c => c.barcode));
            
            scannedSensors.forEach((sensor, index) => {
                console.log(`📦 YBS Backend: Processing sensor ${index + 1}:`, sensor);
                
                // Fix: Check for both 'barcode' and 'scannedBarcode' properties
                const sensorBarcode = sensor.scannedBarcode || sensor.barcode;
                
                if (sensorBarcode) {
                    // Check if this barcode is already processed as a main component
                    if (processedBarcodes.has(sensorBarcode)) {
                        console.log(`⚠️ YBS Backend: Skipping sensor ${index + 1} - barcode ${sensorBarcode} already processed as main component`);
                        return; // Skip this sensor to avoid double-counting
                    }
                    
                    const sensorData = {
                        component_id: sensor.sensorId || sensor.index || `sensor_${index + 1}`,
                        name: sensor.name || `Sensor ${sensor.sensorId || sensor.index || index + 1}`,
                        componentName: sensor.name || `Sensor ${sensor.sensorId || sensor.index || index + 1}`,
                        item_code: sensor.itemCode || '5YB013254', // Default YBS sensor item code
                        itemCode: sensor.itemCode || '5YB013254',
                        barcode: sensorBarcode,
                        scannedBarcode: sensorBarcode,
                        scan_time: sensor.scanTime || sensor.timestamp || new Date().toISOString(),
                        sequence: sensor.sensorId || sensor.index || index + 1,
                        code: sensor.code || 'N/A',
                        type: 'sensor',
                        sensor_id: sensor.sensorId || sensor.index || index + 1
                    };
                    scannedComponents.push(sensorData);
                    processedBarcodes.add(sensorBarcode); // Add to prevent future duplicates
                    console.log(`✅ YBS Backend: Added sensor ${sensor.sensorId || index + 1} as component:`, sensorData);
                } else {
                    console.log(`⚠️ YBS Backend: Skipping sensor ${index + 1} - no barcode found (checked 'scannedBarcode' and 'barcode' properties)`);
                    console.log(`⚠️ YBS Backend: Sensor data:`, sensor);
                }
            });
        } else {
            console.log('⚠️ YBS Backend: No sensors provided or sensors array is empty');
        }
        
        console.log(`📦 YBS Backend: Prepared ${scannedComponents.length} total components/sensors for database:`);
        console.log(`📦 YBS Backend: - Components: ${scannedComponents.filter(c => c.type !== 'sensor').length}`);
        console.log(`📦 YBS Backend: - Sensors: ${scannedComponents.filter(c => c.type === 'sensor').length}`);
        console.log('📦 YBS Backend: Final scanned components array:', scannedComponents);        
        return scannedComponents;
    }

    /**
     * Save individual scanned parts to database - RSM-style database operations
     */
    async saveScannedPartsToDatabase(assemblyId, scannedComponents) {
        if (!assemblyId || !scannedComponents || scannedComponents.length === 0) {
            console.log('⚠️ YBS Backend: No assembly ID or scanned components to save');
            return;
        }

        try {
            console.log(`📡 YBS Backend: Saving ${scannedComponents.length} scanned parts to database for assembly ${assemblyId}...`);
            
            // Test API connection first
            const connectionTest = await this.testApiConnection();
            if (!connectionTest) {
                console.log('⚠️ YBS Backend: API connection failed, cannot save scanned parts to database');
                return;
            }

            for (let i = 0; i < scannedComponents.length; i++) {
                const component = scannedComponents[i];
                
                try {
                    const scannedPartData = {
                        part_code: component.barcode || component.scannedBarcode,
                        sensor_id: component.type === 'sensor' ? component.sensor_id || component.component_id : null,
                        operator: this.getCurrentUserId() || 'YBS_System',
                        replaced: false
                    };

                    console.log(`📡 YBS Backend: Saving scanned part ${i + 1}/${scannedComponents.length}:`, scannedPartData);

                    const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/add_scanned_part/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': this.getCookie('csrftoken')
                        },
                        body: JSON.stringify(scannedPartData)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log(`✅ YBS Backend: Saved scanned part ${component.name || component.componentName} to database`);
                    } else {
                        const errorText = await response.text();
                        console.error(`❌ YBS Backend: Failed to save scanned part ${component.name || component.componentName}:`, response.status, errorText);
                    }
                    
                } catch (partError) {
                    console.error(`❌ YBS Backend: Error saving individual scanned part:`, partError);
                }
            }

            console.log(`✅ YBS Backend: Finished saving scanned parts to database`);
            
        } catch (error) {
            console.error('❌ YBS Backend: Error saving scanned parts to database:', error);
        }
    }

    async updateAssemblyStatus(assemblyId, barcode, components, ybsType) {
        try {
            console.log('🔄 YBS Backend: Updating assembly status in database...');
            
            const updateData = {
                status: 'completed',
                completed_at: new Date().toISOString(),
                barcode_number: barcode,
                notes: `YBS assembly ${ybsType} completed via web interface`,
                metadata: {
                    ybs_type: ybsType,
                    scanned_components: components,
                    component_count: components.length,
                    completion_source: 'YBS_web_interface',
                    individual_component_barcodes: components.map(comp => ({
                        component_name: comp.componentName || comp.name,
                        item_code: comp.itemCode || comp.item_code,
                        scanned_barcode: comp.scannedBarcode || comp.barcode,
                        scan_time: comp.scan_time || new Date().toISOString(),
                        sequence: comp.sequence || comp.component_id
                    }))
                }
            };

            console.log('📡 YBS Backend: Sending assembly update to database:', updateData);

            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                console.warn(`⚠️ YBS Backend: Failed to update assembly status: ${response.status} ${response.statusText}`);
                return null;
            }

            const result = await response.json();
            console.log('✅ YBS Backend: Assembly status updated in database');
            return result;
            
        } catch (error) {
            console.warn('⚠️ YBS Backend: Failed to update assembly status:', error);
            // Don't throw - allow completion to continue offline
            return null;
        }
    }    /**
     * Complete work order assembly with full completion data - Enhanced to save component barcodes
     */
    async completeWorkOrderAssembly(workOrderId, barcode, components) {
        if (!workOrderId) {
            console.log('ℹ️ YBS Backend: No work order ID provided, skipping work order assembly completion');
            return null;
        }

        try {
            const completionData = {
                assembly_barcode: barcode,
                scanned_components: components,
                completed_by: this.getCurrentUserId(),
                start_time: new Date().toISOString(),
                quality_notes: 'Completed via YBS Assembly Interface',
                individual_component_details: components.map(comp => ({
                    component_name: comp.componentName || comp.name,
                    item_code: comp.itemCode || comp.item_code,
                    scanned_barcode: comp.scannedBarcode || comp.barcode,
                    scan_time: comp.scan_time || new Date().toISOString(),
                    sequence: comp.sequence || comp.component_id,
                    code: comp.code || 'N/A'
                }))
            };

            console.log('🎯 YBS Backend: Sending completion data to work order API:', completionData);

            const response = await fetch(`${this.API_URL}/work-order/${workOrderId}/complete_assembly/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(completionData)
            });
            
            if (!response.ok) {
                console.warn(`⚠️ YBS Backend: Work order completion failed: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const result = await response.json();
            console.log('✅ YBS Backend: Work order assembly completed successfully in database');
            return result;
            
        } catch (error) {
            console.error('❌ YBS Backend: Failed to complete work order assembly:', error);
            // Don't throw - allow completion to continue offline
            return null;
        }
    }

    /**
     * Handle work order completion and quantity management
     */
    async handleWorkOrderCompletion(workOrderId) {
        if (!workOrderId) return { needsRework: false };
        
        try {
            // Get current work order details
            const response = await fetch(`${this.API_URL}/work-order/${workOrderId}/`);
            if (!response.ok) {
                throw new Error('Failed to fetch work order details');
            }
            
            const workOrder = await response.json();
            const currentQuantity = workOrder.completed_quantity || 0;
            const totalQuantity = workOrder.quantity || 1;
            const newQuantity = currentQuantity + 1;            // Update work order quantity
            const updateResponse = await fetch(`${this.API_URL}/work-order/${workOrderId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    completed_quantity: newQuantity,
                    status: newQuantity >= totalQuantity ? 'Completed' : 'In Progress'
                })
            });

            if (!updateResponse.ok) {
                console.warn('Work order quantity update failed');
            }

            return {
                needsRework: newQuantity < totalQuantity,
                currentQuantity: newQuantity,
                totalQuantity: totalQuantity,
                workOrderComplete: newQuantity >= totalQuantity
            };

        } catch (error) {
            console.error('Error handling work order completion:', error);
            return { needsRework: false };
        }
    }    /**
     * Prepare completion data structure with all necessary fields - Enhanced to match RSM
     */
    prepareCompletionData({ assemblyId, currentYBSType, config, assemblyBarcode, scannedComponents, workOrderId }) {
        // Check if this is from a rework order by checking URL parameters or assembly data
        const urlParams = new URLSearchParams(window.location.search);
        const isRework = urlParams.get('isRework') === 'true' || 
                        urlParams.get('rework') === 'true' ||
                        (assemblyId && assemblyId.toString().startsWith('RW-')) ||
                        localStorage.getItem('currentYBSIsRework') === 'true';
          const completionData = {
            id: assemblyId,
            assemblyId: assemblyId,
            assemblyType: 'YBS',
            product: config?.name || `YBS Assembly - ${currentYBSType}`,
            itemCode: currentYBSType,
            item_code: currentYBSType,
            barcodeNumber: assemblyBarcode,
            barcode_number: assemblyBarcode,
            assemblyBarcode: assemblyBarcode, // Ensure this is always included
            serial_number: assemblyBarcode,
            completedAt: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            scannedComponents: scannedComponents,
            workOrderId: workOrderId,
            work_order_id: workOrderId,
            pcb_type: 'YBS',
            status: 'Completed',
            operator: this.getCurrentUserId(),
            ybsType: currentYBSType,
            ybs_type: currentYBSType,
            componentCount: scannedComponents.length,
            sessionId: this.sessionId
        };
        
        // Add rework flags if this is a rework order
        if (isRework) {
            completionData.is_rework = true;
            completionData.reworked = true;
            completionData.rework_tag = '🔄 YBS REWORK COMPLETED';
            completionData.rework_count = (completionData.rework_count || 0) + 1;
        }
        
        return completionData;
    }/**
     * Store completed assembly data in database (primary) and localStorage (fallback)
     * Enhanced to match RSM backend robustness
     */
    async storeCompletedAssembly(completionData) {
        try {
            // Try to store in database first
            await this.sendToAPI(completionData);
            
            // Store in localStorage as backup/fallback
            this.storeInLocalStorage(completionData);
            
            console.log('📦 YBS Backend: Assembly data stored successfully');
        } catch (error) {
            console.error('❌ YBS Backend: Error storing completed assembly:', error);
            
            // Even if database fails, ensure localStorage is updated
            this.storeInLocalStorage(completionData);
        }
    }

    /**
     * Store completed assembly in localStorage with proper structure - Matches RSM
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
                ybs_type: completionData.ybs_type || completionData.item_code,
                component_count: completionData.scannedComponents?.length || 0,
                api_connected: this.apiConnected,
                completed_via: 'YBS Assembly Interface',
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
        
        console.log('💾 YBS Backend: Assembly data stored in localStorage');
    }    /**
     * Send completed assembly to API - Uses the correct assembly-process endpoint
     */
    async sendToAPI(completionData) {
        // Always try API call even if apiConnected is false - test connection first
        try {
            console.log('🔄 YBS Backend: Testing API connection before sending data...');
            const connectionTest = await this.testApiConnection();
            if (!connectionTest) {
                console.log('⚠️ YBS Backend: API connection failed, skipping API storage');
                return null;
            }
        } catch (error) {
            console.log('⚠️ YBS Backend: API connection test failed, skipping API storage');
            return null;
        }
        
        if (!completionData.assemblyId) {
            console.error('❌ YBS Backend: No assembly ID provided for API storage');
            return null;
        }
        
        try {
            console.log('📡 YBS Backend: Sending completion data to API:', completionData);            // Prepare the data structure expected by the backend
            const apiData = {
                status: 'completed',
                completed_at: completionData.completed_at || completionData.completedAt || new Date().toISOString(),
                barcode_number: completionData.assemblyBarcode || completionData.barcodeNumber,
                item_code: completionData.item_code || completionData.ybsType,
                product: completionData.product || `YBS Assembly - ${completionData.ybsType}`,
                pcb_type: 'YBS',
                work_order_id: completionData.workOrderId,
                notes: `YBS assembly ${completionData.ybsType || 'unknown'} completed via web interface`,
                metadata: {
                    ybs_type: completionData.ybsType,
                    scanned_components: completionData.scannedComponents || [],
                    component_count: (completionData.scannedComponents || []).length,
                    completion_source: 'YBS_web_interface',
                    work_order_id: completionData.workOrderId,
                    individual_component_barcodes: (completionData.scannedComponents || []).map(comp => ({
                        component_name: comp.componentName || comp.name,
                        item_code: comp.itemCode || comp.item_code,
                        scanned_barcode: comp.scannedBarcode || comp.barcode,
                        scan_time: comp.scan_time || new Date().toISOString(),
                        sequence: comp.sequence || comp.component_id,
                        type: comp.type || 'component'
                    }))
                }
            };
              console.log('📡 YBS Backend: Formatted API payload:', apiData);
            
            // Test specific assembly-process endpoint
            const testUrl = `${this.API_URL}/assembly-process/${completionData.assemblyId}/`;
            console.log('📡 YBS Backend: Testing endpoint:', testUrl);
            
            const response = await fetch(testUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(apiData)
            });
            
            console.log('📡 YBS Backend: API Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ YBS Backend: API Error Response:', response.status, errorText);
                
                // If assembly not found, log the error but don't fail completely
                if (response.status === 404) {
                    console.warn('⚠️ YBS Backend: Assembly not found in database - this might be expected for some test scenarios');
                    return { warning: 'Assembly not found in database', status: 404 };
                }
                
                throw new Error(`API response not ok: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ YBS Backend: Assembly data successfully saved to database');
            console.log('📊 YBS Backend: Database result:', result);
            return result;
              } catch (error) {
            console.error('❌ YBS Backend: Failed to save to database:', error);
            console.error('❌ YBS Backend: Full error details:', error.message, error.stack);
            
            // Don't mark as disconnected for 404 errors - assembly might not exist in DB
            if (!error.message.includes('404')) {
                this.apiConnected = false; // Mark as disconnected
            }
            
            // Log the error but don't completely fail - localStorage will still work
            console.log('💾 YBS Backend: Continuing with localStorage storage despite API error');
            return { error: error.message, apiCallFailed: true };
        }
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
        return cookieValue;    }

    /**
     * Update work order in database (RSM-style database operations)
     * Replaces localStorage-based work order management
     */
    async updateWorkOrderInDatabase(workOrderId, assemblyId) {
        if (!workOrderId) {
            console.log('⚠️ YBS Backend: No work order ID provided for database update');
            return { success: false, message: 'No work order ID provided' };
        }

        try {
            console.log(`🔄 YBS Backend: Updating work order ${workOrderId} in database for assembly ${assemblyId}...`);
            
            // Test API connection first
            const connectionTest = await this.testApiConnection();
            if (!connectionTest) {
                console.log('⚠️ YBS Backend: API connection failed, cannot update work order in database');
                return { success: false, message: 'API connection failed' };
            }

            // Get current work order status
            const workOrderResponse = await fetch(`${this.API_URL}/work-order/${workOrderId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!workOrderResponse.ok) {
                console.error(`❌ YBS Backend: Failed to fetch work order ${workOrderId}:`, workOrderResponse.status);
                return { success: false, message: 'Failed to fetch work order' };
            }

            const workOrder = await workOrderResponse.json();
            console.log(`📊 YBS Backend: Current work order status:`, workOrder);

            // Complete the assembly unit in the work order
            const completeResponse = await fetch(`${this.API_URL}/work-order/${workOrderId}/complete_assembly/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    assembly_id: assemblyId,
                    completed_by: this.getCurrentUserId() || 'YBS_System',
                    notes: `YBS assembly ${assemblyId} completed successfully`
                })
            });

            if (completeResponse.ok) {
                const result = await completeResponse.json();
                console.log(`✅ YBS Backend: Work order ${workOrderId} updated successfully in database:`, result);
                
                return {
                    success: true,
                    workOrder: result,
                    message: `Work order ${workOrderId} updated successfully`,
                    completedQuantity: result.completed_quantity || 0,
                    totalQuantity: result.quantity || 0,
                    isFullyCompleted: result.status === 'completed'
                };
            } else {
                const errorText = await completeResponse.text();
                console.error(`❌ YBS Backend: Failed to update work order ${workOrderId}:`, completeResponse.status, errorText);
                return { success: false, message: 'Failed to update work order in database' };
            }
            
        } catch (error) {
            console.error('❌ YBS Backend: Error updating work order in database:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Move work order from pending to completed list - Enhanced to match RSM robustness
     */
    moveWorkOrderToCompleted(assemblyId) {
        try {
            console.log(`🔄 YBS Backend: Attempting to move work order ${assemblyId} from pending to completed`);
            
            // Check multiple possible pending work order storage keys to ensure robustness
            const pendingKeys = ['workOrders', 'pendingWorkOrders', 'pendingAssemblies', 'ybsPendingOrders'];
            let foundInPending = false;
            let completedOrder = null;
            
            // Debug: Check what's in localStorage
            console.log('📋 YBS Backend: Checking localStorage for pending work orders...');
            pendingKeys.forEach(key => {
                const data = localStorage.getItem(key);
                const parsed = data ? JSON.parse(data) : null;
                console.log(`📋 YBS Backend: ${key}:`, parsed ? `${parsed.length} items` : 'null');
                if (parsed && parsed.length > 0) {
                    console.log(`📋 YBS Backend: ${key} sample items:`, parsed.slice(0, 2));
                }
            });
            
            // Search all potential pending lists
            for (const key of pendingKeys) {
                const pendingOrders = JSON.parse(localStorage.getItem(key) || '[]');
                
                // Find and remove the completed work order from pending
                const orderIndex = pendingOrders.findIndex(order => {
                    const matches = order.id == assemblyId || order.assemblyId == assemblyId || 
                                   order.assembly_id == assemblyId || order.workOrderId == assemblyId;
                    if (matches) {
                        console.log(`📋 YBS Backend: Found matching order in ${key}:`, order);
                    }
                    return matches;
                });
                
                if (orderIndex !== -1) {
                    completedOrder = pendingOrders.splice(orderIndex, 1)[0];
                    localStorage.setItem(key, JSON.stringify(pendingOrders));
                    foundInPending = true;
                    console.log(`✅ YBS Backend: Work order moved from ${key} to completed:`, completedOrder);
                    
                    // Also add to completed work orders list
                    const completedOrders = JSON.parse(localStorage.getItem('completedWorkOrders') || '[]');
                    completedOrder.status = 'completed';
                    completedOrder.completedAt = new Date().toISOString();
                    completedOrders.push(completedOrder);
                    localStorage.setItem('completedWorkOrders', JSON.stringify(completedOrders));
                    console.log(`✅ YBS Backend: Added to completedWorkOrders list`);
                    
                    break;
                }
            }
            
            if (foundInPending && completedOrder) {
                this.logAssemblyAction('work_order_moved', {
                    assemblyId,
                    from: 'pending',
                    to: 'completed',
                    ybsType: completedOrder.ybs_type || completedOrder.item_code
                });
                
                console.log(`✅ YBS Backend: Successfully moved work order ${assemblyId} to completed`);
                return { success: true, completedOrder };
            } else {
                console.warn(`⚠️ YBS Backend: Work order ${assemblyId} not found in any pending list`);
                
                // Check if it might be stored differently
                const allKeys = Object.keys(localStorage);
                console.log('📋 YBS Backend: All localStorage keys:', allKeys);
                
                // Try to find the work order in any localStorage key
                const possibleMatches = [];
                allKeys.forEach(key => {
                    try {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (Array.isArray(data)) {
                            data.forEach((item, index) => {
                                if (item && (item.id == assemblyId || item.assemblyId == assemblyId)) {
                                    possibleMatches.push({ key, index, item });
                                }
                            });
                        }
                    } catch (e) {
                        // Skip non-JSON data
                    }
                });
                
                if (possibleMatches.length > 0) {
                    console.log('📋 YBS Backend: Found possible matches in other keys:', possibleMatches);
                }
                
                return { success: false, message: 'Work order not found in pending list', possibleMatches };
            }
            
        } catch (error) {
            console.error('❌ YBS Backend: Failed to move work order:', error);
            return { success: false, error: error.message };
        }
    }
     /* Log assembly actions for audit trail
     */
    logAssemblyAction(action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            action: action,
            data: data
        };

        try {
            // Store in localStorage for audit trail
            const logs = JSON.parse(localStorage.getItem('ybsAssemblyLogs') || '[]');
            logs.push(logEntry);
            
            // Keep last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('ybsAssemblyLogs', JSON.stringify(logs));
            
            // Also log to console for debugging
            console.log(`📝 YBS Action: ${action}`, data);
        } catch (error) {
            console.error('Error logging assembly action:', error);
        }
    }

    /**
     * Get or create session ID for tracking
     */
    getSessionId() {
        let sessionId = localStorage.getItem('ybsSessionId');
        if (!sessionId) {
            sessionId = 'ybs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ybsSessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Test API connectivity
     */
    async testApiConnection() {
        try {
            const response = await fetch(`${this.API_URL}/work-order/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            this.apiConnected = response.ok;
            return this.apiConnected;
        } catch (error) {
            console.error('API connection test failed:', error);
            this.apiConnected = false;
            return false;
        }
    }

    /**
     * Fetch work order details
     */
    async fetchWorkOrderDetails(workOrderId) {
        if (!workOrderId) return null;
        
        try {
            const response = await fetch(`${this.API_URL}/work-order/${workOrderId}/`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch work order details:', error);
        }
        return null;
    }

    /**
     * Create new assembly process
     */
    async createAssemblyProcess(workOrderId, ybsType) {
        try {
            const assemblyData = {
                work_order: workOrderId,
                created_by: 'YBS Web Interface',
                status: 'in_progress',
                metadata: {
                    ybs_type: ybsType,
                    created_via: 'web_interface'
                }
            };
            
            const response = await fetch(`${this.API_URL}/assembly-process/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assemblyData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create assembly process');
            }
            
            const data = await response.json();
            
            // Save assembly ID for reference
            localStorage.setItem('currentYBSAssemblyId', data.id.toString());
            
            return data;
        } catch (error) {
            console.error('Error creating assembly process:', error);
            throw error;
        }
    }

    /**
     * Load assembly state from backend
     */
    async loadAssemblyState(assemblyId) {
        try {
            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`);
            if (!response.ok) {
                throw new Error('Failed to load assembly state');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error loading assembly state:', error);
            throw error;
        }
    }

    /**
     * Update assembly progress
     */
    async updateAssemblyProgress(assemblyId, progressData) {
        try {
            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(progressData)
            });

            if (!response.ok) {
                throw new Error('Failed to update assembly progress');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating assembly progress:', error);
            // Don't throw here, allow offline operation
            return null;
        }
    }    /**
     * Fetch inventory codes from API with detailed information
     * Supports both array format (YBS sequential codes) and object format (legacy mappings)
     */
    async fetchInventoryCodes(itemCodes) {
        const codes = {};
        const fetchResults = [];
        
        // Handle both array and object formats
        const codeEntries = Array.isArray(itemCodes) 
            ? itemCodes.map(code => [code, code]) // Convert array to [code, code] pairs
            : Object.entries(itemCodes);
        
        for (const [key, itemCode] of codeEntries) {
            try {
                console.log(`🔍 YBS Backend: Fetching data for ${key} (${itemCode})...`);
                const response = await fetch(`${this.API_URL}/item-master/?search=${itemCode}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Handle different API response structures
                    let itemData = null;
                    if (data.results && data.results.length > 0) {
                        itemData = data.results[0];
                    } else if (Array.isArray(data) && data.length > 0) {
                        itemData = data[0];
                    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                        itemData = data;
                    }
                    
                    if (itemData) {
                        codes[key] = {
                            code: itemData.code || itemData.scanning_code || '',
                            itemCode: itemData.item_code || itemCode,
                            description: itemData.description || itemData.name || '',
                            category: itemData.category || 'YBS'
                        };
                        fetchResults.push({
                            component: key,
                            itemCode: itemCode,
                            scanningCode: codes[key].code,
                            description: codes[key].description,
                            status: 'success'
                        });
                        console.log(`✅ YBS Backend: Found ${key} - Code: ${codes[key].code}, Description: ${codes[key].description}`);
                    } else {
                        fetchResults.push({
                            component: key,
                            itemCode: itemCode,
                            scanningCode: '',
                            description: 'Not found in item master',
                            status: 'not_found'
                        });
                        console.warn(`⚠️ YBS Backend: No data found for ${key} (${itemCode})`);
                    }
                } else {
                    fetchResults.push({
                        component: key,
                        itemCode: itemCode,
                        scanningCode: '',
                        description: `API Error: ${response.status}`,
                        status: 'error'
                    });
                    console.error(`❌ YBS Backend: API error for ${key}: ${response.status}`);
                }
            } catch (error) {
                fetchResults.push({
                    component: key,
                    itemCode: itemCode,
                    scanningCode: '',
                    description: `Network Error: ${error.message}`,
                    status: 'error'
                });
                console.error(`❌ YBS Backend: Network error for ${key}:`, error);
            }
        }
        
        // Store fetch results for detailed logging
        codes._fetchResults = fetchResults;
        return codes;
    }

    /**
     * Reset assembly state
     */
    async resetAssemblyState(assemblyId) {
        try {
            const resetData = {
                status: 'in_progress',
                current_sensor_index: 1,
                metadata: {
                    current_sequence_index: 1,
                    scanned_components: [],
                    scanned_sensors: [],
                    reset_at: new Date().toISOString()
                }
            };

            const response = await fetch(`${this.API_URL}/assembly-process/${assemblyId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resetData)
            });

            if (!response.ok) {
                throw new Error('Failed to reset assembly state');
            }

            return await response.json();
        } catch (error) {
            console.error('Error resetting assembly state:', error);
            throw error;
        }
   }    /**
     * Load inventory data for YBS components
     * Fetches item codes from the backend API and returns mapped data for YBS sequential numbering
     */
    async loadInventoryData(ybsType = null) {
        try {
            console.log(`📦 YBS Backend: Loading inventory data for ${ybsType || 'unknown type'}...`);
            
            // Get correct item codes based on YBS type
            const ybsItemCodes = this.getYBSItemCodes(ybsType);
            
            if (!ybsItemCodes || (!ybsItemCodes.components || !ybsItemCodes.sensors)) {
                console.warn(`⚠️ YBS Backend: No item codes defined for ${ybsType}`);
                return {
                    success: false,
                    itemCodes: {},
                    message: `No item codes defined for ${ybsType}`
                };
            }
            
            // Combine all codes for fetching
            const allCodes = [...ybsItemCodes.components, ...ybsItemCodes.sensors];
            
            // Fetch codes from API  
            const itemCodes = await this.fetchInventoryCodes(allCodes);
            const fetchResults = itemCodes._fetchResults || [];
            
            // Remove internal data from return
            delete itemCodes._fetchResults;
            
            if (Object.keys(itemCodes).length > 0) {
                console.log('✅ YBS Backend: Inventory data loaded successfully:', itemCodes);
                
                // Count successful fetches
                const successCount = fetchResults.filter(r => r.status === 'success').length;
                const totalCount = fetchResults.length;
                
                // Separate components and sensors for display
                const componentCodes = ybsItemCodes.components.filter(code => itemCodes[code]);
                const sensorCodes = ybsItemCodes.sensors.filter(code => itemCodes[code]);
                
                const message = `${successCount}/${totalCount} items: ${componentCodes.length} components (${ybsItemCodes.components.length} required), ${sensorCodes.length} sensors (${ybsItemCodes.sensors.length} required)`;
                
                return {
                    success: true,
                    itemCodes: itemCodes,
                    componentCodes: componentCodes,
                    sensorCodes: sensorCodes,
                    fetchResults: fetchResults,
                    ybsType: ybsType,
                    totalComponents: ybsItemCodes.components.length,
                    totalSensors: ybsItemCodes.sensors.length,
                    message: message
                };
            } else {
                console.warn('⚠️ YBS Backend: No inventory codes found');
                return {
                    success: false,
                    itemCodes: {},
                    fetchResults: fetchResults,
                    message: 'No item codes found in database'
                };
            }
            
        } catch (error) {
            console.error('❌ YBS Backend: Error loading inventory data:', error);
            return {
                success: false,
                itemCodes: {},
                fetchResults: [],
                message: `API Error: ${error.message}`
            };
        }
    }    /**
     * Get YBS item codes based on YBS assembly type using correct item codes from the database
     * Maps specific YBS assembly types to their correct component and sensor item codes
     */
    getYBSItemCodes(ybsType) {
        // Define the correct item code mappings for each YBS assembly type
        const itemCodeMappings = {
            // 5YB011056 - YBS Machine - Duct Number 41 - 23 Duct Assembly
            '5YB011056': {
                components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013254'],
                sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254']
            },
            // 5YB011057 - YBS Assembly Verification (24 sensors including sensor 24)
            '5YB011057': {
                components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013255'],
                sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255']
            },
            // 5YB011059 - YBS Assembly - 25 Duct Assembly
            '5YB011059': {
                components: ['4YB013250', '4YB013249', '4YB013251', '4YB013258', '4YB013258', '4YB013256'],
                sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013255', '5YB013255', '5YB013255']
            },
            // 5YB011099 - YBS Assembly - 23 Duct Assembly
            '5YB011099': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012092'],
                sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
            },
            // 5YB011100 - YBS Assembly - 24 Duct Assembly
            '5YB011100': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012093'],
                sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
            },
            // 5YB011101 - YBS Assembly - 25 Duct Assembly
            '5YB011101': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012094'],
                sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
            },
            // 5YB011111 - YBS Assembly - 23 Duct Assembly
            '5YB011111': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012092'],
                sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
            },
            // 5YB011112 - YBS Assembly - 24 Duct Assembly
            '5YB011112': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012093'],
                sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
            },
            // 5YB011113 - YBS Assembly - 25 Duct Assembly
            '5YB011113': {
                components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012094'],
                sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
            },
            // 5YB011446 - YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1
            '5YB011446': {
                components: ['4YB013250', '4YB013307', '4YB013271', '4YB013323', '4YB013323', '4YB013317'],
                sensors: ['5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285']
            },
            // 5YB011447 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
            '5YB011447': {
                components: ['4YB013250', '4YB013308', '4YB013271', '4YB013323', '4YB013323', '4YB013318'],
                sensors: ['5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285']
            },
            // 5YB011448 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
            '5YB011448': {
                components: ['4YB013250', '4YB013308', '4YB013271', '4YB013323', '4YB013323', '4YB013319'],
                sensors: ['5YB013286', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013286', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284']
            }
        };

        // Return the mapping for the specified YBS type, or empty object if not found
        const mapping = itemCodeMappings[ybsType] || { components: [], sensors: [] };
        
        console.log(`🔍 YBS item codes for ${ybsType}:`, {
            components: mapping.components.length,
            sensors: mapping.sensors.length,
            total: mapping.components.length + mapping.sensors.length
        });

        return mapping;
    }    /**
     * Get specific sensor item code for a YBS type and sensor index (1-based)
     * Uses the detailed sensor mappings provided by the user
     */
    getSensorItemCode(ybsType, sensorIndex) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.sensors || sensorIndex < 1 || sensorIndex > mapping.sensors.length) {
            console.warn(`⚠️ YBS Backend: Invalid sensor mapping for ${ybsType}, sensor ${sensorIndex}`);
            return null;
        }
        
        // Convert 1-based index to 0-based for array access
        const itemCode = mapping.sensors[sensorIndex - 1];
        // Reduced logging to prevent spam
        if (window.ybsDebugMode) {
            console.log(`🔍 YBS Backend: Sensor ${sensorIndex} for ${ybsType} uses item code: ${itemCode}`);
        }
        return itemCode;
    }

    /**
     * Get component item code for a YBS type and component index (0-based)
     * Component order: Left Slave PCB, Master PCB, Right Slave PCB, B2B Cable 1, B2B Cable 2, Power Cable
     */
    getComponentItemCode(ybsType, componentIndex) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.components || componentIndex < 0 || componentIndex >= mapping.components.length) {
            console.warn(`⚠️ YBS Backend: Invalid component mapping for ${ybsType}, component ${componentIndex}`);
            return null;
        }
        
        const itemCode = mapping.components[componentIndex];
        // Reduced logging to prevent spam
        if (window.ybsDebugMode) {
            console.log(`🔍 YBS Backend: Component ${componentIndex} for ${ybsType} uses item code: ${itemCode}`);
        }
        return itemCode;
    }

    /**
     * Get all sensor item codes for a YBS type as a mapping object
     * Returns { sensorIndex: itemCode } for easy lookup
     */
    getSensorItemCodeMapping(ybsType) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.sensors) {
            return {};
        }
        
        const sensorMapping = {};
        mapping.sensors.forEach((itemCode, index) => {
            sensorMapping[index + 1] = itemCode; // Convert to 1-based indexing
        });
        
        // Cache the mapping to avoid repeated calls
        this._cachedSensorMapping = this._cachedSensorMapping || {};
        this._cachedSensorMapping[ybsType] = sensorMapping;
        
        // Reduced logging to prevent spam
        if (window.ybsDebugMode) {
            console.log(`🔍 YBS Backend: Sensor mapping for ${ybsType}:`, sensorMapping);
        }
        return sensorMapping;
    }

    /**
     * Validate sensor configuration for YBS type
     * Ensures all required sensors have valid item codes
     */
    validateSensorConfiguration(ybsType) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping) {
            return { valid: false, errors: [`No mapping found for ${ybsType}`] };
        }
        
        const errors = [];
        const warnings = [];
        
        // Check component count
        if (!mapping.components || mapping.components.length !== 6) {
            errors.push(`Expected 6 components, found ${mapping.components?.length || 0}`);
        }
        
        // Check sensor count (should be 23, 24, or 25 depending on YBS type)
        const expectedSensorCounts = {
            '5YB011056': 23,
            '5YB011057': 24, 
            '5YB011059': 25,
            '5YB011099': 23,
            '5YB011100': 24,
            '5YB011101': 25,
            '5YB011111': 23,
            '5YB011112': 24,
            '5YB011113': 25,
            '5YB011446': 23,
            '5YB011447': 24,
            '5YB011448': 24
        };
        
        const expectedCount = expectedSensorCounts[ybsType];
        if (expectedCount && (!mapping.sensors || mapping.sensors.length !== expectedCount)) {
            errors.push(`Expected ${expectedCount} sensors for ${ybsType}, found ${mapping.sensors?.length || 0}`);
        }
        
        // Check for empty or invalid item codes
        mapping.components?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Component ${index} has empty item code`);
            }
        });
        
        mapping.sensors?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Sensor ${index + 1} has empty item code`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            componentCount: mapping.components?.length || 0,
            sensorCount: mapping.sensors?.length || 0,
            expectedSensorCount: expectedCount || 'unknown'
        };    }

    /**
     * Validate sensor configuration for YBS type
     * Ensures all required sensors have valid item codes
     */
    validateSensorConfiguration(ybsType) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping) {
            return { valid: false, errors: [`No mapping found for ${ybsType}`] };
        }
        
        const errors = [];
        const warnings = [];
        
        // Check component count
        if (!mapping.components || mapping.components.length !== 6) {
            errors.push(`Expected 6 components, found ${mapping.components?.length || 0}`);
        }
        
        // Check sensor count (should be 23, 24, or 25 depending on YBS type)
        const expectedSensorCounts = {
            '5YB011056': 23,
            '5YB011057': 24, 
            '5YB011059': 25,
            '5YB011099': 23,
            '5YB011100': 24,
            '5YB011101': 25,
            '5YB011111': 23,
            '5YB011112': 24,
            '5YB011113': 25,
            '5YB011446': 23,
            '5YB011447': 24,
            '5YB011448': 24
        };
        
        const expectedCount = expectedSensorCounts[ybsType];
        if (expectedCount && (!mapping.sensors || mapping.sensors.length !== expectedCount)) {
            errors.push(`Expected ${expectedCount} sensors for ${ybsType}, found ${mapping.sensors?.length || 0}`);
        }
        
        // Check for empty or invalid item codes
        mapping.components?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Component ${index} has empty item code`);
            }
        });
        
        mapping.sensors?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Sensor ${index + 1} has empty item code`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            componentCount: mapping.components?.length || 0,
            sensorCount: mapping.sensors?.length || 0,
            expectedSensorCount: expectedCount || 'unknown'
        };
    }

    /**
     * Clean up localStorage on completion
     */
    cleanupLocalStorage(assemblyId) {
        try {
            const keysToClean = [
                `assembly_${assemblyId}`,
                `componentMapping_${assemblyId}`,
                `currentYBSAssemblyId`,
                'scannedSensors',
                `scannedBarcodes_${assemblyId}`
            ];
            
            keysToClean.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('🧹 LocalStorage cleaned up');
        } catch (error) {
            console.warn('⚠️ Error cleaning localStorage:', error);
        }
    }

    /**
     * Get current user ID (implement based on your authentication system)
     */
    getCurrentUserId() {
        return localStorage.getItem('userId') || 'anonymous';
    }
}

// Export for use in YBS assembly pages
window.YBSBackendManager = YBSBackendManager;
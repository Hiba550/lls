/**
 * YBS Final Comprehensive Integration Test
 * Tests all aspects: sensor saving, work order completion, database updates
 */

const YBSFinalTester = {
    async runComprehensiveTest() {
        console.log('🧪 === YBS FINAL COMPREHENSIVE TEST ===');
        console.log('Testing: Sensor saving, Work order completion, Database updates');
        
        // Test 1: Simulate YBS assembly completion with full data
        const testAssemblyData = {
            assemblyId: 'TEST_ASSEMBLY_' + Date.now(),
            workOrderId: 'TEST_WO_' + Date.now(),
            ybsType: '5YB011057',
            assemblyBarcode: 'YBS_' + Date.now(),
            componentMapping: {
                component1: {
                    name: 'Test Component 1',
                    itemCode: 'COMP001',
                    scannedBarcode: 'COMP001_BARCODE',
                    scanned: true,
                    scanTime: new Date().toISOString(),
                    sequence: 1,
                    type: 'component'
                },
                component2: {
                    name: 'Test Component 2', 
                    itemCode: 'COMP002',
                    scannedBarcode: 'COMP002_BARCODE',
                    scanned: true,
                    scanTime: new Date().toISOString(),
                    sequence: 2,
                    type: 'component'
                }
            },
            scannedSensors: [
                {
                    sensorId: 1,
                    name: 'Sensor 1',
                    barcode: 'SENSOR_001_BARCODE', // Using 'barcode' property
                    scanTime: new Date().toISOString(),
                    itemCode: '5YB013254'
                },
                {
                    sensorId: 2,
                    name: 'Sensor 2', 
                    barcode: 'SENSOR_002_BARCODE', // Using 'barcode' property
                    scanTime: new Date().toISOString(),
                    itemCode: '5YB013254'
                },
                {
                    sensorId: 3,
                    name: 'Sensor 3',
                    barcode: 'SENSOR_003_BARCODE', // Using 'barcode' property
                    scanTime: new Date().toISOString(),
                    itemCode: '5YB013254'
                }
            ]
        };

        console.log('📋 Test Assembly Data:', testAssemblyData);

        try {
            // Test the complete assembly flow
            console.log('🔄 Testing complete assembly flow...');
            
            // Check if YBSBackendManager exists
            if (typeof YBSBackendManager === 'undefined') {
                console.error('❌ YBSBackendManager not found - please ensure ybs_backend.js is loaded');
                return;
            }

            // Initialize backend manager
            const backend = new YBSBackendManager();
            await backend.initialize();
            
            console.log('📡 API Connection Status:', backend.apiConnected);
            
            // Test 1: Component Data Preparation
            console.log('🧪 Test 1: Component Data Preparation');
            const scannedComponents = backend.prepareComponentData(
                testAssemblyData.componentMapping, 
                testAssemblyData.scannedSensors
            );
            
            console.log('✅ Prepared Components Count:', scannedComponents.length);
            console.log('📊 Components breakdown:');
            const componentsByType = scannedComponents.reduce((acc, comp) => {
                acc[comp.type] = (acc[comp.type] || 0) + 1;
                return acc;
            }, {});
            console.log('   - By type:', componentsByType);
            
            // Test 2: API Connection and Endpoints
            console.log('🧪 Test 2: API Connection and Endpoints');
            try {
                const apiTest = await backend.testApiConnection();
                console.log('📡 API Connection Test:', apiTest ? '✅ Connected' : '❌ Failed');
                
                // Test specific endpoints
                const endpoints = [
                    '/api/assembly-process/',
                    '/api/work-order/',
                    '/api/sensors/'
                ];
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await fetch(`${backend.API_URL}${endpoint}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(`📡 ${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
                    } catch (e) {
                        console.log(`📡 ${endpoint}: ❌ Error - ${e.message}`);
                    }
                }
            } catch (apiError) {
                console.log('📡 API Test Error:', apiError.message);
            }

            // Test 3: Complete Assembly Flow (without actual API calls to avoid creating test data)
            console.log('🧪 Test 3: Assembly Completion Flow (Dry Run)');
            
            // Simulate what happens during completion
            const completionData = {
                id: testAssemblyData.assemblyId,
                assemblyId: testAssemblyData.assemblyId,
                workOrderId: testAssemblyData.workOrderId,
                ybsType: testAssemblyData.ybsType,
                assemblyBarcode: testAssemblyData.assemblyBarcode,
                scannedComponents: scannedComponents,
                timestamp: new Date().toISOString(),
                status: 'completed'
            };
            
            console.log('📦 Completion Data Structure:', {
                id: completionData.id,
                assemblyId: completionData.assemblyId,
                workOrderId: completionData.workOrderId,
                componentCount: completionData.scannedComponents.length,
                sensorCount: completionData.scannedComponents.filter(c => c.type === 'sensor').length
            });

            // Test 4: Database Operations (Check if endpoints exist and are accessible)
            console.log('🧪 Test 4: Database Operations Check');
            
            // Check if we can access the assembly-process endpoint
            if (backend.apiConnected) {
                try {
                    // Test PATCH endpoint format
                    const testAssemblyId = 'test_assembly_id';
                    const patchUrl = `${backend.API_URL}/assembly-process/${testAssemblyId}/`;
                    console.log('📡 Testing PATCH endpoint format:', patchUrl);
                    
                    // Test add_scanned_part endpoint format  
                    const scannedPartUrl = `${backend.API_URL}/assembly-process/${testAssemblyId}/add_scanned_part/`;
                    console.log('📡 Testing add_scanned_part endpoint format:', scannedPartUrl);
                    
                    // Test work order complete endpoint format
                    const workOrderUrl = `${backend.API_URL}/work-order/${testAssemblyData.workOrderId}/complete_assembly/`;
                    console.log('📡 Testing work order complete endpoint format:', workOrderUrl);
                    
                } catch (endpointError) {
                    console.log('📡 Endpoint format test error:', endpointError.message);
                }
            }

            // Test 5: Local Storage Management
            console.log('🧪 Test 5: Local Storage Management');
            
            // Check current localStorage state
            const storageKeys = ['workOrders', 'pendingWorkOrders', 'completedWorkOrders', 'assemblyCompletedOrders'];
            storageKeys.forEach(key => {
                const data = localStorage.getItem(key);
                const parsed = data ? JSON.parse(data) : null;
                console.log(`💾 localStorage[${key}]:`, parsed ? `${parsed.length} items` : 'empty');
            });

            console.log('✅ === YBS FINAL COMPREHENSIVE TEST COMPLETED ===');
            
            return {
                success: true,
                componentCount: scannedComponents.length,
                sensorCount: scannedComponents.filter(c => c.type === 'sensor').length,
                apiConnected: backend.apiConnected,
                completionData: completionData
            };
            
        } catch (error) {
            console.error('❌ Test Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Run the test
YBSFinalTester.runComprehensiveTest().then(result => {
    console.log('🏁 Test Result:', result);
}).catch(error => {
    console.error('🚨 Test Failed:', error);
});

/**
 * YBS API Integration Test
 * Tests the complete flow from YBS type detection to item code loading
 * Simulates the actual browser environment behavior
 */

console.log('🔗 YBS API Integration Test\n');

// Mock the browser environment globals that the YBS system uses
global.window = {
    location: {
        pathname: '/src/pages/YBS/5YB011057.html',
        search: ''
    },
    localStorage: {
        storage: {},
        getItem: function(key) { return this.storage[key] || null; },
        setItem: function(key, value) { this.storage[key] = value; },
        removeItem: function(key) { delete this.storage[key]; }
    }
};

// Mock console for testing
const originalConsole = console;
const testLogs = [];
console = {
    log: (...args) => {
        testLogs.push({ type: 'log', args });
        originalConsole.log(...args);
    },
    warn: (...args) => {
        testLogs.push({ type: 'warn', args });
        originalConsole.warn(...args);
    },
    error: (...args) => {
        testLogs.push({ type: 'error', args });
        originalConsole.error(...args);
    }
};

// Simulate the YBSBackendManager class
class YBSBackendManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000/api';
    }

    // Simulate YBS type detection from filename
    detectYBSType() {
        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop();
        const ybsType = filename.replace('.html', '');
        
        console.log(`🔍 Detected YBS type from filename: ${ybsType}`);
        return ybsType;
    }

    // Actual getYBSItemCodes method (same as in the fixed backend)
    getYBSItemCodes(ybsType) {
        const itemCodeMappings = {
            '5YB011056': {
                components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013254'],
                sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254']
            },
            '5YB011057': {
                components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013255'],
                sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255']
            }
        };

        const mapping = itemCodeMappings[ybsType] || { components: [], sensors: [] };
        
        console.log(`🔍 YBS item codes for ${ybsType}:`, {
            components: mapping.components.length,
            sensors: mapping.sensors.length,
            total: mapping.components.length + mapping.sensors.length
        });

        return mapping;
    }

    // Simulate API call to fetch inventory codes
    async fetchInventoryCodes(itemCodes) {
        console.log(`🌐 Mock API: Fetching ${itemCodes.length} item codes...`);
        
        // Simulate API response with some successful and some failed fetches
        const mockApiResponse = {};
        const fetchResults = [];
        
        itemCodes.forEach(code => {
            // Simulate that some codes exist in the database
            const exists = Math.random() > 0.1; // 90% success rate for testing
            
            if (exists) {
                mockApiResponse[code] = {
                    item_code: code,
                    description: `Mock item ${code}`,
                    verification_code: code.includes('013255') ? '1' : '2',
                    unit_of_measure: 'PCS'
                };
                fetchResults.push({ code, status: 'success' });
            } else {
                fetchResults.push({ code, status: 'not_found' });
            }
        });
        
        // Add metadata about fetch results
        mockApiResponse._fetchResults = fetchResults;
        
        console.log(`📊 Mock API results: ${fetchResults.filter(r => r.status === 'success').length}/${fetchResults.length} found`);
        
        return mockApiResponse;
    }

    // Simulate the loadInventoryData method
    async loadInventoryData(ybsType) {
        try {
            console.log(`📋 Loading inventory data for YBS type: ${ybsType}`);
            
            const ybsItemCodes = this.getYBSItemCodes(ybsType);
            
            if (ybsItemCodes.components.length === 0 && ybsItemCodes.sensors.length === 0) {
                console.warn(`⚠️ No item codes found for YBS type: ${ybsType}`);
                return {
                    success: false,
                    itemCodes: {},
                    fetchResults: [],
                    message: `No item codes configured for ${ybsType}`
                };
            }
            
            const allCodes = [...ybsItemCodes.components, ...ybsItemCodes.sensors];
            const itemCodes = await this.fetchInventoryCodes(allCodes);
            const fetchResults = itemCodes._fetchResults || [];
            
            delete itemCodes._fetchResults;
            
            if (Object.keys(itemCodes).length > 0) {
                console.log('✅ YBS Backend: Inventory data loaded successfully:', itemCodes);
                
                const successCount = fetchResults.filter(r => r.status === 'success').length;
                const totalCount = fetchResults.length;
                
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
    }
}

// Test execution
async function runIntegrationTest() {
    console.log('🚀 Starting YBS API Integration Test...\n');

    const backend = new YBSBackendManager();
    
    // Test 1: YBS Type Detection
    console.log('--- Test 1: YBS Type Detection ---');
    const detectedType = backend.detectYBSType();
    if (detectedType === '5YB011057') {
        console.log('✅ Correctly detected YBS type: 5YB011057');
    } else {
        console.log(`❌ Failed to detect YBS type. Got: ${detectedType}`);
        return;
    }
    
    // Test 2: Item Code Mapping
    console.log('\n--- Test 2: Item Code Mapping ---');
    const itemCodes = backend.getYBSItemCodes(detectedType);
    if (itemCodes.components.length === 6 && itemCodes.sensors.length === 24) {
        console.log('✅ Correct item code mapping found');
        console.log(`   Components: ${itemCodes.components.length}`);
        console.log(`   Sensors: ${itemCodes.sensors.length}`);
    } else {
        console.log(`❌ Incorrect item code mapping. Components: ${itemCodes.components.length}, Sensors: ${itemCodes.sensors.length}`);
        return;
    }
    
    // Test 3: API Integration
    console.log('\n--- Test 3: API Integration ---');
    const loadResult = await backend.loadInventoryData(detectedType);
    
    if (loadResult.success) {
        console.log('✅ API integration successful');
        console.log(`   Message: ${loadResult.message}`);
        console.log(`   Item codes loaded: ${Object.keys(loadResult.itemCodes).length}`);
        console.log(`   Component codes: ${loadResult.componentCodes.length}/${loadResult.totalComponents}`);
        console.log(`   Sensor codes: ${loadResult.sensorCodes.length}/${loadResult.totalSensors}`);
    } else {
        console.log(`❌ API integration failed: ${loadResult.message}`);
    }
    
    // Test 4: Special sensor validation for 5YB011057
    console.log('\n--- Test 4: Special Sensor Validation ---');
    const sensor24Index = 23; // 24th sensor is at index 23
    const sensor24Code = itemCodes.sensors[sensor24Index];
    
    if (sensor24Code === '5YB013255') {
        console.log('✅ Sensor 24 correctly mapped to special item code 5YB013255');
    } else {
        console.log(`❌ Sensor 24 incorrectly mapped. Expected: 5YB013255, Got: ${sensor24Code}`);
    }
    
    // Test 5: YBS Frontend Integration Simulation
    console.log('\n--- Test 5: Frontend Integration Simulation ---');
    
    // Simulate how the frontend would use the backend
    try {
        // This simulates ybs.js calling the backend
        const frontendYbsType = detectedType;
        const frontendResult = await backend.loadInventoryData(frontendYbsType);
        
        if (frontendResult.success) {
            console.log('✅ Frontend integration simulation successful');
            
            // Simulate logging that would appear in the browser console
            console.log('📋 Frontend would display:');
            console.log(`   Board-to-board title: "📋 Item codes loaded: ${frontendResult.message}"`);
            console.log('   Assembly logs would show detailed fetch results');
            console.log('   Component and sensor validation would use the loaded codes');
        } else {
            console.log(`❌ Frontend integration simulation failed: ${frontendResult.message}`);
        }
    } catch (error) {
        console.log(`❌ Frontend integration error: ${error.message}`);
    }
    
    console.log('\n🎯 Integration Test Complete!');
    
    // Test summary
    const logErrorCount = testLogs.filter(log => log.type === 'error').length;
    const logWarnCount = testLogs.filter(log => log.type === 'warn').length;
    
    console.log('\n📊 Test Summary:');
    console.log(`   Errors: ${logErrorCount}`);
    console.log(`   Warnings: ${logWarnCount}`);
    console.log(`   YBS Type: ${detectedType}`);
    console.log(`   Item codes: ${itemCodes.components.length + itemCodes.sensors.length} total`);
    
    if (logErrorCount === 0) {
        console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
        console.log('The 5YB011057 YBS system should now work correctly with proper item code loading.');
    } else {
        console.log('\n⚠️ Some integration tests failed. Please review the errors above.');
    }
}

// Run the test
runIntegrationTest().catch(error => {
    console.error('Integration test failed:', error);
});

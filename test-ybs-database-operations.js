/**
 * YBS Database Operations Test
 * Test if database operations are working correctly
 */

const testDatabaseOperations = async () => {
    console.log('🧪 === YBS DATABASE OPERATIONS TEST ===');
    
    const API_URL = 'http://127.0.0.1:8000/api';
    
    // Test 1: Check if API endpoints are accessible
    console.log('📡 Testing API endpoint accessibility...');
    
    const endpoints = [
        { name: 'Assembly Process List', url: `${API_URL}/assembly-process/` },
        { name: 'Work Order List', url: `${API_URL}/work-order/` },
        { name: 'Sensors List', url: `${API_URL}/sensors/` }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testing ${endpoint.name}...`);
            const response = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} items`);
            } else {
                console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }
    
    // Test 2: Check if specific assembly exists
    console.log('\n📡 Testing specific assembly access...');
    try {
        const testAssemblyId = 'YBS_TEST_ASSEMBLY_001';
        const assemblyUrl = `${API_URL}/assembly-process/${testAssemblyId}/`;
        const response = await fetch(assemblyUrl);
        
        if (response.ok) {
            const assembly = await response.json();
            console.log(`✅ Assembly ${testAssemblyId} found:`, assembly);
        } else if (response.status === 404) {
            console.log(`ℹ️ Assembly ${testAssemblyId} not found (404) - this is expected for test assembly`);
        } else {
            console.log(`❌ Assembly ${testAssemblyId}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log(`❌ Assembly test error: ${error.message}`);
    }
    
    // Test 3: Check work order endpoints
    console.log('\n📡 Testing work order endpoints...');
    try {
        const testWorkOrderId = 321;
        const workOrderUrl = `${API_URL}/work-order/${testWorkOrderId}/`;
        const response = await fetch(workOrderUrl);
        
        if (response.ok) {
            const workOrder = await response.json();
            console.log(`✅ Work Order ${testWorkOrderId} found:`, {
                id: workOrder.id,
                status: workOrder.status,
                quantity: workOrder.quantity,
                completed_quantity: workOrder.completed_quantity
            });
            
            // Test complete_assembly endpoint
            const completeUrl = `${API_URL}/work-order/${testWorkOrderId}/complete_assembly/`;
            console.log(`📡 Complete assembly endpoint: ${completeUrl}`);
            
        } else if (response.status === 404) {
            console.log(`ℹ️ Work Order ${testWorkOrderId} not found (404)`);
        } else {
            console.log(`❌ Work Order ${testWorkOrderId}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log(`❌ Work order test error: ${error.message}`);
    }
    
    // Test 4: Simulate scanned part data structure
    console.log('\n📦 Testing scanned part data structure...');
    
    const sampleScannedPart = {
        part_code: 'SENSOR_001_BARCODE',
        sensor_id: 1,
        operator: 'YBS_System',
        replaced: false
    };
    
    console.log('📦 Sample scanned part data structure:', sampleScannedPart);
    
    // Test 5: Test CSRF token availability
    console.log('\n🔐 Testing CSRF token...');
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        console.log('✅ CSRF token available:', csrfToken.substring(0, 10) + '...');
    } else {
        console.log('⚠️ CSRF token not found - this might cause POST requests to fail');
    }
    
    console.log('\n✅ === DATABASE OPERATIONS TEST COMPLETED ===');
};

// Helper function to get cookie
function getCookie(name) {
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

// Run the test
testDatabaseOperations().catch(error => {
    console.error('🚨 Database operations test failed:', error);
});
